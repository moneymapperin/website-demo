// Signed URL, expires 2027-11-14. Replace with a permanent public link when available.
const DEFAULT_APK_URL =
  'https://upxsmlmsqxcwknvtywgk.supabase.co/storage/v1/object/sign/MoneyMapper_Test_Bucket/MoneyMapper_apk?token=eyJraWQiOiIyOTc1OWIzYy1iODY0LTQ5YWMtYjk0MS0yMWIwYmFlOTU5ZWYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJNb25leU1hcHBlcl9UZXN0X0J1Y2tldC9Nb25leU1hcHBlcl9hcGsiLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzk0NjUyOTU3LCJleHAiOjE4MjYxODg5NTd9.D1jU7mvDOs0y_9_9FgJeR2FriEBx4fXuFxCrIbVf9ow';

export const APK_DOWNLOAD_URL: string =
  (import.meta.env.VITE_APK_DOWNLOAD_URL as string | undefined)?.trim() || DEFAULT_APK_URL;

export const APK_FILE_NAME = 'MoneyMapper.apk';

export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.moneymapper&hl=en';

/**
 * Returns APK_DOWNLOAD_URL with download=MoneyMapper.apk query parameter.
 * Preserves existing query params (including token) and does not duplicate download param.
 */
export function getApkDownloadHref(): string {
  if (!APK_DOWNLOAD_URL) return '';
  try {
    const url = new URL(APK_DOWNLOAD_URL);
    if (!url.searchParams.has('download')) {
      url.searchParams.set('download', APK_FILE_NAME);
    }
    return url.toString();
  } catch {
    return APK_DOWNLOAD_URL;
  }
}
