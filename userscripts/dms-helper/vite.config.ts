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
        match: [
          '*://dms.aliyun.com/*',
          '*://dmsnext.console.aliyun.com/_console/sql-console*',
        ],
        author: packageJson.author,
        version: packageJson.version,
        license: packageJson.license,
        'run-at': 'document-end',
        grant: [
          'GM_registerMenuCommand',
          'GM_setClipboard',
          'GM_notification',
          'GM_getValue',
          'GM_setValue',
        ],
        homepage: packageJson.homepage,
        supportURL: 'https://github.com/mudssky/userscripts-monorepo/issues',
        updateURL:
          'https://github.com/mudssky/userscripts-monorepo/releases/latest/download/dms-helper.user.js',
        downloadURL:
          'https://github.com/mudssky/userscripts-monorepo/releases/latest/download/dms-helper.user.js',
      },
    }),
  ],
})
