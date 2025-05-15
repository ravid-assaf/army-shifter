import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/army-shifter/',
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
})
