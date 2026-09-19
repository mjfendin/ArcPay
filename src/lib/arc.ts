import { http, createConfig } from "wagmi";
import { arc, arcTestnet } from "viem/chains";
import { injected } from "wagmi/connectors";

/**
 * Arc network configuration — single source of truth.
 *
 * Mainnet and Testnet are kept strictly separated. All chain-specific values
 * come from the official viem chain definitions (which mirror docs.arc.io):
 *
 *  - Arc Mainnet: chain ID 5042, RPC https://rpc.mainnet.arc.io
 *  - Arc Testnet: chain ID 5042002, RPC https://rpc.testnet.arc.network
 *  - USDC (native predeploy): 0x3600000000000000000000000000000000000000 on both
 *    networks. 6 decimals on the ERC-20 view, 18 decimals on the native view.
 */

export const ARC_MAINNET_ID = 5042;
export const ARC_TESTNET_ID = 5042002;

export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as const;

/** ARCPAY — ArcPay ecosystem ERC-20 token (listed on Argus, Arc Mainnet). */
export const ARCPAY_ADDRESS = "0xF8b688a3b2AE4793531877FE64f746b4C0f1c0b1" as const;
export const ARCPAY_DECIMALS = 18;

/** ERC-20 USDC ABI — the minimum surface needed for payments. */
export const USDC_ABI = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
] as const;

/** Generic ERC-20 transfer ABI — used for ARCPAY payments. */
export const ERC20_ABI = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
] as const;

export type NetworkMode = "mainnet" | "testnet";

/**
 * The active network from env. Defaults to MAINNET because this product is
 * production-ready; set NEXT_PUBLIC_NETWORK=arc-testnet for development.
 */
export function getNetworkMode(): NetworkMode {
  const v = process.env.NEXT_PUBLIC_NETWORK;
  return v === "arc-testnet" ? "testnet" : "mainnet";
}

export function isMainnet(): boolean {
  return getNetworkMode() === "mainnet";
}

export function getActiveChain() {
  return isMainnet() ? arc : arcTestnet;
}

export function getActiveChainId(): number {
  return getActiveChain().id;
}

export function getExplorerBaseUrl(): string {
  return getActiveChain().blockExplorers.default.url;
}

export function getExplorerTxUrl(hash: `0x${string}`): string {
  return `${getExplorerBaseUrl()}/tx/${hash}`;
}

export function getExplorerAddressUrl(address: `0x${string}`): string {
  return `${getExplorerBaseUrl()}/address/${address}`;
}

/**
 * Public RPC endpoint used by server-side verification. On Vercel we prefer the
 * same public endpoints the wallet uses; a paid/private RPC URL can be supplied
 * via ARC_RPC_URL_MAINNET / ARC_RPC_URL_TESTNET without being exposed to the
 * browser.
 */
export function getServerRpcUrl(): string {
  if (isMainnet()) {
    return process.env.ARC_RPC_URL_MAINNET || "https://rpc.mainnet.arc.io";
  }
  return process.env.ARC_RPC_URL_TESTNET || "https://rpc.testnet.arc.network";
}

/** wagmi config used by the Reown AppKit adapter. */
export function createArcWagmiConfig() {
  return createConfig({
    chains: [arc, arcTestnet],
    transports: {
      [arc.id]: http(),
      [arcTestnet.id]: http(),
    },
    connectors: [injected()],
    multiInjectedProviderDiscovery: true,
    ssr: true,
  });
}

export const NETWORK_LABELS: Record<NetworkMode, string> = {
  mainnet: "Arc Mainnet",
  testnet: "Arc Testnet",
};

export const ACTIVE_NETWORK_LABEL = NETWORK_LABELS[getNetworkMode()];
