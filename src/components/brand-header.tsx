"use client";

import Link from "next/link";
import Image from "next/image";
import { ACTIVE_NETWORK_LABEL } from "@/lib/arc";
import { ThemeToggle } from "@/components/theme-toggle";

export function BrandHeader({
  showTag = true,
  compact = false,
}: {
  showTag?: boolean;
  compact?: boolean;
}) {
  return (
    <header
      className={`w-full flex items-center justify-between ${
        compact ? "py-4" : "py-6"
      }`}
    >
      <Link href="/" className="flex items-center gap-3 no-underline group">
        <span className="relative w-9 h-9 rounded-full ring-1 ring-border overflow-hidden bg-white shrink-0">
          <Image
            src="/logo-64.png"
            alt="ArcPay"
            width={36}
            height={36}
            className="object-cover"
            priority
          />
        </span>
        <span className="flex items-baseline gap-2">
          <span className="font-semibold text-[17px] tracking-tight text-foreground">
            ArcPay
          </span>
          {showTag && (
            <span className="hidden sm:inline-flex badge">{ACTIVE_NETWORK_LABEL}</span>
          )}
        </span>
      </Link>

      <div className="flex items-center gap-2">
        {!compact && (
          <nav className="hidden md:flex items-center gap-1 text-sm mr-2">
            <Link href="/dashboard" className="px-3 py-2 rounded-lg text-muted hover:text-foreground hover:bg-border/40 transition-colors">
              Dashboard
            </Link>
            <Link href="/developers" className="px-3 py-2 rounded-lg text-muted hover:text-foreground hover:bg-border/40 transition-colors">
              Developers
            </Link>
            <Link href="/embed" className="px-3 py-2 rounded-lg text-muted hover:text-foreground hover:bg-border/40 transition-colors">
              Embed
            </Link>
            <a
              href="#create"
              className="ml-2 btn-primary !px-4 !py-2 !text-sm no-underline"
            >
              Create payment link
            </a>
          </nav>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
