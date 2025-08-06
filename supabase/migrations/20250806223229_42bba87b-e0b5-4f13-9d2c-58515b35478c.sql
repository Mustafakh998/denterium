-- Fix storage policies for medical-images bucket
-- First, make sure the bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('medical-images', 'medical-images', false, 52428800, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- Storage policies for medical images
-- Users can view images from their clinic
CREATE POLICY "Users can view medical images from their clinic" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'medical-images' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.clinic_id = (storage.foldername(name))[1]
  )
);

-- Users can upload medical images to their clinic folder
CREATE POLICY "Users can upload medical images to their clinic" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'medical-images' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.clinic_id = (storage.foldername(name))[1]
  )
);

-- Users can update medical images in their clinic folder
CREATE POLICY "Users can update medical images in their clinic" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'medical-images' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.clinic_id = (storage.foldername(name))[1]
  )
);

-- Users can delete medical images from their clinic folder
CREATE POLICY "Users can delete medical images from their clinic" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'medical-images' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.clinic_id = (storage.foldername(name))[1]
  )
);