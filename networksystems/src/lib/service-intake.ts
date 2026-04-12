export const SERVICE_OFFERS = {
  diagnostic_memo: {
    id: 'diagnostic_memo',
    name: '24-Hour Deal Risk Memo',
    amountCents: 250000,
    turnaround: '24 hours',
    summary:
      'Decision-grade Baltimore deal memo with proceed/caution/escalate call, evidence links, and next diligence steps.',
  },
} as const;

export type ServiceOfferId = keyof typeof SERVICE_OFFERS;

export type ServiceIntakeDetails = {
  offerId: ServiceOfferId;
  offerName: string;
  amountCents: number;
  company: string;
  contactName: string;
  email: string;
  phone?: string;
  assetAddress: string;
  assetType?: string;
  timeline?: string;
  goals?: string;
  previewAgency?: string;
  checkoutSessionId?: string;
  checkoutUrl?: string;
  paymentStatus: 'pending' | 'paid' | 'manual_follow_up';
  paymentCompletedAt?: string;
  createdAt: string;
};

export function getServiceOffer(offerId: string) {
  if (offerId in SERVICE_OFFERS) {
    return SERVICE_OFFERS[offerId as ServiceOfferId];
  }

  return null;
}

export function formatUsdFromCents(amountCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}
