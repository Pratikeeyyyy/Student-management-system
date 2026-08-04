import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'firebase',
              test: /firebase/,
              priority: 20,
            },
            {
              name: 'vendor',
              test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom|lucide-react)[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
})
