-- Create missing RLS policies only

-- Appointments policies (missing)
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

-- Clinics policies (missing)  
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

-- Invoices policies (missing)
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

-- Medical images policies (missing)
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

-- Patients policies (missing)
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

-- Prescriptions policies (missing)
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

-- Treatments policies (missing)
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