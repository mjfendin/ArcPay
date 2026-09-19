import { BrandHeader } from "@/components/brand-header";

const SNIPPETS = {
  html: `<!-- ArcPay payment button -->
<button
  onclick="window.open('https://arc-payments.vercel.app/pay/YOUR_LINK_ID', '_blank')"
  style="
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #2563eb;
    color: #fff;
    border: none;
    border-radius: 10px;
    font-weight: 600;
    font-size: 15px;
    padding: 12px 20px;
    cursor: pointer;
  "
>
  Pay with USDC
</button>`,
  react: `// ArcPay React component
export function ArcPayButton({ linkId, label = "Pay with USDC" }: {
  linkId: string;
  label?: string;
}) {
  return (
    <button
      onClick={() => window.open(\`https://arc-payments.vercel.app/pay/\${linkId}\`, "_blank")}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500"
    >
      {label}
    </button>
  );
}`,
  js: `// ArcPay JavaScript snippet — loads the button into any element
<script>
(function () {
  var el = document.getElementById("arcpay-button");
  if (!el) return;
  var btn = document.createElement("button");
  btn.textContent = "Pay with USDC";
  btn.setAttribute("style",
    "display:inline-flex;align-items:center;justify-content:center;gap:8px;" +
    "background:#2563eb;color:#fff;border:none;border-radius:10px;" +
    "font-weight:600;font-size:15px;padding:12px 20px;cursor:pointer");
  btn.addEventListener("click", function () {
    window.open("https://arc-payments.vercel.app/pay/YOUR_LINK_ID", "_blank");
  });
  el.appendChild(btn);
})();
</script>`,
};

export default function EmbedPage() {
  return (
    <div className="flex flex-col flex-1 items-center px-5">
      <div className="w-full max-w-3xl">
        <BrandHeader />
        <main className="pb-20 pt-6 space-y-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Accept USDC on your website
            </h1>
            <p className="text-sm text-muted mt-2">
              Copy a snippet, replace <span className="mono">YOUR_LINK_ID</span>,
              and start accepting USDC payments.
            </p>
          </div>

          {Object.entries(SNIPPETS).map(([lang, code]) => (
            <section key={lang} className="card-surface p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                {lang}
              </h2>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-100">
                <code>{code}</code>
              </pre>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}
