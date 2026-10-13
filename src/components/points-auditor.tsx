"use client";

import { useMemo, useState } from "react";
import { analyzeContributions, type MissedItem } from "@/lib/audit";
import { ARC_CATALOG_COUNT } from "@/lib/arc-catalog";

type Filter = "all" | "read" | "video";

export function PointsAuditor() {
  const [input, setInput] = useState("");
  const [missed, setMissed] = useState<MissedItem[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [missedCount, setMissedCount] = useState(0);
  const [completedTitlesCount, setCompletedTitlesCount] = useState(0);
  const [status, setStatus] = useState(
    "Awaiting your contribution history."
  );
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    return missed.filter((item) => {
      const typeMatch =
        filter === "all" ||
        (filter === "read" && item.type === "read") ||
        (filter === "video" && item.type === "video");
      const queryMatch =
        !query.trim() ||
        item.title.toLowerCase().includes(query.trim().toLowerCase());
      return typeMatch && queryMatch;
    });
  }, [missed, filter, query]);

  function analyze() {
    const val = input.trim();
    if (!val) {
      setStatus("Paste your contribution history before running the check.");
      return;
    }

    setStatus("Reconciling entries against the Arc House library…");

    // Defer to keep the UI responsive while parsing a large paste.
    setTimeout(() => {
      try {
        const result = analyzeContributions(val);
        setMissed(result.missed);
        setCompletedCount(result.completedCount);
        setMissedCount(result.missedCount);
        setCompletedTitlesCount(result.completedTitlesCount);
        setStatus(
          result.completedTitlesCount
            ? `${result.completedTitlesCount} of your entries matched catalog items.`
            : "No matching read or watch entries were found in that paste."
        );
      } catch (e) {
        setStatus("Something went wrong while parsing. Check the paste and try again.");
        console.error(e);
      }
    }, 30);
  }

  function clearAll() {
    setInput("");
    setMissed([]);
    setCompletedCount(0);
    setMissedCount(0);
    setCompletedTitlesCount(0);
    setQuery("");
    setFilter("all");
    setStatus("Awaiting your contribution history.");
  }

  return (
    <div className="space-y-6">
      <section className="card-surface p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <label htmlFor="contribution-paste" className="block">
            <span className="text-sm font-semibold text-foreground">
              Contribution history
            </span>
            <span className="mt-1 block text-xs text-muted max-w-md leading-relaxed">
              From Arc House, open your profile and copy the full My Contributions
              list. Paste it below as-is.
            </span>
          </label>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-muted shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            Local only — nothing leaves your browser.
          </span>
        </div>

        <textarea
          id="contribution-paste"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste your My Contributions list here…"
          rows={10}
          className="mt-4 w-full input-base resize-y font-mono text-xs leading-relaxed"
        />

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <button onClick={analyze} className="btn-primary w-full sm:w-auto">
            Run coverage check
          </button>
          <button onClick={clearAll} className="btn-secondary w-full sm:w-auto">
            Clear input
          </button>
          <p className="text-sm text-muted sm:ml-auto text-center sm:text-right" aria-live="polite">
            {status}
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card-surface p-5 sm:p-6">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            Library size
          </div>
          <div className="mt-2 text-3xl font-semibold tabular-nums">
            {ARC_CATALOG_COUNT}
          </div>
          <div className="mt-1 text-sm text-muted">catalog items tracked</div>
        </div>
        <div className="card-surface p-5 sm:p-6">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            Covered
          </div>
          <div className="mt-2 text-3xl font-semibold tabular-nums text-success">
            {completedCount}
          </div>
          <div className="mt-1 text-sm text-muted">matched to your activity</div>
        </div>
        <div className="card-surface p-5 sm:p-6">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            Remaining
          </div>
          <div className="mt-2 text-3xl font-semibold tabular-nums text-danger">
            {missedCount}
          </div>
          <div className="mt-1 text-sm text-muted">items you have not opened</div>
        </div>
      </section>

      <section className="card-surface p-5 sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Remaining library
            </h2>
            <p className="mt-1 text-sm text-muted">
              Everything in the Arc House catalog that did not appear in your paste.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="inline-flex rounded-lg border border-border p-1 self-start">
              {(
                [
                  ["all", "All"],
                  ["read", "Reads"],
                  ["video", "Videos"],
                ] as [Filter, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    filter === value
                      ? "bg-foreground text-background"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by title…"
              className="input-base h-10 sm:w-64 text-xs"
            />
          </div>
        </div>

        {missed.length === 0 ? (
          <div className="mt-8 py-16 text-center">
            <div className="mx-auto w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted">
              <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5" aria-hidden="true">
                <path d="M4 4h12v12H4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M7 9l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-foreground">
              Run a coverage check to see what remains
            </h3>
            <p className="mt-2 text-sm text-muted max-w-md mx-auto leading-relaxed">
              Paste your My Contributions list above and press Run coverage check.
              Matching entries are removed, leaving only the pieces you have not
              read or watched yet.
            </p>
          </div>
        ) : visible.length === 0 ? (
          <div className="mt-8 py-16 text-center">
            <h3 className="text-lg font-medium text-foreground">
              No items match the current view
            </h3>
            <p className="mt-2 text-sm text-muted">
              Try clearing the title filter or switching the type tab.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((item) => (
              <a
                key={item.id}
                href={item.link || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-xl border border-border bg-background/60 overflow-hidden transition-all duration-200 hover:border-foreground/25 hover:shadow-md no-underline"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-[var(--background)]">
                  {item.cover ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.cover}
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <span className="text-sm font-medium text-muted">
                        {item.type === "video" ? "Video" : "Article"}
                      </span>
                    </div>
                  )}
                  <span
                    className={`absolute left-2.5 top-2.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide backdrop-blur ${
                      item.type === "video"
                        ? "bg-black/50 text-white"
                        : "bg-white/80 text-zinc-800"
                    }`}
                  >
                    {item.type === "video" ? "Video" : "Read"}
                  </span>
                  {item.duration ? (
                    <span className="absolute right-2.5 bottom-2.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-white">
                      {item.duration}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col px-4 py-3">
                  <h3 className="text-sm font-medium leading-snug text-foreground group-hover:underline decoration-1 underline-offset-2">
                    {item.title}
                  </h3>
                  <div className="mt-auto pt-2 flex items-center gap-1 text-xs font-medium text-muted">
                    Open in Arc House
                    <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3" aria-hidden="true">
                      <path d="M6 4h6v6M12 4L6 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
