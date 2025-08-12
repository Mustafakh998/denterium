import { supabase } from "@/integrations/supabase/client";

export async function getSignedImageUrl(imagePath: string): Promise<string | null> {
  if (!imagePath) return null;
  
  try {
    // Handle both full URLs and relative paths
    if (imagePath.startsWith('http')) {
      // Already a full URL, return as is
      return imagePath;
    }
    
    // Clean the path - remove any duplicate bucket prefixes
    let cleanPath = imagePath;
    if (cleanPath.startsWith('medical-images/')) {
      cleanPath = cleanPath.replace('medical-images/', '');
    }
    
    const { data, error } = await supabase.storage
      .from('medical-images')
      .createSignedUrl(cleanPath, 3600);

    if (error) {
      console.error('Error generating signed URL:', error);
      // Fallback to public URL if signed URL fails
      const { data: publicData } = supabase.storage
        .from('medical-images')
        .getPublicUrl(cleanPath);
      return publicData?.publicUrl || null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Failed to generate signed URL:', error);
    return null;
  }
}