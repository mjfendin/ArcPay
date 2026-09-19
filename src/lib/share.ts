import { displayUsdc } from "./usdc";

export interface ShareMessageOptions {
  amount: string;
  description?: string;
  recipientName?: string;
  url: string;
}

/** Short, professional copy-paste message for payment links. */
export function buildShareMessage(opts: ShareMessageOptions): string {
  const amount = displayUsdc(opts.amount);
  const payee = opts.recipientName || "me";
  const what = opts.description ? ` for ${opts.description}` : "";
  return `Pay ${payee} $${amount} USDC${what}:\n${opts.url}`;
}

export function shareToTwitter(text: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export function shareToTelegram(text: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(
    text.split("\n").pop() || "",
  )}&text=${encodeURIComponent(text)}`;
}

export function shareToWhatsApp(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function shareToEmail(text: string, subject = "USDC payment request") {
  return `mailto:?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(text)}`;
}

export function shareToDiscord(text: string): string {
  // Discord has no public web share URL; open the message via clipboard
  return `https://discord.com/channels/@me`;
}
