import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ color: '#C8A951' }}>Security24h Admin</h1>
      <ul>
        <li><Link href="/login">Login</Link></li>
        <li><Link href="/leads">Pipeline/Leads</Link></li>
        <li><Link href="/dashboard">Dashboard</Link></li>
      </ul>
    </main>
  );
}
