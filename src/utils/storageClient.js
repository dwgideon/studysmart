import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadImageToStorage(filePath, fileBlob) {
  const { data, error } = await supabase
    .storage
    .from('study-images')
    .upload(filePath, fileBlob, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error("Error uploading to storage:", error);
    return null;
  }

  const { publicUrl } = supabase
    .storage
    .from('study-images')
    .getPublicUrl(filePath).data;

  return publicUrl;
}
