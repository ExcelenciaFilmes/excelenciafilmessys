import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    define: {
      // Mapeia a API Key do Google (que pode vir como API_KEY) para o padrão VITE_
      'import.meta.env.VITE_GOOGLE_API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY || ''),
      // As variáveis VITE_SUPABASE_* são injetadas automaticamente pelo Vite se estiverem no process.env ou .env
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});