import { z } from 'zod';

export const dealTypeOptions = [
  'Acquisition',
  'Rehab',
  'Underwriting Review',
  'Portfolio Assessment',
] as const;

export const turnaroundOptions = ['24 hours', '48 hours', '5 business days'] as const;

const propertyAddressSchema = z.string().trim().min(5).max(200);

export const portfolioIntakeSchema = z.object({
  institutionName: z.string().trim().min(2).max(160),
  contactName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  dealType: z.enum(dealTypeOptions),
  propertyAddresses: z.array(propertyAddressSchema).min(1).max(10),
  turnaround: z.enum(turnaroundOptions),
  notes: z.string().trim().max(3000).optional().default(''),
});

export type PortfolioIntakePayload = z.infer<typeof portfolioIntakeSchema>;

export type PortfolioIntakeDetails = PortfolioIntakePayload & {
  type: 'portfolio_intake';
  referenceNumber: string;
  createdAt: string;
  status?: 'new' | 'in_review' | 'delivered';
  confirmationEmailStatus?: 'sent' | 'not_configured';
};

export function buildPortfolioReferenceNumber(input: { createdAt: Date; id: string }) {
  const date = input.createdAt.toISOString().slice(0, 10).replace(/-/g, '');
  return `SB-PF-${date}-${input.id.slice(-6).toUpperCase()}`;
}
