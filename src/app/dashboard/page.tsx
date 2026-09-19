"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { BrandHeader } from "@/components/brand-header";
import { AutoSwitchNetwork } from "@/components/auto-switch-network";
import { TokenAddressBar } from "@/components/token-address-bar";
import { formatUsd, shortenAddress } from "@/lib/usdc";
import { getExplorerTxUrl, ACTIVE_NETWORK_LABEL } from "@/lib/arc";
import type { PaymentLinkPublic } from "@/lib/types";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending: connecting } = useConnect();
  const [payments, setPayments] = useState<PaymentLinkPublic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address) {
      setPayments([]);
      return;
    }
    let alive = true;
    setLoading(true);
    fetch(`/api/payments?recipient=${encodeURIComponent(address)}`)
      .then((res) => res.json())
      .then((data) => {
        if (alive) {
          setPayments(data.payments ?? []);
          setError(null);
        }
      })
      .catch(() => {
        if (alive) setError("Failed to load payments.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [address, isConnected]);

  const paid = payments.filter((p) => p.status === "paid");
  const pending = payments.filter((p) => p.status === "pending");
  const totalReceived = paid.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="flex flex-col flex-1 items-center px-5">
      <AutoSwitchNetwork />
      <div className="w-full max-w-5xl">
        <BrandHeader />

        <TokenAddressBar />

        <main className="pb-20 pt-6 space-y-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
              <p className="text-sm text-muted mt-1">
                Your USDC payment requests on {ACTIVE_NETWORK_LABEL}.
              </p>
            </div>
            <a href="/#create" className="btn-primary no-underline">
              Create payment link
            </a>
          </div>

          {!isConnected ? (
            <div className="card-surface p-12 text-center">
              <h2 className="text-xl font-semibold tracking-tight">
                Connect your wallet
              </h2>
              <p className="mt-2 text-sm text-muted max-w-sm mx-auto">
                Your dashboard is private. Connect the wallet that receives
                payments to see only your payment requests.
              </p>
              <button
                onClick={() => {
                  if (connectors[0]) connect({ connector: connectors[0] });
                }}
                disabled={connecting}
                className="btn-primary mt-6"
              >
                {connecting && <span className="spinner" />}
                Connect wallet
              </button>
            </div>
          ) : loading ? (
            <div className="card-surface p-12 text-center text-muted">
              <span className="spinner" /> Loading your payments…
            </div>
          ) : error ? (
            <div className="card-surface p-8 text-center text-danger">{error}</div>
          ) : (
            <>
              {/* Overview cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="card-surface p-5">
                  <p className="text-sm text-muted">Total received</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {formatUsd(totalReceived)} USDC
                  </p>
                  <p className="mt-1 text-sm text-muted">+{paid.length} payments</p>
                </div>
                <div className="card-surface p-5">
                  <p className="text-sm text-muted">Payments received</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {paid.length}
                  </p>
                </div>
                <div className="card-surface p-5">
                  <p className="text-sm text-muted">Pending requests</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {pending.length}
                  </p>
                </div>
                <div className="card-surface p-5">
                  <p className="text-sm text-muted">Total requests</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {payments.length}
                  </p>
                </div>
              </div>

              {/* Recent payments */}
              <section className="card-surface p-6">
                <h2 className="text-lg font-semibold tracking-tight">
                  Recent payments
                </h2>
                {payments.length === 0 ? (
                  <p className="mt-6 text-sm text-muted text-center py-10">
                    No payment requests yet.{" "}
                    <a href="/" className="font-medium underline">
                      Create your first payment link
                    </a>
                  </p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted border-b border-border">
                          <th className="py-2 pr-4 font-medium">Amount</th>
                          <th className="py-2 pr-4 font-medium">Description</th>
                          <th className="py-2 pr-4 font-medium">Status</th>
                          <th className="py-2 pr-4 font-medium">Payer</th>
                          <th className="py-2 pr-4 font-medium">Date</th>
                          <th className="py-2 font-medium">Transaction</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p) => (
                          <tr key={p.id} className="border-b border-border last:border-0">
                            <td className="py-3 pr-4 font-semibold">
                              {formatUsd(p.amount)}
                            </td>
                            <td className="py-3 pr-4 text-muted">
                              {p.description || "—"}
                            </td>
                            <td className="py-3 pr-4">
                              <span
                                className={`badge ${
                                  p.status === "paid"
                                    ? "badge-success"
                                    : p.status === "expired"
                                      ? "badge-danger"
                                      : p.status === "cancelled"
                                        ? "badge-danger"
                                        : "badge-warning"
                                }`}
                              >
                                {p.status}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-muted mono">
                              {p.payer ? shortenAddress(p.payer, 4) : "—"}
                            </td>
                            <td className="py-3 pr-4 text-muted">
                              {new Date(p.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3">
                              {p.txHash ? (
                                <a
                                  href={getExplorerTxUrl(p.txHash as `0x${string}`)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium underline"
                                >
                                  View
                                </a>
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
