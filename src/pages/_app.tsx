// src/pages/_app.tsx
import type { AppProps } from 'next/app';
import '../styles/vars.css';        // your global variables file
import '../styles/globals.css';     // if you have one
// If you render a common header/nav here, keep that import as well.

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

