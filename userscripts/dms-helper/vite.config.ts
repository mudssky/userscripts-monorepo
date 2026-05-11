import { defineConfig } from 'vite'
import monkey from 'vite-plugin-monkey'
import packageJson from './package.json'

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        icon: 'https://vitejs.dev/logo.svg',
        namespace: packageJson.homepage,
        description: packageJson.description,
        match: ['*://dms.aliyun.com/*'],
        author: packageJson.author,
        version: packageJson.version,
        license: packageJson.license,
        'run-at': 'document-end',
        grant: ['GM_registerMenuCommand'],
        homepage: packageJson.homepage,
        supportURL: `${packageJson.homepage}/issues`,
        updateURL: `${packageJson.homepage}/releases/latest/download/dms-helper.user.js`,
        downloadURL: `${packageJson.homepage}/releases/latest/download/dms-helper.user.js`,
      },
    }),
  ],
})
