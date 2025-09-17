import tailwindcss from '@tailwindcss/postcss';
import cssnano from 'cssnano';

export default {
  plugins: [
    (root) => {
      console.log('Processing CSS with PostCSS:', root);
    },
    tailwindcss,
    cssnano({
      preset: 'advanced',
    }),
  ],
};
