export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: '#0B0B0B', color: '#fff', fontFamily: 'Arial, sans-serif' }}>{children}</body>
    </html>
  );
}
