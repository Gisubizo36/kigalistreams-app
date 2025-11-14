import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  base: './',
  
  plugins: [react()], 

  // This block is for Tailwind CSS
  css: {
    postcss: {
      plugins: [
        tailwindcss(),
        autoprefixer(),
      ],
    },
  },
  
  // This block fixes the 500kb warning
  build: {
    rollupOptions: {
      output: {
        // This function automatically splits your large libraries
        // into smaller, separate files (chunks).
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Group Firebase into its own chunk
            if (id.includes('firebase')) {
              return 'firebase-vendor';
            }
            // Group React into its own chunk
            if (id.includes('react-dom') || id.includes('react')) {
              return 'react-vendor';
            }
            // Group Lucide icons into their own chunk
            if (id.includes('lucide-react')) {
              return 'ui-vendor';
            }
            // Group all other libraries into a general vendor chunk
            return 'vendor';
          }
        }
      }
    }
  }
});