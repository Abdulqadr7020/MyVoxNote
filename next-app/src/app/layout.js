import './globals.css';

export const metadata = {
  title: 'VoxNote',
  description: 'AI-Powered Speech Formatting',
};

import { Providers } from '../components/Providers';
import SmoothScroll from '../components/SmoothScroll';

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
