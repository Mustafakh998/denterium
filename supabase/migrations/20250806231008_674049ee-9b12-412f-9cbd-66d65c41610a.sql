-- Phase 1: Data Cleanup and Standardization
-- Normalize all image_url and thumbnail_url entries to use consistent relative paths

-- Update image_url: extract just the file path from full URLs
UPDATE medical_images 
SET image_url = CASE 
  WHEN image_url LIKE 'https://%.supabase.co/%' THEN 
    -- Extract path after the last 'medical-images/' occurrence
    SUBSTRING(image_url FROM '.*medical-images/(.*)$')
  ELSE 
    image_url -- Already a relative path
END
WHERE image_url IS NOT NULL;

-- Update thumbnail_url: extract just the file path from full URLs  
UPDATE medical_images 
SET thumbnail_url = CASE 
  WHEN thumbnail_url LIKE 'https://%.supabase.co/%' THEN 
    -- Extract path after the last 'medical-images/' occurrence
    SUBSTRING(thumbnail_url FROM '.*medical-images/(.*)$')
  ELSE 
    thumbnail_url -- Already a relative path
END
WHERE thumbnail_url IS NOT NULL;

-- Remove any duplicate 'medical-images/' prefix that might have been created
UPDATE medical_images 
SET image_url = REPLACE(image_url, 'medical-images/', '')
WHERE image_url LIKE 'medical-images/%';

UPDATE medical_images 
SET thumbnail_url = REPLACE(thumbnail_url, 'medical-images/', '')
WHERE thumbnail_url LIKE 'medical-images/%';