export async function ensureSupplierExists(supabase: any, user: any, profile?: any): Promise<string | null> {
  if (!user?.id) return null;

  // Check existing supplier
  const { data: existing, error: fetchError } = await supabase
    .from('suppliers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing?.id) return existing.id as string;

  // Build basic supplier payload
  const companyName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(' ') || user.email || 'Supplier';

  const payload = {
    user_id: user.id,
    company_name: companyName,
    email: user.email || null,
    is_active: true,
    verified: false,
  };

  const { data: created, error: insertError } = await supabase
    .from('suppliers')
    .insert(payload)
    .select('id')
    .maybeSingle();

  if (insertError) {
    console.error('ensureSupplierExists insertError', insertError);
    return null;
  }

  return created?.id ?? null;
}
