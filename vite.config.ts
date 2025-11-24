
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// URL e Key para injeção direta no build se necessário
const SUPABASE_URL = 'https://ihgqociggnimibzbasdj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloZ3FvY2lnZ25pbWliemJhc2RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5ODM2MDEsImV4cCI6MjA3ODU1OTYwMX0.m559KJavbd7AW81JDsNotCmCuLGfsS-kbHevi17svJI';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    define: {
      // Garante que a API Key do Gemini esteja disponível
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY || ''),
      // Define variaveis do Supabase globalmente caso o import.meta.env falhe
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || SUPABASE_KEY),
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});
