const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ikdthvwzbxwigknxbhuw.supabase.co';
const supabaseKey = 'sb_publishable_0RDkZRmULpDK0Bc4DD0cDg_Izn_Pkdq';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;