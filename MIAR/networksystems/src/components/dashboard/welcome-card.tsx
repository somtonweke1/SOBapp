'use client';

import React from 'react';
import { Card } from '@/components/ui/card';

export function WelcomeCard() {
  return (
    <Card className="p-8 bg-gradient-to-br from-blue-50 to-indigo-100 border-0">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-zinc-900 mb-4">
          Welcome to MIAR
        </h1>
        <p className="text-xl text-zinc-700 mb-6">
          Mining Intelligence & Analytics Platform
        </p>
        <p className="text-zinc-600 max-w-2xl mx-auto">
          Transform complex network data into actionable business insights with our 
          cutting-edge analysis tools and visualization capabilities.
        </p>
        <div className="mt-8 flex justify-center space-x-4">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Get Started
          </button>
          <button className="px-6 py-3 border border-zinc-300 text-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors">
            Learn More
          </button>
        </div>
      </div>
    </Card>
  );
}