"use client";

import { useEffect } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { getActiveChainId } from "@/lib/arc";

/**
 * Auto-switches a connected wallet to the active Arc network (mainnet by
 * default). Runs on every page that mounts this component. Users are never
 * prompted to switch if no wallet is connected.
 */
export function AutoSwitchNetwork() {
  const { chainId, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const targetChainId = getActiveChainId();

  useEffect(() => {
    if (isConnected && chainId && chainId !== targetChainId) {
      void switchChainAsync({ chainId: targetChainId }).catch(() => {
        // The wallet may reject; never block the page on auto-switch.
      });
    }
  }, [isConnected, chainId, targetChainId, switchChainAsync]);

  return null;
}
