'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  const redirectButtons = [
    {
      label: '✍️ Create Blog Post',
      path: '/blog/create',
      description: 'Edit blog with full-featured HTML editor',
    },
    {
      label: '📁 Create Project',
      path: '/project/create',
      description: 'Upload images, videos, and project details',
    },
    {
      label: '📸 Instagram Contents',
      path: '/instagram/contents',
      description: 'View scraped Instagram media and links',
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-8">
        <h1 className="text-4xl font-bold text-center text-gray-800">🚀 Welcome to Your Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {redirectButtons.map(({ label, path, description }) => (
            <div
              key={path}
              onClick={() => router.push(path)}
              className="bg-white shadow-md rounded-2xl p-6 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center justify-between">
                {label} <ArrowRight className="w-5 h-5" />
              </h2>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
