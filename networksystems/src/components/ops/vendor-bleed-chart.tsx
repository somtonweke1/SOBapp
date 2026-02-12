'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type VendorBleedDatum = {
  vendorName: string;
  totalPayments: number;
  penaltyTotal: number;
};

type VendorBleedChartProps = {
  data: VendorBleedDatum[];
};

const formatCurrency = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default function VendorBleedChart({ data }: VendorBleedChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="vendorName" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(value) => `$${Number(value / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(value: number) => formatCurrency(value)} />
          <Legend />
          <Bar dataKey="totalPayments" name="Actual Payments" fill="#0f172a" />
          <Bar dataKey="penaltyTotal" name="Avoidable Penalties" fill="#dc2626" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
