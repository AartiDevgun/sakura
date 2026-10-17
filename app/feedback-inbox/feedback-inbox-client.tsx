'use client'

import { useState } from 'react'
import { LockKeyhole, RefreshCw, Star } from 'lucide-react'

type FeedbackEntry = {
  id: string
  investigationId: string
  rating: number
  comment?: string
  submittedAt: string
}

export function FeedbackInboxClient() {
  const [token, setToken] = useState('')
  const [entries, setEntries] = useState<FeedbackEntry[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

  async function loadFeedback(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    if (!token.trim() || busy) return
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/feedback?limit=200', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token.trim()}` },
        cache: 'no-store',
      })
      const data = await response.json() as { feedback?: FeedbackEntry[]; error?: string }
      if (!response.ok) throw new Error(data.error || `Feedback could not be loaded (${response.status}).`)
      setEntries(Array.isArray(data.feedback) ? data.feedback : [])
      setLoaded(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Feedback could not be loaded.')
      setEntries([])
      setLoaded(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-dvh bg-black px-4 py-10 text-rose-50 sm:px-8">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(190,24,93,0.16),transparent_55%)]" />
      <div className="relative mx-auto max-w-4xl space-y-7">
        <a href="/" className="text-xs uppercase tracking-[0.24em] text-pink-300/65 hover:text-pink-200">SAKURA · Back to research</a>
        <header className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-pink-300/75">Private quality dashboard</p>
          <h1 className="font-serif text-3xl font-semibold sm:text-5xl">Feedback inbox</h1>
          <p className="max-w-2xl text-sm leading-7 text-rose-100/55">
            See the ratings and optional comments submitted under “Help calibrate SAKURA”. The inbox is private and retains up to 500 recent entries for 180 days.
          </p>
        </header>

        <form onSubmit={loadFeedback} className="rounded-2xl border border-pink-200/15 bg-white/[0.025] p-5 sm:p-6">
          <label htmlFor="feedback-admin-token" className="flex items-center gap-2 text-sm font-medium text-pink-50">
            <LockKeyhole size={16} className="text-pink-300" /> Inbox access token
          </label>
          <p className="mt-1 text-xs leading-5 text-rose-100/45">Use the value of SAKURA_FEEDBACK_ADMIN_TOKEN you set in Vercel. It is only held in this page’s memory and is not saved to browser storage.</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input id="feedback-admin-token" type="password" autoComplete="off" value={token} onChange={event => setToken(event.target.value)} className="h-11 min-w-0 flex-1 rounded-xl border border-pink-200/15 bg-black/60 px-3 text-sm text-pink-50 outline-none focus:border-pink-300/60" placeholder="Paste your private inbox token" />
            <button disabled={busy || token.trim().length < 32} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-200 to-pink-400 px-4 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-45">
              <RefreshCw size={15} className={busy ? 'animate-spin' : ''} /> {busy ? 'Loading…' : loaded ? 'Refresh inbox' : 'Open inbox'}
            </button>
          </div>
          {error ? <p role="alert" className="mt-3 rounded-xl border border-rose-300/20 bg-rose-950/25 p-3 text-sm text-rose-200">{error}</p> : null}
        </form>

        {loaded ? (
          <section className="space-y-3" aria-live="polite">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-rose-50">Latest submissions</h2>
              <span className="rounded-full border border-pink-200/15 px-3 py-1 text-xs text-pink-200/75">{entries.length} feedback entr{entries.length === 1 ? 'y' : 'ies'}</span>
            </div>
            {entries.length ? entries.map(entry => (
              <article key={entry.id} className="rounded-2xl border border-pink-200/12 bg-white/[0.025] p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-1" aria-label={`${entry.rating} out of 5 stars`}>
                    {[1,2,3,4,5].map(star => <Star key={star} size={16} className={star <= entry.rating ? 'fill-pink-300 text-pink-300' : 'text-rose-100/20'} />)}
                    <span className="ml-2 text-xs text-rose-100/60">{entry.rating}/5</span>
                  </div>
                  <time className="text-xs text-rose-100/40" dateTime={entry.submittedAt}>{new Date(entry.submittedAt).toLocaleString()}</time>
                </div>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-rose-100/80">{entry.comment || 'No written comment provided.'}</p>
                <p className="mt-3 break-all text-[10px] text-rose-100/30">Investigation ID: {entry.investigationId}</p>
              </article>
            )) : <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-sm text-rose-100/55">No indexed feedback yet. New submissions will appear here after users send their rating.</div>}
          </section>
        ) : null}
      </div>
    </main>
  )
}
