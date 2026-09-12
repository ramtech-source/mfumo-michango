// =====================================================
// config.js - Mipangilio ya Supabase
// =====================================================

const SUPABASE_URL = 'https://nholybidpyvhknqvjntc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NPYGVJ-iA8r5s1-dY_B46Q_YJz2nOaR';

// Unda Supabase client - weka kwenye jina tofauti ili kuepuka mgongano
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true
    }
});

// App configuration
const APP_CONFIG = {
    APP_NAME: 'Mfumo wa Ukusanyaji wa Michango',
    VERSION: '1.0.0',
    SESSION_DURATION_HOURS: 8,
    DEFAULT_ACADEMIC_YEAR: '2026',
    DEFAULT_TERM: 'Term 1'
};

// Fanya client ipatikane kwa scripts zote
window.supabaseClient = supabaseClient;
window.supabase = supabaseClient;
window.APP_CONFIG = APP_CONFIG;
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;