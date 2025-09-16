import { defineConfig } from 'vite'
import path from 'node:path';
export default defineConfig({
	root: './public',
	build: {
		outDir: '../dist',
		assetsDir: '', // leave empty!
		assetsInlineLimit: 0,
		target: 'es2018',
		sourcemap: false,
		rollupOptions: {
			input: {
				index: path.resolve('./public', 'index.html'),
			},
			output: {
				entryFileNames: 'ui/[name]-[hash].js',
				chunkFileNames: 'ui/[name]-[hash].js',
				// entryFileNames: chunk => {
				//   if (chunk.name === 'main') {
				//     return 'js/main.min.js';
				//   }
				//   return 'js/main.min.js';
				// },
				assetFileNames: (assetInfo) => {
					if (!assetInfo.names || assetInfo.names.length < 1) return ''
					const info = assetInfo.names[0].split('.');
					const ext = info[info.length - 1];
					if (assetInfo.names[0] === 'style.css') {
						return 'ui/editor-[hash].css';
					}
					if (/\.(png|jpe?g|gif|svg|webp|webm|mp3)$/.test(assetInfo.names[0])) {
						return `ui/img/[name]-[hash].${ext}`;
					}
					if (/\.(woff|woff2|eot|ttf|otf)$/.test(assetInfo.names[0])) {
						return `ui/fonts/[name]-[hash].${ext}`;
					}
					return `ui/[name]-[hash].${ext}`;
				},
			},
		},
	},
});
