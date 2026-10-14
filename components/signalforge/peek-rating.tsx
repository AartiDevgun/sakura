'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { postJson } from '@/lib/research/client'
import {
  feedbackRequestSchema,
  feedbackResponseSchema,
  type BackendMode,
} from '@/lib/research/schema'

export function PeekRating({
  investigationId,
  backendMode,
}: {
  investigationId: string
  backendMode: BackendMode
}) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const submit = async () => {
    if (!rating || submitting) return
    setSubmitting(true)
    setMessage('')
    try {
      const result = await postJson(
        '/api/feedback',
        { investigationId, rating, comment: comment.trim() || undefined },
        feedbackResponseSchema,
      )
      setMessage(
        result.persisted
          ? 'Thank you. Your feedback has been saved.'
          : 'Thank you. Feedback was recorded for this demo, but not saved.',
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not submit feedback.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="rounded-2xl border border-pink-200/15 bg-white/[0.025] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pink-300/75">
        Help calibrate SAKURA
      </p>
      <h3 className="mt-2 text-lg font-medium text-pink-50">
        Was this research useful?
      </h3>
      <p className="mt-1 text-sm text-rose-100/55">
        Rate the quality of the evidence and reasoning, not whether you agree with the conclusion.
      </p>

      <div className="mt-4 flex gap-2" role="group" aria-label="Rate research from 1 to 5">
        {[1, 2, 3, 4, 5].map(value => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setRating(value)
              setMessage('')
            }}
            aria-label={`${value} out of 5 stars`}
            aria-pressed={rating === value}
            className="rounded-md p-1 text-pink-300 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-pink-300"
          >
            <Star
              size={24}
              strokeWidth={1.7}
              className={value <= rating ? 'fill-pink-300 text-pink-300' : 'fill-transparent text-pink-100/35'}
            />
          </button>
        ))}
      </div>

      <label htmlFor="sakura-feedback-comment" className="mt-4 block text-xs text-rose-100/60">
        Optional note
      </label>
      <textarea
        id="sakura-feedback-comment"
        value={comment}
        onChange={event => setComment(event.target.value)}
        maxLength={1000}
        rows={2}
        placeholder="What should be clearer, better sourced, or challenged?"
        className="mt-2 w-full resize-y rounded-xl border border-pink-200/15 bg-black/50 p-3 text-sm text-pink-50 placeholder:text-rose-100/30 focus-visible:outline-2 focus-visible:outline-pink-300"
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-rose-100/40">
          {backendMode === 'mock' ? 'Demo mode' : 'Private quality feedback'}
        </p>
        <button
          type="button"
          disabled={!rating || submitting}
          onClick={submit}
          className="rounded-full border border-pink-200/25 bg-pink-200/10 px-4 py-2 text-sm font-medium text-pink-100 transition hover:border-pink-200/50 hover:bg-pink-200/15 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? 'Sending…' : 'Send feedback'}
        </button>
      </div>
      {message ? (
        <p role="status" className="mt-3 text-sm text-pink-200/80">{message}</p>
      ) : null}
    </section>
  )
}
