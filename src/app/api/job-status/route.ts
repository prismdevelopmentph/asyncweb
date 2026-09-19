import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');
  const userId = searchParams.get('userId');
  const fileName = searchParams.get('fileName') || 'resource.zip';
  const toolType = searchParams.get('toolType') || 'decrypt';
  const keyType = searchParams.get('keyType') || 'none';

  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId parameter' }, { status: 400 });
  }

  const vpsApiUrl = process.env.VPS_API_URL;
  const serviceKey = process.env.VPS_SERVICE_KEY || 'DCR-SVC-MK9N3XPQ-R8VL2WT7-J5YH6BFZ';

  if (!vpsApiUrl) {
    return NextResponse.json({ error: 'Processing engine URL not configured' }, { status: 500 });
  }

  try {
    const jobRes = await fetch(`${vpsApiUrl}/api/job/${jobId}`, {
      headers: { 'X-License-Key': serviceKey },
      cache: 'no-store',
    });

    if (!jobRes.ok) {
      const text = await jobRes.text();
      return NextResponse.json({ error: `Engine query failed: ${text}` }, { status: jobRes.status });
    }

    const data = await jobRes.json();

    // When job reaches success, ensure final output download URL is recorded in Supabase decryptions/fixes
    if (data.status === 'success' && data.resultUrl && userId) {
      const recordKey = `recorded_${jobId}`;
      if (!globalThis[recordKey as keyof typeof globalThis]) {
        (globalThis as any)[recordKey] = true;

        const keyLabel = keyType === 'cfxkey' ? 'CFX Key' : keyType === 'grants' ? 'Grants.txt' : 'Auto/No Key';

        if (toolType === 'fixer') {
          await supabaseAdmin.from('fixes').insert({
            user_id: userId,
            file_name: fileName,
            models: data.stats?.models || 1,
            vertices_fixed: data.stats?.verticesFixed || 150,
            download_url: data.resultUrl,
            status: 'SUCCESS',
          });
        } else {
          await supabaseAdmin.from('decryptions').insert({
            user_id: userId,
            file_name: fileName,
            key_type: keyLabel,
            decrypted: 1,
            failed: 0,
            download_url: data.resultUrl,
            status: 'SUCCESS',
          });

          if (toolType === 'decryptfix') {
            await supabaseAdmin.from('fixes').insert({
              user_id: userId,
              file_name: fileName,
              models: data.stats?.models || 1,
              vertices_fixed: data.stats?.verticesFixed || 150,
              download_url: data.resultUrl,
              status: 'SUCCESS',
            });
          }
        }
      }
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to query engine status' }, { status: 502 });
  }
}
