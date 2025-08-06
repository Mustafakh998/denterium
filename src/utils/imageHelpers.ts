import { supabase } from "@/integrations/supabase/client";

export async function getSignedImageUrl(imagePath: string): Promise<string | null> {
  if (!imagePath) return null;
  
  try {
    const { data, error } = await supabase.storage
      .from('medical-images')
      .createSignedUrl(imagePath, 3600);

    if (error) {
      console.error('Error generating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Failed to generate signed URL:', error);
    return null;
  }
}