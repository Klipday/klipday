/**
 * Configuration helper for Supabase Storage.
 */
function GetSupabaseStorageConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'campaign_thumbnails';

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  const cleanUrl = supabaseUrl.replace(/\/+$/, '');
  const config = {
    supabaseUrl: cleanUrl,
    serviceRoleKey,
    bucket,
  };

  return config;
}

/**
 * Checks whether a given URL is already hosted on Supabase Storage.
 *
 * @param url - URL string to check.
 * @returns True if URL belongs to configured Supabase storage bucket.
 */
export function IsSupabaseStorageUrl(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }
  const config = GetSupabaseStorageConfig();
  if (config && url.includes(config.supabaseUrl)) {
    return true;
  }
  return url.includes('supabase.co');
}

/**
 * Uploads a raw buffer to Supabase Storage and returns its permanent public URL.
 *
 * @param path - Destination storage path (e.g. 'avatars/creator-123.jpg').
 * @param buffer - File contents as ArrayBuffer or Buffer.
 * @param contentType - MIME type of the file.
 * @returns Public URL string or null on failure.
 */
export async function UploadToSupabaseStorage(path: string, buffer: ArrayBuffer | Buffer, contentType: string): Promise<string | null> {
  const config = GetSupabaseStorageConfig();
  if (!config) {
    return null;
  }

  const targetUrl = `${config.supabaseUrl}/storage/v1/object/${config.bucket}/${path}`;

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.serviceRoleKey}`,
      apikey: config.serviceRoleKey,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: buffer,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    console.warn(`[Supabase Storage] Upload failed (${response.status}):`, errorText);
    return null;
  }

  const publicUrl = `${config.supabaseUrl}/storage/v1/object/public/${config.bucket}/${path}`;
  return publicUrl;
}

/**
 * Downloads an image from an external URL (e.g. TikTok CDN) and persists it permanently to Supabase Storage.
 * Generates a permanent public asset URL that avoids CDN link expiry.
 *
 * @param avatarSourceUrl - Ephemeral source image URL.
 * @param creatorId - Creator database identifier.
 * @param platform - Social media platform name.
 * @param username - Clean username handle.
 * @returns Permanent public Supabase storage URL or null if failed.
 */
export async function PersistSocialAvatarToStorage(
  avatarSourceUrl: string,
  creatorId: string,
  platform: string,
  username: string
): Promise<string | null> {
  const config = GetSupabaseStorageConfig();
  if (!config) {
    return null;
  }

  // If already hosted on Supabase Storage, reuse existing permanent URL
  if (IsSupabaseStorageUrl(avatarSourceUrl)) {
    return avatarSourceUrl;
  }

  try {
    const downloadResponse = await fetch(avatarSourceUrl, {
      headers: {
        Accept: 'image/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    if (!downloadResponse.ok) {
      return null;
    }

    const imageBuffer = await downloadResponse.arrayBuffer();
    const contentType = downloadResponse.headers.get('content-type')?.split(';')[0].trim() || 'image/jpeg';
    const extension = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpeg';

    const cleanUsername = username.replace(/^@/, '').toLowerCase().trim();
    const cleanPlatform = platform.toLowerCase().trim();
    const storagePath = `avatars/${creatorId}-${cleanPlatform}-${cleanUsername}.${extension}`;

    const uploadedUrl = await UploadToSupabaseStorage(storagePath, imageBuffer, contentType);
    return uploadedUrl;
  } catch (err) {
    console.warn('[Supabase Storage] Failed to persist social avatar:', err);
    return null;
  }
}

/**
 * Downloads a video thumbnail from an external URL (e.g. TikTok CDN) and persists it permanently to Supabase Storage.
 * Generates a permanent public asset URL that avoids CDN link expiry and browser session/referral blocking.
 *
 * @param thumbnailSourceUrl - Ephemeral source image URL from video scrape.
 * @param identifier - Unique identifier for storage path naming (e.g. videoId, submissionId).
 * @returns Permanent public Supabase storage URL or null if failed.
 */
export async function PersistVideoThumbnailToStorage(thumbnailSourceUrl: string, identifier: string): Promise<string | null> {
  const config = GetSupabaseStorageConfig();
  if (!config) {
    return null;
  }

  // If already hosted on Supabase Storage, reuse existing permanent URL
  if (IsSupabaseStorageUrl(thumbnailSourceUrl)) {
    return thumbnailSourceUrl;
  }

  try {
    const downloadResponse = await fetch(thumbnailSourceUrl, {
      headers: {
        Accept: 'image/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!downloadResponse.ok) {
      return null;
    }

    const imageBuffer = await downloadResponse.arrayBuffer();
    const contentType = downloadResponse.headers.get('content-type')?.split(';')[0].trim() || 'image/jpeg';
    const extension = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpeg';

    const cleanIdentifier = identifier
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toLowerCase()
      .trim();
    const storagePath = `submissions/thumbnails/${cleanIdentifier}.${extension}`;

    const uploadedUrl = await UploadToSupabaseStorage(storagePath, imageBuffer, contentType);
    return uploadedUrl;
  } catch (err) {
    console.warn('[Supabase Storage] Failed to persist video thumbnail:', err);
    return null;
  }
}
