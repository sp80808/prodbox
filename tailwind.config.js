/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				// Tactile Dark palette
				'charcoal': {
					900: '#121212',
					800: '#161616',
					700: '#1A1A1A',
					600: '#1E1E1E',
					500: '#252525',
					400: '#2E2E2E',
					300: '#3A3A3A'
				},
				'neon': {
					blue:   '#00BFFF',
					yellow: '#D4FF00',
					green:  '#39FF14',
					red:    '#FF3B3B'
				}
			},
			fontFamily: {
				sans: ['Inter', 'ui-sans-serif', 'system-ui'],
				mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
				display: ['Space Grotesk', 'Inter', 'ui-sans-serif']
			},
			backgroundImage: {
				'grid-dark': 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)'
			}
		}
	},
	plugins: []
};
