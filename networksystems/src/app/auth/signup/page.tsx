'use client';

import Link from 'next/link';

const stripeCheckoutUrl = process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL || '#';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-950 text-white px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="space-y-8">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">Sons of Baltimore Network</p>
              <h1 className="mt-4 text-4xl sm:text-5xl font-extralight tracking-tight">
                Join the Sons of Baltimore Network. Secure your infrastructure. Recover your capital.
              </h1>
              <p className="mt-4 text-base text-zinc-300">
                This is the premium gateway to the War Room. Your membership unlocks the forensic engine, legal abatement
                suite, and the live 3D property map used to surface overcharges before they hit your cash flow.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Pro Features</p>
              <ul className="mt-6 space-y-4 text-sm text-zinc-200">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span>3D Infrastructure Mapping with live property node intelligence.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span>Abatement Letter Suite with export-ready DPW dispute templates.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span>Deal Shield analytics: DSCR stress testing and lien risk alerts.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Security & Trust</p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-zinc-200">
                <span className="rounded-full border border-emerald-400/40 px-3 py-1">Stripe Verified</span>
                <span className="rounded-full border border-emerald-400/40 px-3 py-1">Encrypted Checkout</span>
                <span className="rounded-full border border-emerald-400/40 px-3 py-1">24/7 Forensic Support</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">War Room Access</p>
            <h2 className="mt-4 text-3xl font-semibold">$18<span className="text-base font-light text-zinc-300">/month</span></h2>
            <p className="mt-3 text-sm text-zinc-300">
              Priority access to the full SOBapp forensic stack. Cancel anytime.
            </p>

            <button
              onClick={() => {
                if (stripeCheckoutUrl === '#') return;
                window.location.href = stripeCheckoutUrl;
              }}
              className="mt-6 w-full rounded-lg border border-emerald-400/70 bg-emerald-500 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-[0_0_24px_rgba(34,197,94,0.4)] transition hover:bg-emerald-600"
            >
              Unlock War Room Access
            </button>

            {stripeCheckoutUrl === '#' && (
              <p className="mt-4 text-xs text-amber-300">
                Add `NEXT_PUBLIC_STRIPE_CHECKOUT_URL` to enable live checkout.
              </p>
            )}

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-zinc-300">
              <p className="uppercase tracking-[0.3em] text-zinc-400">Included</p>
              <ul className="mt-3 space-y-2">
                <li>Instant DPW forensic scans</li>
                <li>Abatement letter exports</li>
                <li>Portfolio risk alerts</li>
              </ul>
            </div>

            <p className="mt-6 text-center text-xs text-zinc-400">
              Already a member?{' '}
              <Link href="/auth/signin" className="text-emerald-300 hover:text-emerald-200">
                Sign in here
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
