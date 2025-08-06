-- Fix medical images storage issues
-- 1. Create proper RLS policies for medical-images bucket access

-- Policy for authenticated users to view images from their clinic
CREATE POLICY "Users can view medical images from their clinic" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'medical-images' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND (
      (storage.foldername(name))[1] = p.clinic_id::text
      OR 
      name LIKE 'medical-images/' || p.clinic_id::text || '/%'
    )
  )
);

-- Policy for authenticated users to upload images to their clinic folder
CREATE POLICY "Users can upload medical images to their clinic folder" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'medical-images' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND (
      (storage.foldername(name))[1] = p.clinic_id::text
      OR 
      name LIKE 'medical-images/' || p.clinic_id::text || '/%'
    )
  )
);

-- Policy for authenticated users to update images from their clinic
CREATE POLICY "Users can update medical images from their clinic" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'medical-images' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND (
      (storage.foldername(name))[1] = p.clinic_id::text
      OR 
      name LIKE 'medical-images/' || p.clinic_id::text || '/%'
    )
  )
);

-- Policy for authenticated users to delete images from their clinic
CREATE POLICY "Users can delete medical images from their clinic" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'medical-images' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND (
      (storage.foldername(name))[1] = p.clinic_id::text
      OR 
      name LIKE 'medical-images/' || p.clinic_id::text || '/%'
    )
  )
);