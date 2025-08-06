-- Add missing foreign key constraint between manual_payments and profiles
ALTER TABLE public.manual_payments 
ADD CONSTRAINT manual_payments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Also add foreign key for clinic_id if it doesn't exist
ALTER TABLE public.manual_payments 
ADD CONSTRAINT manual_payments_clinic_id_fkey 
FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE SET NULL;

-- Add foreign key for reviewed_by if it doesn't exist  
ALTER TABLE public.manual_payments 
ADD CONSTRAINT manual_payments_reviewed_by_fkey 
FOREIGN KEY (reviewed_by) REFERENCES public.profiles(user_id) ON DELETE SET NULL;