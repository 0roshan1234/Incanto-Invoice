import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // The third parameter '' allows loading all env vars, not just VITE_ prefixed ones.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Robustly try to find the key in various locations.
  // Vercel build environment variables might be in process.env or loaded into env.
  // We also check for VITE_API_KEY as a fallback if the user renames it.
  const apiKey = env.VITE_API_KEY || env.API_KEY || process.env.VITE_API_KEY || process.env.API_KEY || '';

  return {
    plugins: [react()],
    define: {
      // Define the specific key replacement. 
      // This replaces `process.env.API_KEY` in the source code with the actual string value during build.
      'process.env.API_KEY': JSON.stringify(apiKey),
    }
  }
})