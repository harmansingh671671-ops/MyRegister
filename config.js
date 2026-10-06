// Configuration should be loaded from environment variables
// For security, never hardcode credentials in source code
// Use environment variables or a secure configuration service

export const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

// Validate that required configuration is present
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Supabase configuration missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.");
}
