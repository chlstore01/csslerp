import { createClient } from '@supabase/supabase-js'

// This tells the app: "Look at Vercel's settings for the keys"
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)