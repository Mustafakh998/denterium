-- Create prescriptions table
CREATE TABLE public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES public.clinics(id),
  patient_id UUID REFERENCES public.patients(id),
  dentist_id UUID REFERENCES public.profiles(id),
  prescription_number TEXT UNIQUE,
  patient_name TEXT NOT NULL,
  patient_age INTEGER,
  prescribed_drugs JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for prescriptions
CREATE POLICY "Clinic members can view prescriptions" 
ON public.prescriptions 
FOR SELECT 
USING (clinic_id IN ( SELECT profiles.clinic_id
   FROM profiles
  WHERE (profiles.user_id = auth.uid())));

CREATE POLICY "Clinic members can create prescriptions" 
ON public.prescriptions 
FOR INSERT 
WITH CHECK (clinic_id IN ( SELECT profiles.clinic_id
   FROM profiles
  WHERE (profiles.user_id = auth.uid())));

CREATE POLICY "Clinic members can update prescriptions" 
ON public.prescriptions 
FOR UPDATE 
USING (clinic_id IN ( SELECT profiles.clinic_id
   FROM profiles
  WHERE (profiles.user_id = auth.uid())));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_prescriptions_updated_at
BEFORE UPDATE ON public.prescriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate prescription numbers
CREATE OR REPLACE FUNCTION generate_prescription_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
BEGIN
    -- Get the current year
    SELECT EXTRACT(YEAR FROM NOW()) INTO counter;
    
    -- Generate a prescription number like RX-2024-00001
    SELECT 'RX-' || counter || '-' || LPAD((
        SELECT COUNT(*) + 1 
        FROM prescriptions 
        WHERE EXTRACT(YEAR FROM created_at) = counter
    )::TEXT, 5, '0') INTO new_number;
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;