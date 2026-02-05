import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import path from 'path';

// Plugin to auto-increment patch version on build
function autoIncrementVersion() {
  return {
    name: 'auto-increment-version',
    buildStart() {
      const versionFile = path.resolve(__dirname, 'src/version.js');
      const content = fs.readFileSync(versionFile, 'utf-8');

      const match = content.match(/VERSION = '(\d+)\.(\d+)\.(\d+)'/);
      if (match) {
        const major = parseInt(match[1]);
        const minor = parseInt(match[2]);
        const patch = parseInt(match[3]) + 1;
        const newVersion = `${major}.${minor}.${patch}`;

        const newContent = content.replace(
          /VERSION = '\d+\.\d+\.\d+'/,
          `VERSION = '${newVersion}'`
        );

        fs.writeFileSync(versionFile, newContent);
        console.log(`Version incremented to ${newVersion}`);
      }
    }
  };
}

export default defineConfig({
  root: '.',
  publicDir: 'public',
  plugins: [
    autoIncrementVersion(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Tutor - Opitaan yhdessä!',
        short_name: 'Tutor',
        description: 'Finnish learning app - reading practice and math exercises',
        theme_color: '#1565c0',
        background_color: '#e0f7fa',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,jpg,svg}'],
      },
    }),
  ],
});
