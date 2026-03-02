require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
console.log('URL:', supabaseUrl, 'KEY:', supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.storage.from('planilhas').list('');
  if (error) {
    console.error("Error listing files:", error);
    return;
  }
  console.log("Files in 'planilhas' bucket:", data);
  const { data: dbData, error: dbError } = await supabase.storage.from('planilhas').download('HISTORY_DB.json');
  if (dbError) {
    console.error("Error downloading history:", dbError);
    return;
  }
  const text = await dbData.text();
  console.log("HISTORY_DB.json:", text);
}

check();
