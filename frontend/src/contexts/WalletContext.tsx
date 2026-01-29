
import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { connect, disconnect } from '@stacks/connect';
import type { GetAddressesResult } from '@stacks/connect/dist/types/methods';


interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  walletInfo: GetAddressesResult | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [walletInfo, setWalletInfo] = useState<GetAddressesResult | null>(null);

  const connectWallet = async () => {
    try {
      const connectionResponse: GetAddressesResult = await connect();
      // addresses[0] is the mainnet address
      const mainnetAddress = connectionResponse.addresses[0]?.address;
      
      setIsConnected(true);
      setWalletInfo(connectionResponse);
      setAddress(mainnetAddress || null);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const disconnectWallet = () => {
    disconnect();
    setIsConnected(false);
    setAddress(null);
    setWalletInfo(null);
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
