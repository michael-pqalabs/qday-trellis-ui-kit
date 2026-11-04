import { createContext, useContext, useState, type ReactNode } from "react";
import {
  previewWallets,
  type ImportedToken,
  type PreviewWallet,
  type TokenDraft,
} from "@/lib/wallet-preview";

const WalletPreviewContext = createContext<{
  wallets: PreviewWallet[];
  addWallet: (name: string, networkId: string, source?: "created" | "imported") => PreviewWallet;
  renameWallet: (id: string, name: string) => void;
  importedTokens: ImportedToken[];
  importTokens: (networkId: string, tokens: TokenDraft[]) => ImportedToken[];
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
  const [importedTokens, setImportedTokens] = useState<ImportedToken[]>([]);
  const importTokens = (networkId: string, tokens: TokenDraft[]) => {
    const added = tokens.map((token) => ({
      ...token,
      symbol: token.symbol.trim(),
      address: token.address.trim(),
      id: `imported-${crypto.randomUUID()}`,
      networkId,
    }));
    setImportedTokens((current) => [...current, ...added]);
    return added;
  };
  return (
    <WalletPreviewContext.Provider
      value={{ wallets, addWallet, renameWallet, importedTokens, importTokens }}
    >
      {children}
    </WalletPreviewContext.Provider>
  );
}

export function useWalletPreview() {
  const value = useContext(WalletPreviewContext);
  if (!value) throw new Error("WalletPreviewProvider is required");
  return value;
}
