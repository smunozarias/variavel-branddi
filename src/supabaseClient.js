import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase env vars faltando. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env (na raiz).");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
