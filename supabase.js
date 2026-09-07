const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or Key in environment variables.");
}

// anon client — used only for verifying user JWTs (supabase.auth.getUser)
const supabase = createClient(supabaseUrl, supabaseKey);

// service role client — bypasses RLS, used for all DB and Storage operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);

module.exports = supabase;
module.exports.supabaseAdmin = supabaseAdmin;
