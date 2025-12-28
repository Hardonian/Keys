import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4">System Prompts</h1>
        <p className="text-xl text-gray-600 mb-8">
          Cursor business and development operations companion
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/chat"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Start Chatting
          </Link>
          <Link
            href="/profile"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Setup Profile
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/profile/settings"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Profile Settings
          </Link>
        </div>
      </div>
    </main>
  );
}
