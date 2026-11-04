// UI preview only: no addresses or balances are derived from the demo phrase.
export const previewWallets = [
  { id: "main", name: "Wallet 1 (Main)", address: "0x7A39fC621B84D09a36e570F8cE214D6b95aC8021" },
] as const;

export const previewNetworks = [
  { id: "testnet", name: "Aevum Testnet" },
  { id: "base-testnet", name: "Base Testnet" },
  { id: "qday-mainnet", name: "QDay Mainnet" },
] as const;

export type PreviewChainNetwork = {
  id: string;
  name: string;
  available: boolean;
  /** Shown wherever the network is picked or used, for networks that are not live. */
  previewNote?: string;
};
export type PreviewChain = {
  id: string;
  name: string;
  available: boolean;
  /** Shown under a blockchain that is not the active one. */
  switchNote?: string;
  /** Tokens every wallet on this blockchain starts with. */
  defaultTokens: string[];
  networks: PreviewChainNetwork[];
};

/**
 * Blockchains and the networks each one offers. A network's name depends on its blockchain:
 * QDay's testnet is Aevum Testnet. Only one blockchain is active at a time, and mainnets stay
 * unavailable until they ship, so they are listed as "coming soon" rather than selectable.
 */
export const previewChains: PreviewChain[] = [
  {
    id: "qday",
    name: "QDay",
    available: true,
    defaultTokens: ["QDAY", "USD8"],
    networks: [
      { id: "testnet", name: "Aevum Testnet", available: true },
      {
        id: "qday-mainnet",
        name: "Mainnet",
        available: true,
        previewNote:
          "Preview only. QDay Mainnet is not live; balances and addresses are illustrative.",
      },
    ],
  },
  {
    id: "base",
    name: "Base",
    available: false,
    defaultTokens: ["ETH", "USDC"],
    switchNote:
      "Separate from QDay. Starts with a new Main Wallet smart account (the first one is sponsored), then new SignetPasses (not sponsored).",
    networks: [
      { id: "base-testnet", name: "Base Testnet", available: true },
      { id: "base-mainnet", name: "Mainnet", available: false },
    ],
  },
];

export function getChain(chainId: string) {
  return previewChains.find((chain) => chain.id === chainId) ?? (previewChains[0] as PreviewChain);
}

export function chainForNetwork(networkId: string | undefined) {
  return (
    previewChains.find((chain) => chain.networks.some((item) => item.id === networkId)) ??
    (previewChains[0] as PreviewChain)
  );
}

/** Chain and network for an id, with the "QDay · Aevum Testnet" label used across the wallet. */
export function describeNetwork(networkId: string | undefined) {
  const chain = chainForNetwork(networkId);
  const network = chain.networks.find((item) => item.id === networkId) ?? chain.networks[0];
  return { chain, network, label: `${chain.name} · ${network?.name ?? ""}` };
}

export function defaultNetworkId(chainId: string) {
  const chain = getChain(chainId);
  return (chain.networks.find((item) => item.available) ?? chain.networks[0])?.id ?? "testnet";
}

export const walletTokens = [
  { id: "qday", name: "QDAY", symbol: "QDAY", detail: "Native token", mark: "Q", tone: "primary" },
  { id: "usd8", name: "USD8", symbol: "USD8", detail: "Stablecoin", mark: "$", tone: "foreground" },
] as const;

export type PreviewWallet = {
  id: string;
  name: string;
  address: string;
  networkId?: string;
  /** How the illustrative account was added; the initial accounts have neither. */
  source?: "created" | "imported";
};
export function getPreviewHolding(
  walletId: string,
  networkId: string,
  tokenId: string,
  wallets: readonly PreviewWallet[] = previewWallets,
) {
  const wallet = wallets.find((item) => item.id === walletId) ?? previewWallets[0];
  const network = previewNetworks.find((item) => item.id === networkId) ?? previewNetworks[0];
  const token = walletTokens.find((item) => item.id === tokenId) ?? walletTokens[0];
  return { wallet, network, token, balance: "0.00" };
}
export type PreviewTx = {
  id: string;
  walletId: string;
  kind: "send" | "receive";
  tokenId: string;
  amount: string;
  counterparty: string;
  status: "confirmed" | "pending" | "failed";
  minutesAgo: number;
};

