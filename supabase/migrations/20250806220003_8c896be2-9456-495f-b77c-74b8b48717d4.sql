-- Create RLS policies for medical images storage bucket
-- Allow clinic members to upload medical images
CREATE POLICY "Clinic members can upload medical images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'medical-images' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.clinic_id IS NOT NULL
  )
);

-- Allow clinic members to view medical images from their clinic
CREATE POLICY "Clinic members can view their medical images" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'medical-images' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.clinic_id IS NOT NULL
  )
);

-- Allow clinic members to update medical images from their clinic
CREATE POLICY "Clinic members can update their medical images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'medical-images' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.clinic_id IS NOT NULL
  )
);

-- Allow clinic members to delete medical images from their clinic
CREATE POLICY "Clinic members can delete their medical images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'medical-images' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.clinic_id IS NOT NULL
  )
);