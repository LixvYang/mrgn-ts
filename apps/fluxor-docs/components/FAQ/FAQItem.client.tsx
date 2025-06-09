"use client"

import type { TypeFAQ } from '@/utils/types';
import React, { useState } from 'react'

export default function FAQItem({ answer, id, question }: Omit<TypeFAQ, 'key'> & { id: number }) {
  // State to keep track of which FAQ is open
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  // Function to toggle FAQ open/close
  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === id ? null : index);
  };

  return (
    <div
      className="relative my-3 w-full rounded-md border border-gray-300 px-12 py-8"
    >
      <div className="max-w-3xl">
        <h2 className="text-xl font-bold ">{question}</h2>
        {openFAQ === id && (
          <p className="font-inter mt-4 text-base font-light ">
            {answer}
          </p>
        )}
      </div>
      <button
        type="button"
        className="absolute right-5 top-9 focus:outline-none"
        onClick={() => toggleFAQ(id)}
        aria-label={`Toggle answer for: ${question}`}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="12" fill="white" />
          <path
            d="M7.04688 11.9999H16.9469"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 7.05005V16.95"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`${openFAQ === id ? "opacity-0" : "opacity-100"} transition-opacity duration-100 ease-in-out`}
          />
        </svg>
      </button>
    </div>
  )
}