// Sample rows so the history layout can be reviewed; they are not on-chain records.
export const sampleTransactions: PreviewTx[] = [
  {
    id: "tx-1",
    walletId: "main",
    kind: "receive",
    tokenId: "usd8",
    amount: "120.00",
    counterparty: "0x91cE4a7B2d3F80e5C6a1b9D04f7E2c3A8b5D6e10",
    status: "confirmed",
    minutesAgo: 12,
  },
  {
    id: "tx-2",
    walletId: "main",
    kind: "send",
    tokenId: "qday",
    amount: "8.50",
    counterparty: "0x4F2a9C1e7B3d6A80f5E2c9B1d4A7e3F6c0B8a215",
    status: "pending",
    minutesAgo: 45,
  },
  {
    id: "tx-3",
    walletId: "main",
    kind: "send",
    tokenId: "usd8",
    amount: "50.00",
    counterparty: "0x8f3a2c1d9b4e7a6c5f0b3d2e8a1c4b7d9e6f3a5b",
    status: "confirmed",
    minutesAgo: 190,
  },
  {
    id: "tx-4",
    walletId: "main",
    kind: "receive",
    tokenId: "qday",
    amount: "2.25",
    counterparty: "0x0B6d3E8a1C5f7A92e4D1b6F3c8A0e5B7d2C9f461",
    status: "confirmed",
    minutesAgo: 1500,
  },
  {
    id: "tx-5",
    walletId: "main",
    kind: "send",
    tokenId: "qday",
    amount: "1.00",
    counterparty: "0x5A7e1C3b9D2f4E60a8B5c1D7e3F9a2C4b6E0d873",
    status: "failed",
    minutesAgo: 2900,
  },
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
  if (!/^0x[0-9a-fA-F]{40}$/.test(recipient.trim()))
    errors.recipient = "Enter a valid 0x address (42 characters).";
  const value = Number(amount);
  if (!amount.trim() || !Number.isFinite(value) || value <= 0)
    errors.amount = "Enter an amount greater than 0.";
  return errors;
}

/** "Wallet 3", "Wallet 4", … : the number keeps increasing and never repeats an existing name. */
export function nextWalletName(wallets: readonly { name: string }[]) {
  const used = new Set(wallets.map((wallet) => wallet.name.trim().toLowerCase()));
  let n = wallets.length + 1;
  while (used.has(`wallet ${n}`)) n++;
  return `Wallet ${n}`;
}

export const WALLET_NAME_MAX = 40;
export function validateWalletName(name: string, wallets: readonly { name: string }[]) {
  const value = name.trim();
  if (!value) return "Enter a wallet name.";
  if (value.length > WALLET_NAME_MAX) return `Use ${WALLET_NAME_MAX} characters or fewer.`;
  if (wallets.some((wallet) => wallet.name.trim().toLowerCase() === value.toLowerCase()))
    return "You already have a wallet with this name.";
  return undefined;
}

export function phraseWordCount(phrase: string) {
  return phrase.trim().split(/\s+/).filter(Boolean).length;
}
export function isPhraseLengthValid(phrase: string) {
  const count = phraseWordCount(phrase);
  return count === 12 || count === 24;
}

/** A token added with "+" in the token list. Illustrative: nothing is looked up or stored on-chain. */
export type TokenDraft = { symbol: string; address: string; decimals: number; name?: string };
/** Tokens apply to the blockchain and network of the active wallet, so each one keeps its network. */
export type ImportedToken = TokenDraft & { id: string; networkId: string };

