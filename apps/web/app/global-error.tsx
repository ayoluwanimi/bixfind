'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
            <div className="text-red-500 text-6xl mb-4">!</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Critical error</h1>
            <p className="text-gray-600 mb-6">
              {error.message || 'A critical error occurred. Please refresh the page.'}
            </p>
            <button
              onClick={reset}
              className="bg-[#FF1E75] text-white px-6 py-2 rounded-lg hover:bg-[#e01a66] transition-colors"
            >
              Refresh page
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
