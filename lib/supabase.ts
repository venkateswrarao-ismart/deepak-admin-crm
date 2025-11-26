import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import { createClient as createClientFromUtils } from "@/utils/supabase/client"

// Use the singleton client from utils/supabase/client.ts
export const createSupabaseClient = () => createClientFromUtils()

export const createSupabaseServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient<Database>(supabaseUrl, supabaseServiceKey)
}
