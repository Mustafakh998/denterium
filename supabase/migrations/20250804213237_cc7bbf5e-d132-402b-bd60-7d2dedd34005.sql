-- First, let's create a default clinic for this user
INSERT INTO public.clinics (name, email, phone, address)
VALUES ('عيادة الدكتور مصطفى هادي', 'mustafa.hk998@gmail.com', '078102722438', 'بغداد، العراق');

-- Now update the user's profile to link to this clinic
UPDATE public.profiles 
SET clinic_id = (SELECT id FROM public.clinics WHERE email = 'mustafa.hk998@gmail.com'),
    updated_at = now()
WHERE user_id = '0234fa03-10e4-486d-9e7b-be404fcb427a';