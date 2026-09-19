/**
 * Client-side utility for direct browser-to-GoFile file uploads.
 * Bypasses Vercel request body limits (4.5 MB limit) and supports files up to 1 GB+.
 */

export interface GofileUploadResult {
  downloadPage: string;
  fileId: string;
  fileName: string;
}

export async function uploadToGofile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<GofileUploadResult> {
  // 1. Fetch active upload server from GoFile API
  const serverRes = await fetch('https://api.gofile.io/servers');
  if (!serverRes.ok) {
    throw new Error('Failed to retrieve GoFile upload server endpoint.');
  }

  const serverData = await serverRes.json();
  if (serverData.status !== 'ok' || !serverData.data?.servers?.length) {
    throw new Error('GoFile servers currently unavailable.');
  }

  // Select first available server (e.g. store1, store2)
  const serverName = serverData.data.servers[0].name;
  const uploadUrl = `https://${serverName}.gofile.io/uploadFile`;

  // 2. Prepare FormData
  const formData = new FormData();
  formData.append('file', file);

  // 3. Perform XMLHttpRequest to track upload percentage
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.status === 'ok' && res.data) {
            resolve({
              downloadPage: res.data.downloadPage,
              fileId: res.data.fileId,
              fileName: res.data.fileName || file.name,
            });
          } else {
            reject(new Error(res.message || 'GoFile upload returned non-ok status.'));
          }
        } catch (err: any) {
          reject(new Error(`Failed to parse GoFile response: ${err.message}`));
        }
      } else {
        reject(new Error(`GoFile upload failed with HTTP status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error occurred during GoFile file upload.'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('File upload aborted by user.'));
    });

    xhr.open('POST', uploadUrl);
    xhr.send(formData);
  });
}
