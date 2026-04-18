import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Variabili VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY mancanti in .env.local')
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey)
