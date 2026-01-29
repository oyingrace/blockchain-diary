
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
