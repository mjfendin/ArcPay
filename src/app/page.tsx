import { BrandHeader } from "@/components/brand-header";
import { CreatePaymentLinkCard } from "@/components/create-payment-link-card";
import { AutoSwitchNetwork } from "@/components/auto-switch-network";
import { TokenAddressBar } from "@/components/token-address-bar";

const USE_CASES = [
  {
    title: "Freelancers",
    description: "Send a professional invoice link to clients and get paid in USDC.",
  },
  {
    title: "Creators",
    description: "Accept tips and support directly from your audience.",
  },
  {
    title: "Merchants",
    description: "Embed a payment button on your site and accept USDC at checkout.",
  },
  {
    title: "Communities",
    description: "Collect payments for events, memberships, and shared resources.",
  },
];

const STEPS = [
  { step: "01", title: "Create a request", description: "Enter the amount and your wallet address. No account needed." },
  { step: "02", title: "Share the link", description: "Send it via chat, email, QR code, or embed it anywhere." },
  { step: "03", title: "Get paid on Arc", description: "The payer connects a wallet and pays. You receive USDC in seconds." },
];

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center px-5">
      <AutoSwitchNetwork />
      <div className="w-full max-w-5xl">
        <BrandHeader />

        <TokenAddressBar />

        <main className="pb-24">
          {/* Hero */}
          <section className="pt-14 sm:pt-24 pb-16 text-center">
            <span className="inline-flex badge">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              Live on Arc Mainnet
            </span>
            <h1 className="mt-6 text-[42px] sm:text-6xl font-semibold tracking-[-0.035em] leading-[1.05] max-w-2xl mx-auto">
              Get paid in USDC.
              <br />
              <span className="text-muted">Just send a link.</span>
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-muted leading-relaxed max-w-xl mx-auto">
              Create a payment request, share it anywhere, and receive USDC on
              Arc — the network where USDC is native.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <a href="#create" className="btn-primary h-12 px-6 no-underline">
                Create payment link
              </a>
              <a href="/pay/demo" className="btn-secondary h-12 px-6 no-underline">
                View live demo
              </a>
            </div>
            <div className="mt-6 flex items-center justify-center gap-5 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-success" /> Fast settlement
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-success" /> USDC-native payments
              </span>
              <span className="hidden sm:flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-success" /> No wallet needed to create
              </span>
            </div>
          </section>

          {/* Request form */}
          <section id="create" className="scroll-mt-24">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="max-w-md">
                <h2 className="text-3xl font-semibold tracking-tight leading-tight">
                  From invoice to paid in minutes
                </h2>
                <p className="mt-3 text-muted leading-relaxed">
                  Your customer sees a clean checkout page. They connect a
                  wallet, confirm, and the money arrives directly to your
                  address. No custody, no intermediaries, no blockchain jargon.
                </p>
                <ul className="mt-6 space-y-3 text-sm">
                  {[
                    "Public payment page — no login required",
                    "QR code and share links built in",
                    "Automatic on-chain verification",
                    "Dashboard to track every payment",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                      <span className="text-foreground/80">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-center lg:justify-end">
                <CreatePaymentLinkCard />
              </div>
            </div>
          </section>

          {/* How it works */}
          <section className="mt-24">
            <h2 className="text-3xl font-semibold tracking-tight text-center">
              How it works
            </h2>
            <div className="mt-10 grid md:grid-cols-3 gap-4">
              {STEPS.map((s) => (
                <div key={s.step} className="card-surface p-6">
                  <span className="text-sm font-semibold text-muted mono">
                    {s.step}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted leading-relaxed">
                    {s.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Use cases */}
          <section className="mt-24">
            <h2 className="text-3xl font-semibold tracking-tight text-center">
              Built for real payments
            </h2>
            <p className="mt-3 text-center text-muted max-w-lg mx-auto">
              One infrastructure for every way you get paid.
            </p>
            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {USE_CASES.map((u) => (
                <div key={u.title} className="card-surface p-6">
                  <h3 className="font-semibold tracking-tight">{u.title}</h3>
                  <p className="mt-2 text-sm text-muted leading-relaxed">
                    {u.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Developer CTA */}
          <section className="mt-24 card-surface p-8 sm:p-12 text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              Payments as simple as a link.
            </h2>
            <p className="mt-3 text-muted max-w-xl mx-auto">
              ArcPay is lightweight payment infrastructure built on Arc. Create a
              link programmatically, embed a button, or offer a personal Pay Me
              profile.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a href="/developers" className="btn-primary no-underline">
                Read the API docs
              </a>
              <a href="/embed" className="btn-secondary no-underline">
                Get the embed code
              </a>
            </div>
          </section>
        </main>

        <footer className="py-10 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
          <div className="flex items-center gap-2">
            <span>ArcPay</span>
            <span className="text-muted/50">·</span>
            <span>Get paid in USDC. Just send the link.</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://x.com/0xmjfmjf"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Built by @0xmjfmjf
            </a>
            <span className="text-muted/50">·</span>
            <span>Powered by Arc</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
