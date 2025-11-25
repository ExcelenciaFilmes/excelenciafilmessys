
import { createClient } from '@supabase/supabase-js';

// URL e Chave fornecidas pelo usuário
// Usamos estes valores como fallback (plano B) caso as variáveis de ambiente da Vercel não carreguem.
const FALLBACK_URL = 'https://ihgqociggnimibzbasdj.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloZ3FvY2lnZ25pbWliemJhc2RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5ODM2MDEsImV4cCI6MjA3ODU1OTYwMX0.m559KJavbd7AW81JDsNotCmCuLGfsS-kbHevi17svJI';

// Tenta pegar do ambiente (Vercel), se não tiver, usa o fallback hardcoded
// Casting "as string" para garantir ao TS que isso não será undefined
const supabaseUrl = (import.meta.env?.VITE_SUPABASE_URL || FALLBACK_URL) as string;
const supabaseAnonKey = (import.meta.env?.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY) as string;

// Verificação de segurança no console para ajudar no debug (aparecerá no F12 do navegador)
console.log('Inicializando Supabase...', { 
  url: supabaseUrl ? 'Definida' : 'Indefinida', 
  keyDefined: !!supabaseAnonKey 
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERRO CRÍTICO: Credenciais do Supabase ausentes.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);