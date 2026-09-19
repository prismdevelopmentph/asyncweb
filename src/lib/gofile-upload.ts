/**
 * Client-side utility for direct browser file uploads to free hosters (GoFile & Catbox).
 * Bypasses Vercel request body limits (4.5 MB limit) and handles network timeouts gracefully.
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
  // 1. Get GoFile upload server via server-side API proxy (bypasses browser CORS/timeout issues)
  let serverName = 'store1';
  try {
    const res = await fetch('/api/gofile-server');
    if (res.ok) {
      const data = await res.json();
      if (data.serverName) serverName = data.serverName;
    }
  } catch {
    // Fallback to store1 if server route fails
    serverName = 'store1';
  }

  const primaryUrl = `https://${serverName}.gofile.io/uploadFile`;

  try {
    return await executeUpload(primaryUrl, file, onProgress);
  } catch (primaryErr: any) {
    console.warn(`GoFile primary upload (${primaryUrl}) failed:`, primaryErr.message);

    // Try fallback GoFile store if primary failed
    const fallbackStore = serverName === 'store1' ? 'store2' : 'store1';
    const fallbackUrl = `https://${fallbackStore}.gofile.io/uploadFile`;

    try {
      return await executeUpload(fallbackUrl, file, onProgress);
    } catch (fallbackErr: any) {
      console.warn(`GoFile fallback upload (${fallbackUrl}) failed:`, fallbackErr.message);

      // Final fallback to Catbox upload if GoFile is completely unreachable
      return await uploadToCatbox(file, onProgress);
    }
  }
}

function executeUpload(
  uploadUrl: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<GofileUploadResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

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
              downloadPage: res.data.downloadPage || `https://gofile.io/d/${res.data.fileId}`,
              fileId: res.data.fileId || '',
              fileName: res.data.fileName || file.name,
            });
          } else {
            reject(new Error(res.message || 'GoFile returned non-ok status.'));
          }
        } catch (err: any) {
          reject(new Error(`Invalid JSON response: ${err.message}`));
        }
      } else {
        reject(new Error(`HTTP status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network connection error.')));
    xhr.addEventListener('timeout', () => reject(new Error('Upload connection timed out.')));
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted.')));

    xhr.timeout = 180000; // 3 min timeout
    xhr.open('POST', uploadUrl);
    xhr.send(formData);
  });
}

function uploadToCatbox(
  file: File,
  onProgress?: (percent: number) => void
): Promise<GofileUploadResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const url = xhr.responseText.trim();
        if (url.startsWith('http')) {
          resolve({
            downloadPage: url,
            fileId: url.split('/').pop() || '',
            fileName: file.name,
          });
        } else {
          reject(new Error(`Catbox error: ${url}`));
        }
      } else {
        reject(new Error(`Catbox HTTP status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Catbox network error.')));
    xhr.open('POST', 'https://catbox.moe/user/api.php');
    xhr.send(formData);
  });
}
