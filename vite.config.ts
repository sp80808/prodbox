import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/vite-plugin-svelte';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [sveltekit()],

	// Tauri dev server configuration
	clearScreen: false,
	server: {
		port: 1420,
		strictPort: true,
		watch: {
			// Watch Rust source files so the Tauri sidecar is rebuilt on change
			ignored: ['**/src-tauri/**']
		}
	},
	envPrefix: ['VITE_', 'TAURI_'],
	build: {
		// Tauri supports ES2021
		target: process.env.TAURI_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
		minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
		sourcemap: !!process.env.TAURI_DEBUG
	}
});
