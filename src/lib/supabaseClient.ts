import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tlzgdfamlnprseemnvba.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // or SERVICE_ROLE_KEY on the server
export const supabase = createClient(supabaseUrl, supabaseKey)
