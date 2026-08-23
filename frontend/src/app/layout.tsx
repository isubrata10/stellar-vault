import './globals.css';
import { WalletProvider } from '@/components/WalletProvider';
import { Navbar } from '@/components/Navbar';

import SidebarMenu from '@/components/SidebarMenu';

export const metadata = {
  title: 'StellarVault',
  description: 'A Level 3 Stellar Journey Project',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <Navbar />
          <div className="app-layout">
            <SidebarMenu />
            <main className="container" style={{ flex: 1, padding: '40px 20px', overflowY: 'auto' }}>
              {children}
            </main>
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
