import localFont from 'next/font/local';

// Variable font version for better performance
// Using only variable font to avoid loading multiple font files
// This reduces blocking resources by ~710KB
export const interVariable = localFont({
  src: [
    {
      path: '../../public/fonts/inter/InterVariable.woff2',
      weight: '100 900',
      style: 'normal',
    },
    {
      path: '../../public/fonts/inter/InterVariable-Italic.woff2',
      weight: '100 900',
      style: 'italic',
    },
  ],
  variable: '--font-inter-variable',
  display: 'swap',
  preload: true,
});
