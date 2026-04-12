'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { verifyAccess } from '@/app/actions/auth';

export default function LoginClient({
  next,
  workplaceToolsEnabled,
  accessCodeConfigured,
}: {
  next: string;
  workplaceToolsEnabled: boolean;
  accessCodeConfigured: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [granted, setGranted] = useState(false);

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await verifyAccess(code);
      if (res.success) {
        setGranted(true);
        setTimeout(() => {
          router.replace(next);
          router.refresh();
        }, 350);
      } else {
        setError(
          res.reason === 'not_configured'
            ? 'Internal access is not configured for this deployment yet.'
            : 'Invalid access code.'
        );
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-gray-900" />
          <div className="text-lg font-bold tracking-tight text-gray-900">StoneBridge Internal</div>
        </div>

        <h1 className="mt-6 text-2xl font-bold tracking-tight text-gray-900">Internal Ops Access</h1>
        <p className="mt-2 text-sm text-gray-600">
          {workplaceToolsEnabled
            ? 'Workplace tools are enabled for this deployment.'
            : !accessCodeConfigured
              ? 'Internal access code login is not configured on this deployment. Use your platform account instead.'
            : 'Enter the internal access code to unlock the StoneBridge workplace tools.'}
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Platform users should sign in with email and password at{' '}
          <Link href="/auth/signin" className="font-medium text-emerald-700 hover:text-emerald-800">
            /auth/signin
          </Link>
          .
        </p>

        <motion.form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          animate={error ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-6"
        >
          {workplaceToolsEnabled || !accessCodeConfigured ? null : (
            <>
              <label className="text-sm font-medium text-gray-900">Enter Access Code</label>
              <input
                type="password"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (error) setError(null);
                }}
                className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm text-gray-900 shadow-sm outline-none focus:ring-4 ${
                  error ? 'border-rose-300 focus:ring-rose-100' : 'border-gray-200 focus:ring-gray-100'
                }`}
                placeholder="••••••••"
                autoFocus
              />
            </>
          )}

          <button
            type="submit"
            disabled={isPending || granted}
            className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-black disabled:opacity-60"
          >
            {granted
              ? 'Access Granted'
              : isPending
                ? 'Authenticating...'
                : workplaceToolsEnabled
                  ? 'Open Workplace Tools'
                  : !accessCodeConfigured
                    ? 'Use Platform Sign-In'
                    : 'Authenticate'}
          </button>
        </motion.form>

        {error ? (
          <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>
        ) : granted ? (
          <p className="mt-3 text-sm font-medium text-emerald-600">Access granted. Redirecting…</p>
        ) : !workplaceToolsEnabled && !accessCodeConfigured ? (
          <p className="mt-3 text-sm text-gray-600">
            Sign in at{' '}
            <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(next)}`} className="font-medium text-emerald-700 hover:text-emerald-800">
              /auth/signin
            </Link>
            {' '}to access the internal workspace.
          </p>
        ) : null}
      </div>
    </div>
  );
}
