import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    const ownerUserId = formData.get('ownerUserId') as string | null;

    // Security Gate
    const isOwner =
      ownerUserId === '719482630633947166' ||
      ownerUserId === process.env.OWNER_USER_ID ||
      ownerUserId === process.env.NEXT_PUBLIC_OWNER_USER_ID;

    if (!isOwner) {
      return NextResponse.json({ error: 'Unauthorized: Owner access required' }, { status: 403 });
    }

    if (!file) {
      return NextResponse.json({ error: 'No image file uploaded' }, { status: 400 });
    }

    // Size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image size exceeds maximum limit of 5MB' }, { status: 400 });
    }

    const mimeType = file.type || 'image/png';
    const allowedMime = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowedMime.includes(mimeType.toLowerCase())) {
      return NextResponse.json({ error: 'Unsupported file type. Allowed: PNG, JPG, WEBP, GIF, SVG' }, { status: 400 });
    }

    const extension = mimeType.split('/')[1]?.replace('+xml', '') || 'png';
    const randomHex = crypto.randomBytes(6).toString('hex');
    const fileName = `prod_${Date.now()}_${randomHex}.${extension}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from('product-images')
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true
      });

    if (uploadError) {
      console.error('[Upload API] Supabase storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload image to storage bucket' }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      fileName
    });
  } catch (error: any) {
    console.error('[Upload API] Fatal error:', error);
    return NextResponse.json({ error: error.message || 'Image upload failed' }, { status: 500 });
  }
}
