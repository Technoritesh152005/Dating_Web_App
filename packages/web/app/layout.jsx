import { Fraunces, Sora, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import {Providers} from './providers.jsx'

// Fraunces: warm, high-contrast serif with ink-trap character - carries
// the display/headline personality. Variable font, so we can lean into
// its optical-size axis for the large hero treatment vs smaller headings.
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
});

// Sora: geometric but warm sans - UI and body text. Deliberately not
// Inter/system-ui, which would read as the default choice for any project.
const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

// IBM Plex Mono: utility face for labels, distances, timestamps - gives
// small metadata (e.g. "2 km away", "3:41 PM") a distinct, data-like feel
// separate from conversational UI text.
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-plex-mono',
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata = {
  title: 'Melodis',
  description: 'Verified profiles. Real conversations. Matches that make sense.',
};

export default function RootLayout({ children }) {
  return (
    // these all fonts are available in our application and u can use it as needed
    <html lang="en" className={`${fraunces.variable} ${sora.variable} ${plexMono.variable}`}>
      <body>
      <Providers>
        {children}
      </Providers>
      </body>
    </html>
  );
}
