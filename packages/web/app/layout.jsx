import localFont from 'next/font/local';
import './globals.css';
import { Providers } from './providers.jsx';

// DM Serif Display — elegant serif for all headings/display text.
// Self-hosted so CI builds never depend on external Google Fonts calls.
const dmSerif = localFont({
  src: [
    { path: '../public/fonts/DMSerifDisplay.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/DMSerifDisplayItalic.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--font-display',
  display: 'swap',
});

// Inter — clean, legible sans-serif for body, UI, forms.
const inter = localFont({
  src: [
    { path: '../public/fonts/Inter-400.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/Inter-500.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/Inter-600.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-sans',
  display: 'swap',
});

// IBM Plex Mono — utility face for labels, distances, timestamps.
const plexMono = localFont({
  src: [
    { path: '../public/fonts/IBMPlexMono-400.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/IBMPlexMono-500.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata = {
  title: 'Melodis',
  description: 'Verified profiles. Real conversations. Matches that make sense.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${dmSerif.variable} ${inter.variable} ${plexMono.variable}`}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
