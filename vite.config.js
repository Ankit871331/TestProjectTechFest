import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss(),],
 server:{
port:3000,

allowedHosts: ["72bf-103-47-172-110.ngrok-free.app"],

 }
})
