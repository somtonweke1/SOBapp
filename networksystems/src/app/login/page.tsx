import LoginClient from './LoginClient';
import { areWorkplaceToolsEnabled, getInternalToolsAccessCode } from '@/lib/internal-tools-access';

export const dynamic = 'force-dynamic';

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const next = searchParams?.next || '/internal-ops/dashboard';
  return (
    <LoginClient
      next={next}
      workplaceToolsEnabled={areWorkplaceToolsEnabled()}
      accessCodeConfigured={Boolean(getInternalToolsAccessCode())}
    />
  );
}
