import './globals.css';

export const metadata = {
  title: 'VoxNote',
  description: 'AI-Powered Speech Formatting',
};

import { Providers } from '../components/Providers';
import SmoothScroll from '../components/SmoothScroll';

if (typeof window !== 'undefined' && window.trustedTypes && window.trustedTypes.createPolicy) {
  try {
    window.trustedTypes.createPolicy('default', {
      createHTML: (string) => string,
      createScriptURL: (string) => string,
      createScript: (string) => string,
    });
  } catch (e) {
    // Policy may already exist
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <SmoothScroll>
            {children}
          </SmoothScroll>
        </Providers>
      </body>
    </html>
  );
}
