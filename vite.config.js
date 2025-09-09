import { defineConfig } from 'vite'
export default defineConfig({
  root: 'public',
  build: {
    outDir: '../dist',
    rollupOptions: {
      input: 'public/index.html'
    },
    target: 'es2018',
    sourcemap: true,
    emptyOutDir: false
  }
})
