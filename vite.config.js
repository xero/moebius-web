import { defineConfig } from 'vite'
import path from 'node:path';
//export default defineConfig({
//  root: 'public',
//  build: {
//    outDir: '../dist',
//    rollupOptions: {
//      input: 'public/index.html'
//    },
//    emptyOutDir: true
//  }
//})
export default defineConfig({
	root: './public',
	build: {
		outDir: '../dist',
		assetsDir: '', // Leave `assetsDir` empty so that all static resources are placed in the root of the `dist` folder.
		assetsInlineLimit: 0,
		target: 'es2018',
		sourcemap: false,
		rollupOptions: {
			input: {
				index: path.resolve('./public', 'index.html'),
			},
			output: {
				entryFileNames: 'ui/[name]-[hash].js', // If you need a specific file name, comment out
				chunkFileNames: 'ui/[name]-[hash].js', // these lines and uncomment the bottom ones
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
