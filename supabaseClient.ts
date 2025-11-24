import { createClient } from '@supabase/supabase-js';

// Fallbacks hardcoded (Solicitados pelo usuário como segurança)
const FALLBACK_URL = 'https://ihgqociggnimibzbasdj.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloZ3FvY2lnZ25pbWliemJhc2RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5ODM2MDEsImV4cCI6MjA3ODU1OTYwMX0.m559KJavbd7AW81JDsNotCmCuLGfsS-kbHevi17svJI';

// Acesso seguro às variáveis de ambiente
// O cast (import.meta as any) evita erros de TS se a definição estiver incompleta
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    return import.meta.env?.[key] || '';
  } catch (e) {
    return '';
  }
};

const envUrl = getEnv('VITE_SUPABASE_URL');
const envKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Usa a variável de ambiente se existir, senão usa o fallback
const supabaseUrl = envUrl && envUrl.length > 0 ? envUrl : FALLBACK_URL;
const supabaseAnonKey = envKey && envKey.length > 0 ? envKey : FALLBACK_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);