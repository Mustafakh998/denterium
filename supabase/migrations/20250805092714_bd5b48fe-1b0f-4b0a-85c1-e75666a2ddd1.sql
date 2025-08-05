-- Insert supplier record for existing user with supplier role
-- First, let's create a function to automatically create supplier records for users with supplier role

-- Insert a supplier record for the current user (we can see from logs they have user_id a9e77bb7-039b-4401-89ce-7d493144945c)
INSERT INTO suppliers (
  user_id, 
  company_name, 
  email, 
  is_active, 
  verified, 
  rating, 
  total_reviews
)
SELECT 
  p.user_id,
  COALESCE(p.first_name || ' ' || p.last_name, 'Supplier Company') as company_name,
  p.email,
  true as is_active,
  false as verified,
  0 as rating,
  0 as total_reviews
FROM profiles p 
WHERE p.role = 'supplier' 
  AND p.user_id NOT IN (SELECT user_id FROM suppliers WHERE user_id IS NOT NULL)
  AND p.user_id IS NOT NULL;

-- Create a trigger function to automatically create supplier records when a profile is created with supplier role
CREATE OR REPLACE FUNCTION create_supplier_for_supplier_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- If the profile role is supplier and there's no supplier record yet
  IF NEW.role = 'supplier' AND NEW.user_id IS NOT NULL THEN
    INSERT INTO suppliers (
      user_id,
      company_name,
      email,
      is_active,
      verified,
      rating,
      total_reviews
    ) VALUES (
      NEW.user_id,
      COALESCE(NEW.first_name || ' ' || NEW.last_name, 'Supplier Company'),
      NEW.email,
      true,
      false,
      0,
      0
    ) ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires after profile insert or update
CREATE OR REPLACE TRIGGER trigger_create_supplier_for_supplier_profile
  AFTER INSERT OR UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_supplier_for_supplier_profile();