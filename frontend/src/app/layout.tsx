import './globals.css';
import { WalletProvider } from '@/components/WalletProvider';
import { Navbar } from '@/components/Navbar';

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
          <main className="container">
            {children}
          </main>
        </WalletProvider>
      </body>
    </html>
  );
}
