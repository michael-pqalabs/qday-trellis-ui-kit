// UI preview only: no addresses or balances are derived from the demo phrase.
export const previewWallets = [
  { id: "main", name: "Main wallet", address: "0x7A39fC621B84D09a36e570F8cE214D6b95aC8021" },
  { id: "savings", name: "Savings wallet", address: "0x2C86aB913D57E04f68b120A9dF435E7c01B69832" },
] as const;

export const previewNetworks = [
  { id: "mainnet", name: "Qday Mainnet" },
  { id: "testnet", name: "Qday Testnet" },
] as const;

export const walletTokens = [
  { id: "qday", name: "Qday", symbol: "QDAY", detail: "Native token", mark: "Q", tone: "primary" },
  { id: "sqday", name: "sQDAY", symbol: "sQDAY", detail: "Staked Qday", mark: "sQ", tone: "accent" },
  { id: "usd8", name: "USD8", symbol: "USD8", detail: "Stablecoin", mark: "$", tone: "foreground" },
] as const;

export function getPreviewHolding(walletId: string, networkId: string, tokenId: string) {
  const wallet = previewWallets.find((item) => item.id === walletId) ?? previewWallets[0];
  const network = previewNetworks.find((item) => item.id === networkId) ?? previewNetworks[0];
  const token = walletTokens.find((item) => item.id === tokenId) ?? walletTokens[0];
  return { wallet, network, token, balance: "0.00" };
}
export type PreviewTx = {
  id: string; walletId: string; kind: "send" | "receive"; tokenId: string; amount: string;
  counterparty: string; status: "confirmed" | "pending" | "failed"; minutesAgo: number;
};

// Sample rows so the history layout can be reviewed; they are not on-chain records.
export const sampleTransactions: PreviewTx[] = [
  { id: "tx-1", walletId: "main", kind: "receive", tokenId: "usd8", amount: "120.00", counterparty: "0x91cE4a7B2d3F80e5C6a1b9D04f7E2c3A8b5D6e10", status: "confirmed", minutesAgo: 12 },
  { id: "tx-2", walletId: "main", kind: "send", tokenId: "qday", amount: "8.50", counterparty: "0x4F2a9C1e7B3d6A80f5E2c9B1d4A7e3F6c0B8a215", status: "pending", minutesAgo: 45 },
  { id: "tx-3", walletId: "main", kind: "send", tokenId: "usd8", amount: "50.00", counterparty: "0x8f3a2c1d9b4e7a6c5f0b3d2e8a1c4b7d9e6f3a5b", status: "confirmed", minutesAgo: 190 },
  { id: "tx-4", walletId: "main", kind: "receive", tokenId: "sqday", amount: "2.25", counterparty: "0x0B6d3E8a1C5f7A92e4D1b6F3c8A0e5B7d2C9f461", status: "confirmed", minutesAgo: 1500 },
  { id: "tx-5", walletId: "main", kind: "send", tokenId: "qday", amount: "1.00", counterparty: "0x5A7e1C3b9D2f4E60a8B5c1D7e3F9a2C4b6E0d873", status: "failed", minutesAgo: 2900 },
  { id: "tx-6", walletId: "savings", kind: "receive", tokenId: "qday", amount: "300.00", counterparty: "0x7A39fC621B84D09a36e570F8cE214D6b95aC8021", status: "confirmed", minutesAgo: 600 },
  { id: "tx-7", walletId: "savings", kind: "send", tokenId: "usd8", amount: "25.00", counterparty: "0x3D8b2F6a1E9c4B70d5A3e8C2f6B1a9D4c7E0b532", status: "confirmed", minutesAgo: 4300 },
];

export function transactionsFor(walletId: string) {
  return sampleTransactions.filter((tx) => tx.walletId === walletId);
}

export function shortAddress(address: string) {
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
}

export function agoLabel(minutes: number) {
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}

export const PREVIEW_NETWORK_FEE = "0.0021";

export type SendErrors = { recipient?: string; amount?: string };
export function validateSend(recipient: string, amount: string): SendErrors {
  const errors: SendErrors = {};
  if (!/^0x[0-9a-fA-F]{40}$/.test(recipient.trim())) errors.recipient = "Enter a valid 0x address (42 characters).";
  const value = Number(amount);
  if (!amount.trim() || !Number.isFinite(value) || value <= 0) errors.amount = "Enter an amount greater than 0.";
  return errors;
}
