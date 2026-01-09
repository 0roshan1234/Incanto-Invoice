import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Ensure it is always a string to prevent JSON.stringify(undefined)
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      // Polyfill process.env safely
      'process.env': {}
    }
  }
})