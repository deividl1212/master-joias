import './globals.css';

export const metadata = {
  title: 'Master Joias — Sistema de Gestão',
  description: 'Sistema de gestão da Master Joias',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport = {
  themeColor: '#1B1A18',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, fontFamily: "'Inter', sans-serif" }}>{children}</body>
    </html>
  );
}