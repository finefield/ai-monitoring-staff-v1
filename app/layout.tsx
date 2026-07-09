import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Monitoring Staff v1",
  description: "HKD/JPY price notification support tool"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <div className="shell">
          <aside className="sidebar">
            <div>
              <p className="eyebrow">AI Monitoring Staff</p>
              <h1>Price Watch</h1>
            </div>
            <nav>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/settings">Settings</Link>
              <Link href="/logs">Logs</Link>
            </nav>
          </aside>
          <main className="main">
            <div className="compliance-note">
              これは投資助言ではなく、価格通知支援ツールです。自動売買機能は含みません。
            </div>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
