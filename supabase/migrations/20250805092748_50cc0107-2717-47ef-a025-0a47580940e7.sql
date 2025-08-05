-- Fix search_path security issue for functions
ALTER FUNCTION public.create_supplier_for_supplier_profile() SET search_path = 'public';
ALTER FUNCTION public.generate_prescription_number() SET search_path = 'public';