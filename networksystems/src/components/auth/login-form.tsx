'use client';

import { useState } from 'react';
import { useAuth } from './auth-provider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Shield, ArrowLeft } from 'lucide-react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const success = await login(email, password);
    if (success) {
      router.push('/?access=platform');
    } else {
      setError('Invalid credentials. Please contact your account manager for access.');
    }
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Back Button */}
        <button
          onClick={handleBackToHome}
          className="flex items-center space-x-2 text-zinc-600 hover:text-zinc-900 font-light transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <button
              onClick={handleBackToHome}
              className="bg-zinc-900 text-white px-6 py-3 text-lg font-light tracking-wide rounded hover:bg-emerald-600 transition-colors cursor-pointer"
            >
              MIAR
            </button>
            <Shield className="w-8 h-8 text-zinc-600" />
          </div>
          <h2 className="text-3xl font-extralight text-zinc-900 tracking-tight">
            Secure Client Access
          </h2>
          <p className="mt-3 text-zinc-600 font-light">
            Compliance Intelligence Platform
          </p>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border-zinc-200/50 shadow-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg font-light">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-light text-zinc-700 mb-2">
                Business Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 border border-zinc-200 placeholder-zinc-400 text-zinc-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-light"
                placeholder="your.email@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-light text-zinc-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 border border-zinc-200 placeholder-zinc-400 text-zinc-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-light"
                placeholder="Enter your secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-lg font-light text-lg transition-colors disabled:opacity-50 disabled:bg-zinc-400"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  'Access Platform'
                )}
              </Button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-200">
            <div className="text-center">
              <p className="text-sm text-zinc-500 font-light mb-3">
                Need access to the MIAR platform?
              </p>
              <div className="space-y-2 text-sm">
                <p className="text-zinc-600 font-light">
                  Contact your account manager or email{' '}
                  <a href="mailto:access@miar.ai" className="text-emerald-600 hover:text-emerald-700">
                    access@miar.ai
                  </a>
                </p>
                <p className="text-xs text-zinc-500">
                  Enterprise clients: Use your company-issued credentials
                </p>
              </div>
            </div>
          </div>

          {/* Development Access Note */}
          <div className="mt-6 p-4 bg-emerald-50/50 border border-emerald-200/30 rounded-lg">
            <h4 className="text-sm font-light text-emerald-800 mb-2">Platform Preview Access</h4>
            <div className="text-xs text-emerald-700 space-y-1 font-light">
              <div>Demo access: <code className="bg-white px-1 py-0.5 rounded">admin@miar.com</code></div>
              <div>Password: <code className="bg-white px-1 py-0.5 rounded">demo123</code></div>
              <p className="mt-2 text-emerald-600">For evaluation purposes only</p>
            </div>
          </div>
        </Card>

        <div className="text-center">
          <p className="text-xs text-zinc-500 font-light">
            Protected by enterprise-grade security • SOC2 Type II Compliant
          </p>
        </div>
      </div>
    </div>
  );
}