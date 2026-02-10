'use client';

/**
 * 3D Icon Component - Examples & Documentation
 *
 * This file demonstrates all the ways to use the Icon3D component system.
 * Use these examples as a reference when implementing 3D icons in your app.
 */

import React from 'react';
import { Icon3D, ServerIcon3D, PlantIcon3D, WaterIcon3D } from './icon-3d';
import { Card } from './card';

export default function Icon3DExamples() {
  return (
    <div className="p-8 space-y-12 bg-zinc-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-light mb-2">3D Icon System</h1>
        <p className="text-zinc-600 mb-12">
          Modern, animated icons with 3D depth effects using layered gradients and transforms.
        </p>

        {/* Pre-built Icons */}
        <section className="mb-16">
          <h2 className="text-2xl font-light mb-6">Pre-built Icons</h2>
          <p className="text-zinc-600 mb-6">
            Use these ready-made icon components for common use cases:
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-8 group">
              <ServerIcon3D className="mb-4" />
              <h3 className="font-medium mb-2">ServerIcon3D</h3>
              <p className="text-sm text-zinc-600 mb-4">
                AI infrastructure, data centers, cloud computing
              </p>
              <pre className="bg-zinc-900 text-zinc-100 p-3 rounded text-xs overflow-x-auto">
                {`<ServerIcon3D />`}
              </pre>
            </Card>

            <Card className="p-8 group">
              <PlantIcon3D className="mb-4" />
              <h3 className="font-medium mb-2">PlantIcon3D</h3>
              <p className="text-sm text-zinc-600 mb-4">
                Agriculture, food supply, environmental
              </p>
              <pre className="bg-zinc-900 text-zinc-100 p-3 rounded text-xs overflow-x-auto">
                {`<PlantIcon3D />`}
              </pre>
            </Card>

            <Card className="p-8 group">
              <WaterIcon3D className="mb-4" />
              <h3 className="font-medium mb-2">WaterIcon3D</h3>
              <p className="text-sm text-zinc-600 mb-4">
                Water utilities, hydrology, liquid flows
              </p>
              <pre className="bg-zinc-900 text-zinc-100 p-3 rounded text-xs overflow-x-auto">
                {`<WaterIcon3D />`}
              </pre>
            </Card>
          </div>
        </section>

        {/* Size Variants */}
        <section className="mb-16">
          <h2 className="text-2xl font-light mb-6">Size Variants</h2>
          <Card className="p-8">
            <div className="flex items-end gap-8">
              <div className="text-center">
                <ServerIcon3D size="sm" className="mx-auto mb-2" />
                <p className="text-xs text-zinc-600">Small (sm)</p>
                <code className="text-xs bg-zinc-100 px-2 py-1 rounded">w-12 h-12</code>
              </div>
              <div className="text-center">
                <ServerIcon3D size="md" className="mx-auto mb-2" />
                <p className="text-xs text-zinc-600">Medium (md)</p>
                <code className="text-xs bg-zinc-100 px-2 py-1 rounded">w-16 h-16</code>
              </div>
              <div className="text-center">
                <ServerIcon3D size="lg" className="mx-auto mb-2" />
                <p className="text-xs text-zinc-600">Large (lg)</p>
                <code className="text-xs bg-zinc-100 px-2 py-1 rounded">w-20 h-20</code>
              </div>
              <div className="text-center">
                <ServerIcon3D size="xl" className="mx-auto mb-2" />
                <p className="text-xs text-zinc-600">Extra Large (xl)</p>
                <code className="text-xs bg-zinc-100 px-2 py-1 rounded">w-24 h-24</code>
              </div>
            </div>
            <pre className="bg-zinc-900 text-zinc-100 p-4 rounded mt-6 text-sm overflow-x-auto">
              {`<ServerIcon3D size="sm" />
<ServerIcon3D size="md" />  {/* default */}
<ServerIcon3D size="lg" />
<ServerIcon3D size="xl" />`}
            </pre>
          </Card>
        </section>

        {/* Color Variants */}
        <section className="mb-16">
          <h2 className="text-2xl font-light mb-6">Color Variants</h2>
          <Card className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <div className="text-center">
                <Icon3D variant="server" color="blue" className="mx-auto mb-2" />
                <p className="text-xs text-zinc-600">Blue</p>
              </div>
              <div className="text-center">
                <Icon3D variant="plant" color="emerald" className="mx-auto mb-2" />
                <p className="text-xs text-zinc-600">Emerald</p>
              </div>
              <div className="text-center">
                <Icon3D variant="water" color="cyan" className="mx-auto mb-2" />
                <p className="text-xs text-zinc-600">Cyan</p>
              </div>
              <div className="text-center">
                <Icon3D variant="server" color="purple" className="mx-auto mb-2" />
                <p className="text-xs text-zinc-600">Purple</p>
              </div>
              <div className="text-center">
                <Icon3D variant="plant" color="amber" className="mx-auto mb-2" />
                <p className="text-xs text-zinc-600">Amber</p>
              </div>
              <div className="text-center">
                <Icon3D variant="water" color="rose" className="mx-auto mb-2" />
                <p className="text-xs text-zinc-600">Rose</p>
              </div>
            </div>
            <pre className="bg-zinc-900 text-zinc-100 p-4 rounded mt-6 text-sm overflow-x-auto">
              {`<ServerIcon3D color="blue" />    {/* default for Server */}
<PlantIcon3D color="emerald" />  {/* default for Plant */}
<WaterIcon3D color="cyan" />     {/* default for Water */}

{/* Or override with any color: */}
<ServerIcon3D color="purple" />
<PlantIcon3D color="amber" />`}
            </pre>
          </Card>
        </section>

        {/* Custom Icons */}
        <section className="mb-16">
          <h2 className="text-2xl font-light mb-6">Custom Content</h2>
          <p className="text-zinc-600 mb-6">
            Create your own icon designs by passing custom content:
          </p>
          <Card className="p-8">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <Icon3D variant="custom" color="purple" className="mx-auto mb-4">
                  <div className="text-2xl font-bold text-white">$</div>
                </Icon3D>
                <p className="text-sm text-zinc-600">Currency/Finance</p>
              </div>
              <div className="text-center">
                <Icon3D variant="custom" color="rose" className="mx-auto mb-4">
                  <div className="w-6 h-6 bg-white/90 rounded-full animate-pulse" />
                </Icon3D>
                <p className="text-sm text-zinc-600">Alert/Status</p>
              </div>
              <div className="text-center">
                <Icon3D variant="custom" color="amber" className="mx-auto mb-4">
                  <div className="space-y-1">
                    <div className="w-6 h-1 bg-white/90 rounded" />
                    <div className="w-4 h-1 bg-white/70 rounded" />
                    <div className="w-5 h-1 bg-white/80 rounded" />
                  </div>
                </Icon3D>
                <p className="text-sm text-zinc-600">Menu/Navigation</p>
              </div>
            </div>
            <pre className="bg-zinc-900 text-zinc-100 p-4 rounded mt-6 text-sm overflow-x-auto">
              {`<Icon3D variant="custom" color="purple">
  <div className="text-2xl font-bold text-white">$</div>
</Icon3D>

<Icon3D variant="custom" color="rose">
  <div className="w-6 h-6 bg-white/90 rounded-full animate-pulse" />
</Icon3D>`}
            </pre>
          </Card>
        </section>

        {/* In Card Context */}
        <section className="mb-16">
          <h2 className="text-2xl font-light mb-6">Usage in Cards (with hover effects)</h2>
          <p className="text-zinc-600 mb-6">
            Icons automatically scale and rotate when placed inside cards with the <code className="bg-zinc-100 px-2 py-1 rounded">group</code> class:
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-8 hover:shadow-2xl transition-all group">
              <ServerIcon3D className="mb-4" />
              <h3 className="text-lg font-medium mb-2">AI Infrastructure</h3>
              <p className="text-sm text-zinc-600">
                Hover over this card to see the icon animation
              </p>
            </Card>
            <Card className="p-8 hover:shadow-2xl transition-all group">
              <PlantIcon3D className="mb-4" />
              <h3 className="text-lg font-medium mb-2">Food Systems</h3>
              <p className="text-sm text-zinc-600">
                Icons respond to parent group hover state
              </p>
            </Card>
            <Card className="p-8 hover:shadow-2xl transition-all group">
              <WaterIcon3D className="mb-4" />
              <h3 className="text-lg font-medium mb-2">Water Networks</h3>
              <p className="text-sm text-zinc-600">
                Smooth, professional animations included
              </p>
            </Card>
          </div>
          <pre className="bg-zinc-900 text-zinc-100 p-4 rounded mt-6 text-sm overflow-x-auto">
            {`<Card className="p-8 hover:shadow-2xl transition-all group">
  <ServerIcon3D className="mb-4" />
  <h3>Your Title</h3>
  <p>Your content</p>
</Card>`}
          </pre>
        </section>

        {/* Disable Hover */}
        <section className="mb-16">
          <h2 className="text-2xl font-light mb-6">Disable Hover Effects</h2>
          <Card className="p-8">
            <div className="flex gap-8 items-center">
              <div className="text-center">
                <ServerIcon3D disableHover className="mx-auto mb-2" />
                <p className="text-sm text-zinc-600">Static (no hover)</p>
              </div>
              <p className="text-zinc-600">
                Use <code className="bg-zinc-100 px-2 py-1 rounded">disableHover</code> prop
                when you don&apos;t want animation effects.
              </p>
            </div>
            <pre className="bg-zinc-900 text-zinc-100 p-4 rounded mt-6 text-sm overflow-x-auto">
              {`<ServerIcon3D disableHover />`}
            </pre>
          </Card>
        </section>

        {/* API Reference */}
        <section className="mb-16">
          <h2 className="text-2xl font-light mb-6">API Reference</h2>
          <Card className="p-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="text-left py-3 pr-4">Prop</th>
                  <th className="text-left py-3 pr-4">Type</th>
                  <th className="text-left py-3 pr-4">Default</th>
                  <th className="text-left py-3">Description</th>
                </tr>
              </thead>
              <tbody className="text-zinc-600">
                <tr className="border-b border-zinc-100">
                  <td className="py-3 pr-4 font-mono">variant</td>
                  <td className="py-3 pr-4">&apos;server&apos; | &apos;plant&apos; | &apos;water&apos; | &apos;custom&apos;</td>
                  <td className="py-3 pr-4">&apos;custom&apos;</td>
                  <td className="py-3">The icon design to display</td>
                </tr>
                <tr className="border-b border-zinc-100">
                  <td className="py-3 pr-4 font-mono">color</td>
                  <td className="py-3 pr-4">&apos;blue&apos; | &apos;emerald&apos; | &apos;cyan&apos; | &apos;purple&apos; | &apos;amber&apos; | &apos;rose&apos;</td>
                  <td className="py-3 pr-4">&apos;blue&apos;</td>
                  <td className="py-3">Gradient color scheme</td>
                </tr>
                <tr className="border-b border-zinc-100">
                  <td className="py-3 pr-4 font-mono">size</td>
                  <td className="py-3 pr-4">&apos;sm&apos; | &apos;md&apos; | &apos;lg&apos; | &apos;xl&apos;</td>
                  <td className="py-3 pr-4">&apos;md&apos;</td>
                  <td className="py-3">Icon size (12px to 24px)</td>
                </tr>
                <tr className="border-b border-zinc-100">
                  <td className="py-3 pr-4 font-mono">children</td>
                  <td className="py-3 pr-4">ReactNode</td>
                  <td className="py-3 pr-4">-</td>
                  <td className="py-3">Custom content (when variant=&apos;custom&apos;)</td>
                </tr>
                <tr className="border-b border-zinc-100">
                  <td className="py-3 pr-4 font-mono">className</td>
                  <td className="py-3 pr-4">string</td>
                  <td className="py-3 pr-4">-</td>
                  <td className="py-3">Additional CSS classes</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-mono">disableHover</td>
                  <td className="py-3 pr-4">boolean</td>
                  <td className="py-3 pr-4">false</td>
                  <td className="py-3">Disable hover animations</td>
                </tr>
              </tbody>
            </table>
          </Card>
        </section>

        {/* Design Principles */}
        <section>
          <h2 className="text-2xl font-light mb-6">Design Principles</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-medium mb-3">3D Depth Effect</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Created using three layered gradients with opposing rotations,
                giving the illusion of depth without requiring 3D transforms or complex CSS.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-medium mb-3">Smooth Animations</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                All animations use CSS transitions for optimal performance.
                Hover effects scale and rotate simultaneously for engaging interactions.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-medium mb-3">Gradient Systems</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Each color variant includes three gradient stops (400→500→600, 500→600→700)
                to create rich, dimensional color effects.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-medium mb-3">Accessible & Performant</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Pure CSS animations mean no JavaScript overhead. Animations respect
                user&apos;s motion preferences automatically via Tailwind.
              </p>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
