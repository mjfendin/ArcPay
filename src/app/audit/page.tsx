import type { Metadata } from "next";
import { BrandHeader } from "@/components/brand-header";
import { PointsAuditor } from "@/components/points-auditor";

export const metadata: Metadata = {
  title: "Arc Content Coverage — ArcPay",
  description:
    "Measure how much of the Arc House library you have already read or watched, and see exactly which pieces remain.",
};

export default function AuditPage() {
  return (
    <div className="flex flex-col flex-1 items-center px-4 sm:px-5">
      <div className="w-full max-w-6xl">
        <BrandHeader />

        <main className="pb-24 pt-10 sm:pt-14 space-y-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Content coverage
            </p>
            <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-balance">
              Every piece of Arc House content, reconciled against what you have
              actually read or watched.
            </h1>
            <p className="mt-4 text-sm sm:text-base text-muted leading-relaxed">
              Paste your contribution history once. You will see three numbers:
              how large the library is, how many entries match your activity, and
              how many are still sitting there untouched — with direct links to
              each one.
            </p>
          </div>

          <PointsAuditor />
        </main>
      </div>
    </div>
  );
}
