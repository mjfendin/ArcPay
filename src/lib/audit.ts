// Arc House contribution reconciliation engine.
// Matches a user's "My Contributions" paste against the embedded
// Arc House content catalog (community.arc.io/home/content).

import { ARC_CATALOG, ARC_CATALOG_COUNT, type ArcCatalogItem } from "./arc-catalog";

export interface MissedItem extends ArcCatalogItem {
  id: string;
}

export interface AnalyzeResult {
  catalogCount: number;
  completedCount: number;
  missedCount: number;
  completedTitlesCount: number;
  missed: MissedItem[];
  /** Catalog titles matched by the paste. */
  matchedTitles: string[];
  /** Parsed paste titles that did not match any catalog title. */
  unmatchedTitles: string[];
}

/**
 * Normalize a title for comparison.
 */
export function normalizeTitle(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract contribution titles from a raw "My Contributions" paste.
 *
 * The Arc House contribution history lists completed actions such as
 * "Read Content" and "Watch a Video". The paste also contains dates,
 * points, and UI chrome which we discard.
 */
export function parseContributionTitles(raw: string): string[] {
  const lines = raw.split(/\r?\n/);
  const titles: string[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    let cleaned = line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim();
    if (!cleaned) continue;

    // Strip a trailing date/timestamp like "Oct 12th, 2026" or "7:01 PM".
    cleaned = cleaned
      .replace(
        /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}\b/gi,
        ""
      )
      .replace(/\b\d{1,2}:\d{2}\s*(?:AM|PM)\b/gi, "")
      .trim();

    if (!cleaned) continue;

    // Skip known UI / chrome lines.
    if (
      /^(home|search|sign\s?in|join community|content|discussions|events|groups|albums|regions|arc website|circle|arc docs|arc discord|all content|featured|popular|latest|all tags|all types|my contributions|contributions|view more|load more|follow|share|like|save|reply|report)$/i.test(
        cleaned
      )
    ) {
      continue;
    }

    // Strip known contribution-action prefixes/suffixes so the title remains.
    const actionStripped = cleaned
      .replace(
        /^(read content|watch a video|read|watched|read article|watched video)\s*[:–-]?\s*/i,
        ""
      )
      .replace(/\s*-\s*(read content|watch a video)$/i, "")
      .trim();

    if (!actionStripped) continue;

    // Contribution titles are substantial; skip short fragments.
    if (actionStripped.length < 8) continue;

    // Skip lines that are only numbers, points, or counts.
    if (/^\d+(\.\d+)?$/.test(actionStripped)) continue;

    const key = normalizeTitle(actionStripped);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    titles.push(actionStripped);
  }

  return titles;
}

/**
 * Match parsed contribution titles against the catalog.
 */
export function analyzeContributions(raw: string): AnalyzeResult {
  const titles = parseContributionTitles(raw);
  const normalized = new Set(titles.map(normalizeTitle));

  const matchedTitles: string[] = [];
  const unmatchedTitles: string[] = [];
  const missed: MissedItem[] = [];

  for (const item of ARC_CATALOG) {
    if (normalized.has(normalizeTitle(item.title))) {
      if (!matchedTitles.some((t) => normalizeTitle(t) === normalizeTitle(item.title))) {
        matchedTitles.push(item.title);
      }
    } else {
      missed.push({
        ...item,
        id: `${normalizeTitle(item.title)}-${item.type}-${missed.length}`,
      });
    }
  }

  const catalogKeys = new Set(ARC_CATALOG.map((c) => normalizeTitle(c.title)));
  for (const title of titles) {
    if (!catalogKeys.has(normalizeTitle(title))) {
      unmatchedTitles.push(title);
    }
  }

  const completedCount = ARC_CATALOG.length - missed.length;

  return {
    catalogCount: ARC_CATALOG_COUNT,
    completedCount,
    missedCount: missed.length,
    completedTitlesCount: matchedTitles.length,
    missed,
    matchedTitles,
    unmatchedTitles,
  };
}
