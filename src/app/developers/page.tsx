import { BrandHeader } from "@/components/brand-header";

export default function DevelopersPage() {
  return (
    <div className="flex flex-col flex-1 items-center px-5">
      <div className="w-full max-w-3xl">
        <BrandHeader />
        <main className="pb-20 pt-6 space-y-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Developers</h1>
            <p className="text-sm text-muted mt-2">
              Create payment links programmatically. Webhooks and SDKs are
              designed into the architecture and land in later phases.
            </p>
          </div>

          <section className="card-surface p-6 space-y-4">
            <h2 className="text-lg font-semibold">Create a payment link</h2>
            <p className="text-sm text-muted">
              <span className="mono">POST /api/payments</span>
            </p>
            <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-100">
              {`{
  "recipient": "0x...",        // required — EVM address
  "amount": "25.00",           // required — USDC amount (6 dp max)
  "description": "Website Development",
  "recipientName": "MJF Endin",
  "type": "request",           // request | invoice | checkout | donation | tip | payme
  "customerName": "Acme Co",
  "reference": "INV-001",
  "expiresAt": 1789700000000,  // optional epoch ms
  "tipEnabled": true,
  "presetAmounts": ["1", "5", "10"]
}`}
            </pre>
            <p className="text-sm text-muted">Response:</p>
            <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-100">
              {`{
  "id": "abc123",
  "url": "https://arc-payments.vercel.app/pay/abc123",
  "status": "pending",
  ...
}`}
            </pre>
          </section>

          <section className="card-surface p-6 space-y-3">
            <h2 className="text-lg font-semibold">Webhooks</h2>
            <p className="text-sm text-muted">
              Planned events: <span className="mono">payment.created</span>,{" "}
              <span className="mono">payment.pending</span>,{" "}
              <span className="mono">payment.completed</span>,{" "}
              <span className="mono">payment.expired</span>.
            </p>
            <p className="text-sm text-muted">
              The server-side webhook dispatcher already exists; merchant URL
              registration ships with auth in a later phase.
            </p>
          </section>

          <section className="card-surface p-6 space-y-3">
            <h2 className="text-lg font-semibold">Payment Link types</h2>
            <ul className="text-sm text-muted space-y-1.5 list-disc pl-5">
              <li><span className="font-medium text-foreground">request</span> — fixed amount</li>
              <li><span className="font-medium text-foreground">invoice</span> — amount + customer + due date</li>
              <li><span className="font-medium text-foreground">checkout</span> — product/service + amount</li>
              <li><span className="font-medium text-foreground">donation</span> — preset amounts + custom</li>
              <li><span className="font-medium text-foreground">tip</span> — small predefined amounts</li>
              <li><span className="font-medium text-foreground">payme</span> — personal profile, custom amount</li>
            </ul>
          </section>
        </main>
      </div>
    </div>
  );
}
