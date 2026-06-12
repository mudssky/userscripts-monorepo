import path from 'node:path'
import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import monkey from 'vite-plugin-monkey'
import packageJson from './package.json'

export default defineConfig({
  plugins: [
    preact(),
    tailwindcss(),
    monkey({
      entry: 'src/main.tsx',
      userscript: {
        name: 'AI Assistant Enhancer',
        icon: 'https://vitejs.dev/logo.svg',
        namespace: packageJson.homepage,
        description: packageJson.description,
        match: ['https://www.doubao.com/chat*'],
        author: packageJson.author,
        version: packageJson.version,
        license: packageJson.license,
        'run-at': 'document-end',
        grant: ['GM_getValue', 'GM_setValue', 'GM_registerMenuCommand'],
        homepage: packageJson.homepage,
        supportURL: 'https://github.com/mudssky/userscripts-monorepo/issues',
        updateURL:
          'https://github.com/mudssky/userscripts-monorepo/releases/latest/download/ai-assistant-enhancer.user.js',
        downloadURL:
          'https://github.com/mudssky/userscripts-monorepo/releases/latest/download/ai-assistant-enhancer.user.js',
      },
    }),
  ],
  build: {
    minify: true,
  },
  resolve: {
    alias: {
      react: 'preact/compat',
      'react-dom/test-utils': 'preact/test-utils',
      'react-dom': 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime',
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
