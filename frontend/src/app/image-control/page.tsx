'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FeatureAvailabilityBadge } from '@/components/Features/FeatureAvailabilityBadge';

export default function ImageControlPage() {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    // Placeholder for future implementation
    setTimeout(() => {
      setGenerating(false);
      alert('Image Control feature is coming soon! This will integrate with DALL-E and other image generation APIs.');
    }, 1000);
  };

  return (
    <main id="main-content" className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Image Control & Design
            </h1>
            <FeatureAvailabilityBadge status="coming-soon" />
          </div>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-6">
            Complete visual asset management. Generate, control, and optimize images for your brand. Beyond code—full creative control.
          </p>
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-8 mb-12">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🚀</div>
            <div>
              <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Coming Soon in Q1 2024
              </h2>
              <p className="text-blue-800 dark:text-blue-200 mb-4">
                Image Control is currently in development. This feature will include:
              </p>
              <ul className="list-disc list-inside space-y-2 text-blue-800 dark:text-blue-200">
                <li>DALL-E integration for image generation</li>
                <li>Brand consistency enforcement</li>
                <li>Image optimization workflows</li>
                <li>Visual asset management</li>
                <li>Style guide integration</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Preview Interface */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Preview Interface
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Image Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {generating ? 'Generating...' : 'Generate Image (Coming Soon)'}
            </button>
          </div>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-slate-700">
            <div className="text-3xl mb-3">🎨</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Image Generation
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Generate images using DALL-E and other AI models. Control style, composition, and brand consistency.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-slate-700">
            <div className="text-3xl mb-3">🖼️</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Asset Management
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Organize, tag, and manage your visual assets. Keep brand consistency across all images.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-slate-700">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Optimization
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Optimize images for web, social media, and print. Automatic compression and format conversion.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Get Notified When Image Control Launches
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Sign up for Keys to be notified when Image Control becomes available. Start using other features today.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Sign Up for Updates
          </Link>
        </div>
      </div>
    </main>
  );
}
