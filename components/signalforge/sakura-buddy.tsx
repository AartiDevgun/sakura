'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { MessageCircle, Send, Sparkles, X } from 'lucide-react'

type Message = { role: 'user' | 'assistant'; content: string }
type Mood = 'smile' | 'wink' | 'happy' | 'curious'

function BlossomFace({ mood }: { mood: Mood }) {
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={mood === 'wink' ? 'Winking cherry blossom' : 'Smiling cherry blossom'} className="h-full w-full drop-shadow-[0_4px_16px_rgba(244,114,182,0.35)]">
      <g fill="#f9a8d4" stroke="#fce7f3" strokeWidth="1.5">
        <ellipse cx="50" cy="24" rx="17" ry="22" />
        <ellipse cx="74" cy="42" rx="17" ry="22" transform="rotate(55 74 42)" />
        <ellipse cx="65" cy="70" rx="17" ry="22" transform="rotate(130 65 70)" />
        <ellipse cx="35" cy="70" rx="17" ry="22" transform="rotate(230 35 70)" />
        <ellipse cx="26" cy="42" rx="17" ry="22" transform="rotate(305 26 42)" />
      </g>
      <circle cx="50" cy="51" r="23" fill="#fff1f7" stroke="#f472b6" strokeWidth="2" />
      <g fill="#51223f">
        {mood === 'wink'
          ? <><ellipse cx="41" cy="48" rx="3.4" ry="5.5" /><path d="M55 48q5 5 10 0" fill="none" stroke="#51223f" strokeWidth="3" strokeLinecap="round" /></>
          : <><ellipse cx="41" cy="48" rx="3.4" ry={mood === 'happy' ? 6 : 5.5} /><ellipse cx="60" cy="48" rx="3.4" ry={mood === 'happy' ? 6 : 5.5} /></>}
      </g>
      <g fill="#f4a3bd"><ellipse cx="34" cy="57" rx="5" ry="2.5" /><ellipse cx="67" cy="57" rx="5" ry="2.5" /></g>
      <path d={mood === 'curious' ? 'M46 62q4 -4 8 0' : mood === 'happy' ? 'M42 59q8 12 16 0' : 'M43 59q7 8 14 0'} fill="none" stroke="#9d356a" strokeWidth="2.8" strokeLinecap="round" />
      {mood === 'happy' ? <path d="M78 14l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#fde68a" /> : null}
    </svg>
  )
}

export function SakuraBuddy() {
  const [open, setOpen] = useState(false)
  const [mood, setMood] = useState<Mood>('smile')
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi, I’m Sakura! 🌸 Ask me about money, stocks, banks, startups, or any finance word that feels confusing. I’ll explain it simply.' },
  ])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const moods: Mood[] = ['smile', 'wink', 'happy', 'curious']
    let index = 0
    const timer = window.setInterval(() => {
      index = (index + 1) % moods.length
      setMood(moods[index])
    }, 2600)
    return () => window.clearInterval(timer)
  }, [])

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = question.trim()
    if (text.length < 2 || busy) return
    setMessages(current => [...current, { role: 'user', content: text }])
    setQuestion('')
    setBusy(true)
    setError('')
    setMood('curious')
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      })
      const data = await response.json() as { answer?: string; error?: string }
      if (!response.ok || !data.answer) throw new Error(data.error || 'Sakura could not answer just now. Please try again.')
      setMessages(current => [...current, { role: 'assistant', content: data.answer! }])
      setMood('happy')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not reach Sakura. Please try again.')
      setMood('wink')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed bottom-28 right-4 z-[70] flex flex-col items-end gap-3 sm:bottom-7 sm:right-6">
      {open ? (
        <section className="flex h-[min(560px,72dvh)] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[1.6rem] border border-pink-200/20 bg-[#100710]/95 shadow-[0_20px_80px_rgba(0,0,0,0.65),0_0_40px_rgba(236,72,153,0.12)] backdrop-blur-2xl" aria-label="Chat with Sakura">
          <header className="flex items-center gap-3 border-b border-pink-200/10 bg-pink-200/[0.04] p-4">
            <div className="h-12 w-12 shrink-0"><BlossomFace mood={mood} /></div>
            <div className="min-w-0 flex-1">
              <p className="font-serif text-lg text-pink-50">Sakura</p>
              <p className="text-[10px] uppercase tracking-[0.15em] text-pink-200/50">Your finance learning buddy</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close Sakura chat" className="rounded-full p-2 text-pink-100/60 hover:bg-white/10"><X size={17} /></button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto p-3" aria-live="polite">
            {messages.map((message, index) => (
              <div key={index} className={message.role === 'user' ? 'ml-7 rounded-2xl rounded-br-sm bg-pink-200/15 px-3.5 py-3 text-sm leading-6 text-pink-50' : 'mr-5 rounded-2xl rounded-bl-sm border border-pink-200/10 bg-white/[0.035] px-3.5 py-3 text-sm leading-6 text-rose-50/85'}>
                {message.content}
              </div>
            ))}
            {busy ? <div className="mr-5 flex items-center gap-2 rounded-2xl border border-pink-200/10 px-3 py-3 text-sm text-pink-200/70"><span className="h-2 w-2 animate-pulse rounded-full bg-pink-300" /> Sakura is thinking…</div> : null}
            {error ? <p role="alert" className="px-2 text-xs leading-5 text-rose-300">{error}</p> : null}
          </div>
          <form onSubmit={send} className="flex items-end gap-2 border-t border-pink-200/10 p-3">
            <textarea value={question} onChange={event => setQuestion(event.target.value)} maxLength={1000} rows={2} placeholder="Ask anything about finance…" className="min-h-11 flex-1 resize-none rounded-xl border border-pink-200/15 bg-black/40 p-3 text-sm text-pink-50 outline-none placeholder:text-pink-100/30 focus:border-pink-200/45" />
            <button type="submit" disabled={busy || question.trim().length < 2} aria-label="Send question to Sakura" className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-200 to-pink-400 text-[#270d20] transition hover:scale-105 disabled:opacity-40"><Send size={16} /></button>
          </form>
          <p className="px-4 pb-3 text-[9px] leading-4 text-pink-100/35">Educational information only. Not live market data or investment advice.</p>
        </section>
      ) : null}
      <button type="button" onClick={() => { setOpen(value => !value); setMood('wink') }} aria-label={open ? 'Close Sakura finance chat' : 'Open Sakura finance chat'} aria-expanded={open} className="group relative flex h-[68px] w-[68px] items-center justify-center rounded-full border border-pink-200/35 bg-[#190b17] p-2 shadow-[0_0_26px_rgba(244,114,182,0.25)] transition duration-300 hover:scale-105 hover:shadow-[0_0_38px_rgba(244,114,182,0.45)]">
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-pink-100/40 bg-pink-300 text-[#38112a]"><Sparkles size={11} /></span>
        <BlossomFace mood={mood} />
      </button>
      {!open ? <span className="rounded-full border border-pink-200/15 bg-black/75 px-3 py-1.5 text-[10px] text-pink-100/70 shadow-lg"><MessageCircle size={11} className="mr-1 inline" /> Ask Sakura</span> : null}
    </div>
  )
}
