import { defineConfig, type PluginOption } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import devtools from 'solid-devtools/vite';
import UnocssPlugin from '@unocss/vite';

const injectGA = (): PluginOption => ({
  name: 'inject-ga',
  apply: 'build', // 仅在 build 模式下运行
  transformIndexHtml() {
    // 直接返回标签数组，Vite 会自动处理插入
    return [
      {
        tag: 'script',
        attrs: {
          async: true,
          src: 'https://www.googletagmanager.com/gtag/js?id=G-K2ZDK6YPM0',
        },
        injectTo: 'head', // 默认是 'head-prepend' (头部最前)，也可以显式写 'head' (头部最后)
      },
      {
        tag: 'script',
        children: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-K2ZDK6YPM0');
        `,
        injectTo: 'head',
      },
    ];
  },
});

export default defineConfig({
  plugins: [
    UnocssPlugin(),
    devtools(),
    solidPlugin(),
    injectGA()
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
});
