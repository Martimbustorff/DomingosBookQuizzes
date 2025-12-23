// Environment variable validation utilities

export const REQUIRED_ENV_VARS = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
} as const;

export function validateEnvVars(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  Object.entries(REQUIRED_ENV_VARS).forEach(([key, value]) => {
    if (!value) {
      missing.push(key);
    }
  });

  return {
    valid: missing.length === 0,
    missing,
  };
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  );
}
