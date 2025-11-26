import Link from 'next/link';

export default function PortfolioNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-purple-50 p-8">
      <div className="max-w-md text-center">
        <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-purple-100 text-5xl">
          🔍
        </div>
        <h1 className="mb-4 text-3xl font-bold text-gray-900">
          Portfolio Not Found
        </h1>
        <p className="mb-8 text-gray-600">
          The portfolio you're looking for doesn't exist or hasn't been published yet.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white transition-all hover:from-purple-600 hover:to-pink-600"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}

