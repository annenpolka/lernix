import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodeExternals } from 'rollup-plugin-node-externals'

export default defineConfig({
  plugins: [
    react(),
    nodeExternals({
      deps: true,
      builtins: true
    })
  ],
  build: {
    lib: {
      entry: 'src/index.tsx',
      formats: ['es'],
      fileName: () => 'cli.js'
    },
    rollupOptions: {
      external: ['react', 'ink'],
      output: {
        globals: {
          react: 'React',
          ink: 'Ink'
        }
      }
    }
  }
})