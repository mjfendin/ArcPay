export type PaymentStatus = "pending" | "paid" | "expired" | "cancelled";

export type PaymentCurrency = "USDC" | "ARCPAY";

export type PaymentLinkType =
  | "request" // fixed amount invoice-style
  | "payme" // custom amount profile
  | "donation" // preset amounts + custom
  | "invoice" // amount + customer + due date
  | "checkout" // product/service + amount
  | "tip"; // small predefined amounts

export interface PaymentLink {
  id: string;
  type: PaymentLinkType;
  recipient: string; // checksummed EVM address receiving the payment
  recipientName?: string; // display name (e.g. "MJF Endin")
  amount: string; // decimal string; fixed for request/invoice/checkout
  currency: PaymentCurrency;
  description: string;
  customerName?: string;
  reference?: string;
  expiresAt?: number | null; // epoch ms
  successMessage?: string;
  tipEnabled?: boolean;
  presetAmounts?: string[]; // for donation/tip
  createdAt: number;
  createdBy?: string;
  status: PaymentStatus;
  payer?: string;
  txHash?: string;
  paidAt?: number;
  paidAmountRaw?: string; // actual raw amount received (token decimals)
  metadata?: Record<string, string>;
}

export interface CreatePaymentLinkInput {
  type?: PaymentLinkType;
  recipient: string;
  recipientName?: string;
  amount: string;
  currency?: PaymentCurrency;
  description: string;
  customerName?: string;
  reference?: string;
  expiresAt?: number | null;
  successMessage?: string;
  tipEnabled?: boolean;
  presetAmounts?: string[];
  createdBy?: string;
}

export interface PaymentLinkPublic {
  id: string;
  type: PaymentLinkType;
  recipient: string;
  recipientName?: string;
  amount: string;
  currency: PaymentCurrency;
  description: string;
  customerName?: string;
  reference?: string;
  expiresAt?: number | null;
  successMessage?: string;
  tipEnabled?: boolean;
  presetAmounts?: string[];
  createdAt: number;
  status: PaymentStatus;
  payer?: string;
  txHash?: string;
  paidAt?: number;
}

export interface PaymentEvent {
  event:
    | "payment.created"
    | "payment.pending"
    | "payment.completed"
    | "payment.expired";
  payment_id: string;
  amount: string;
  currency: PaymentCurrency;
  payer?: string;
  recipient: string;
  transaction_hash?: string;
  created_at: number;
  occurred_at: number;
}

export function toPublicPaymentLink(link: PaymentLink): PaymentLinkPublic {
  return {
    id: link.id,
    type: link.type,
    recipient: link.recipient,
    recipientName: link.recipientName,
    amount: link.amount,
    currency: link.currency,
    description: link.description,
    customerName: link.customerName,
    reference: link.reference,
    expiresAt: link.expiresAt,
    successMessage: link.successMessage,
    tipEnabled: link.tipEnabled,
    presetAmounts: link.presetAmounts,
    createdAt: link.createdAt,
    status: link.status,
    payer: link.payer,
    txHash: link.txHash,
    paidAt: link.paidAt,
  };
}
