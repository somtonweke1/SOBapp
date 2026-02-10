'use client';

import { useRouter } from 'next/navigation';
import ProfessionalLandingPage from '@/components/landing/professional-landing-page';

export default function PublicPage() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/login');
  };

  return (
    <ProfessionalLandingPage
      onGetStarted={handleGetStarted}
      user={null}
    />
  );
}