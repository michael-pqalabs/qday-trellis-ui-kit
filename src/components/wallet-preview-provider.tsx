import { createContext, useContext, useState, type ReactNode } from "react";
import { previewWallets, type PreviewWallet } from "@/lib/wallet-preview";

const WalletPreviewContext = createContext<{
  wallets: PreviewWallet[];
  addWallet: (name: string, networkId: string, source?: "created" | "imported") => PreviewWallet;
  renameWallet: (id: string, name: string) => void;
} | null>(null);

export function WalletPreviewProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<PreviewWallet[]>([...previewWallets]);
  const addWallet = (
    name: string,
    networkId: string,
    source: "created" | "imported" = "created",
  ) => {
    const id = crypto.randomUUID();
    const wallet = {
      id,
      name: name.trim(),
      networkId,
      source,
      // Illustrative only: 40 random hex characters, not derived from any phrase or key.
      address: `0x${(id + crypto.randomUUID()).replaceAll("-", "").slice(0, 40)}`,
    };
    setWallets((current) => [...current, wallet]);
    return wallet;
  };
  const renameWallet = (id: string, name: string) => {
    setWallets((current) =>
      current.map((wallet) => (wallet.id === id ? { ...wallet, name: name.trim() } : wallet)),
    );
  };
  return (
    <WalletPreviewContext.Provider value={{ wallets, addWallet, renameWallet }}>
      {children}
    </WalletPreviewContext.Provider>
  );
}

export function useWalletPreview() {
  const value = useContext(WalletPreviewContext);
  if (!value) throw new Error("WalletPreviewProvider is required");
  return value;
}
