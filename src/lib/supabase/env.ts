export function supabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!value) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  return value;
}

export function supabaseAnonKey() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!value) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
  return value;
}

export function supabaseServiceRoleKey() {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!value) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return value;
}

export function superAdminEmails() {
  return (process.env.SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}
