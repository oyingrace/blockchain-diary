import { useWallet } from '../contexts/WalletContext';
import './WalletConnection.css';

export function WalletConnection() {
  const { isConnected, address, connectWallet, disconnectWallet } = useWallet();

  if (isConnected && address) {
    return (
      <div className="wallet-connected">
        <span className="wallet-address">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button className="btn-secondary" onClick={disconnectWallet}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button className="btn-primary" onClick={connectWallet}>
      Connect Wallet
    </button>
  );
}
