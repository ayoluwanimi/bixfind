'use client'

import { useState } from 'react'
import BookingDialog from './BookingDialog'

export default function BookServiceButton({
  serviceId,
  serviceTitle,
  providerName,
  price,
  currency,
}: {
  serviceId: string
  serviceTitle: string
  providerName: string
  price: number
  currency?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        Book Now
      </button>
      {open && (
        <BookingDialog
          serviceId={serviceId}
          serviceTitle={serviceTitle}
          providerName={providerName}
          price={price}
          currency={currency}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
