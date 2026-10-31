import React from 'react'
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface PublishConfirmationProps {
    isOpen: boolean
    eventTitle: string
    onClose: () => void
    onConfirmPublish: () => void
}

export default function PublishConfirmation({isOpen, eventTitle, onClose, onConfirmPublish}: PublishConfirmationProps) {
    if(!isOpen) return null

  return (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop:blur-xs p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl border border-neutral-100 overflow-hidden">
        <div className="flex justify-between items-start px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="font-bold text-neutral-900 text-base">Publish Event</h2>
              <p className="text-xs text-neutral-400 mt-0.5">This action cannot be canceled</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 pb-4 text-sm text-neutral-600">
          <p>Do you really want to publish this event:</p>
          <p className="font-semibold text-neutral-900 mt-1.5 leading-snug">
            &ldquo;{eventTitle}&rdquo;
          </p>
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
            <p>Once published, the event will be immediately visible to the public on the Browse Events page.</p>
            <p>Ticket buyers can start making transactions right away.</p>
          </div>
        </div>
        <div className="flex gap-2.5 px-6 py-4 bg-neutral-50 border-t border-neutral-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-full text-sm font-semibold text-neutral-600 border border-neutral-200 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirmPublish}
            className="flex-1 py-2 rounded-full text-sm font-semibold text-white bg-[#EA580C] hover:bg-[#BB4D00] transition-colors cursor-pointer shadow-xs"
          >
            Agree to Publish
          </button>
        </div>
      </div>
    </div>
  );
}