/**
 * Sample entries for the Search tab, per blockchain. Not a live token list: nothing is looked up, and
 * the addresses are illustrative.
 */
const sampleCatalogue: Record<string, TokenDraft[]> = {
  qday: [
    {
      name: "Wrapped QDAY",
      symbol: "WQDAY",
      address: "0x2f4b8c1d9e6a3705b8d4c2e1f0a9738465bd1c20",
      decimals: 18,
    },
    {
      name: "Sample Euro",
      symbol: "SEUR",
      address: "0x91c3e5a7b2d4f60813a5c7e9b1d3f5a7c9e1b3d5",
      decimals: 6,
    },
    {
      name: "Sample Gold",
      symbol: "SGLD",
      address: "0x5d7f9b1c3e5a7092b4d6f8a0c2e4b6d8f0a2c4e6",
      decimals: 8,
    },
  ],
  base: [
    {
      name: "Wrapped Ether",
      symbol: "WETH",
      address: "0x4a6c8e0b2d4f6819a3c5e7b9d1f3a5c7e9b1d3f5",
      decimals: 18,
    },
    {
      name: "Dai Stablecoin",
      symbol: "DAI",
      address: "0x7b9d1f3a5c7e9021b3d5f7a9c1e3b5d7f9a1c3e5",
      decimals: 18,
    },
    {
      name: "Coinbase Wrapped BTC",
      symbol: "cbBTC",
      address: "0x3c5e7a9b1d3f5027c9e1b3d5f7a9c1e3b5d7f9a1",
      decimals: 8,
    },
  ],
};
export function searchTokens(networkId: string, query: string, taken: readonly string[]) {
  const q = query.trim().toLowerCase();
  const takenSet = new Set(taken.map((symbol) => symbol.toLowerCase()));
  return (sampleCatalogue[chainForNetwork(networkId).id] ?? [])
    .filter((token) => !takenSet.has(token.symbol.toLowerCase()))
    .filter(
      (token) =>
        !q ||
        token.symbol.toLowerCase().includes(q) ||
        (token.name ?? "").toLowerCase().includes(q),
    );
}

export const TOKEN_SYMBOL_MAX = 11;
export const TOKEN_DECIMALS_MAX = 36;
/** Balance text for a zero balance, shown with up to two decimals (none for a 0-decimal token). */
export function zeroBalance(decimals: number) {
  return decimals <= 0 ? "0" : `0.${"0".repeat(Math.min(decimals, 2))}`;
}
export function isTokenAddress(address: string) {
  return /^0x[0-9a-fA-F]{40}$/.test(address.trim());
}
export function validateTokenImport(
  address: string,
  symbol: string,
  decimals: string,
  existing: readonly { symbol: string; address?: string }[],
) {
  const addr = address.trim();
  const sym = symbol.trim();
  const errors: { address?: string; symbol?: string; decimals?: string } = {};
  if (!addr) errors.address = "Enter the token contract address.";
  else if (!isTokenAddress(addr)) errors.address = "Use a 0x address with 40 hex characters.";
  else if (existing.some((token) => token.address?.toLowerCase() === addr.toLowerCase()))
    errors.address = "This token is already in your list.";
  if (!sym) errors.symbol = "Enter the token symbol.";
  else if (sym.length > TOKEN_SYMBOL_MAX)
    errors.symbol = `Use ${TOKEN_SYMBOL_MAX} characters or fewer.`;
  else if (existing.some((token) => token.symbol.toLowerCase() === sym.toLowerCase()))
    errors.symbol = "A token with this symbol is already in your list.";
  const dec = decimals.trim();
  if (!dec) errors.decimals = "Enter the token decimals.";
  else if (!/^\d+$/.test(dec) || Number(dec) > TOKEN_DECIMALS_MAX)
    errors.decimals = `Use a whole number from 0 to ${TOKEN_DECIMALS_MAX}.`;
  return errors;
}
