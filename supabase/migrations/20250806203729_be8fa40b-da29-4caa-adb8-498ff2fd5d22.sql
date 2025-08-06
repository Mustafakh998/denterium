-- Fix RLS policies for all tables that need them

-- Appointments policies
CREATE POLICY "Clinic members can manage appointments"
ON appointments FOR ALL
TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM profiles 
    WHERE user_id = auth.uid()
  )
);

-- Clinics policies
CREATE POLICY "Clinic owners can manage their clinic"
ON clinics FOR ALL
TO authenticated
USING (
  id IN (
    SELECT clinic_id FROM profiles 
    WHERE user_id = auth.uid() AND clinic_id IS NOT NULL
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Invoices policies
CREATE POLICY "Clinic members can manage invoices"
ON invoices FOR ALL
TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM profiles 
    WHERE user_id = auth.uid()
  )
);

-- Medical images policies
CREATE POLICY "Clinic members can manage medical images"
ON medical_images FOR ALL
TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM profiles 
    WHERE user_id = auth.uid()
  )
);

-- Patients policies
CREATE POLICY "Clinic members can manage patients"
ON patients FOR ALL
TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM profiles 
    WHERE user_id = auth.uid()
  )
);

-- Prescriptions policies
CREATE POLICY "Clinic members can manage prescriptions"
ON prescriptions FOR ALL
TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM profiles 
    WHERE user_id = auth.uid()
  )
);

-- Treatments policies
CREATE POLICY "Clinic members can manage treatments"
ON treatments FOR ALL
TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM profiles 
    WHERE user_id = auth.uid()
  )
);

-- Suppliers policies
CREATE POLICY "Everyone can view active suppliers"
ON suppliers FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Suppliers can manage their own data"
ON suppliers FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Products policies
CREATE POLICY "Everyone can view active products"
ON products FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Suppliers can manage their own products"
ON products FOR ALL
TO authenticated
USING (
  supplier_id IN (
    SELECT id FROM suppliers 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  supplier_id IN (
    SELECT id FROM suppliers 
    WHERE user_id = auth.uid()
  )
);