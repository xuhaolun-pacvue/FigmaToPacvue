import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import vue from '@vitejs/plugin-vue'
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue(), viteSingleFile()],
    build: {
      target: "ES2017",
      assetsInlineLimit: 100000000,
      chunkSizeWarningLimit: 100000000,
      cssCodeSplit: false,
      outDir: "./dist",
      rollupOptions: {
        output: {},
      },
    },
});
