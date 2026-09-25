import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div className="text-gray-300 text-8xl mb-4 font-bold">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-600 mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block bg-[#FF1E75] text-white px-6 py-2 rounded-lg hover:bg-[#e01a66] transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
