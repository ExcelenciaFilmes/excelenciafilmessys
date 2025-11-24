import { createClient } from '@supabase/supabase-js';

// Fallbacks hardcoded (Solicitados pelo usuário como segurança)
const FALLBACK_URL = 'https://ihgqociggnimibzbasdj.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloZ3FvY2lnZ25pbWliemJhc2RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5ODM2MDEsImV4cCI6MjA3ODU1OTYwMX0.m559KJavbd7AW81JDsNotCmCuLGfsS-kbHevi17svJI';

const getEnv = (key: keyof ImportMetaEnv) => {
  // Agora o TypeScript sabe que import.meta.env existe graças ao vite-env.d.ts corrigido
  return import.meta.env[key] || '';
};

const envUrl = getEnv('VITE_SUPABASE_URL');
const envKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Usa a variável de ambiente se existir, senão usa o fallback
const supabaseUrl = envUrl && envUrl.length > 0 ? envUrl : FALLBACK_URL;
const supabaseAnonKey = envKey && envKey.length > 0 ? envKey : FALLBACK_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
