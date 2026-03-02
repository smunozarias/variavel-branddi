require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.storage.from('planilhas').list('');
  if (error) {
    console.error("Error listing files:", error);
    return;
  }
  console.log("Files in 'planilhas' bucket:");
  console.log(data);
}

check();
