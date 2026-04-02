const SUPABASE_URL = window.SUPABASE_URL || 'https://mxeesqspauidsnsgpnwd.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'sb_publishable_-Zaw4TY489qG__OP3j8Ixw_Cu2BmUSY';

if (SUPABASE_URL.startsWith('COLE_') || SUPABASE_ANON_KEY.startsWith('COLE_')) {
  console.warn('Configure SUPABASE_URL e SUPABASE_ANON_KEY em js/supabaseClient.js');
}

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

