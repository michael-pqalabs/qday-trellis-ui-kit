import { createContext, useContext, useState, type ReactNode } from "react";
import { previewWallets, type PreviewWallet } from "@/lib/wallet-preview";

const WalletPreviewContext = createContext<{
  wallets: PreviewWallet[];
  addWallet: (name: string, networkId: string) => PreviewWallet;
} | null>(null);

export function WalletPreviewProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<PreviewWallet[]>([...previewWallets]);
  const addWallet = (name: string, networkId: string) => {
    const id = crypto.randomUUID();
    const wallet = {
      id,
      name: name.trim(),
      networkId,
      address: `0x${id.replaceAll("-", "").padEnd(40, "0")}`,
    };
    setWallets((current) => [...current, wallet]);
    return wallet;
  };
  return (
    <WalletPreviewContext.Provider value={{ wallets, addWallet }}>
      {children}
    </WalletPreviewContext.Provider>
  );
}

export function useWalletPreview() {
  const value = useContext(WalletPreviewContext);
  if (!value) throw new Error("WalletPreviewProvider is required");
  return value;
}
