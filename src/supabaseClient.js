import { createClient } from '@supabase/supabase-js'

// This is the professional way to handle keys
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("CRITICAL ERROR: Supabase keys are missing from the .env file!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)