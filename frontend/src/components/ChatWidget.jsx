import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './ChatWidget.module.css'

// Scripted FAQ assistant: runs entirely in the browser, no API calls.
// Each topic matches on keywords; the topic with the most keyword hits answers.
const TOPICS = [
  {
    keywords: ['service', 'offer', 'do you do', 'what can', 'provide'],
    answer: 'We offer Family Tree Construction, Historical Records Research, DNA Analysis & Interpretation, Immigration & Ship Records, Military Records Research, Cemetery Visits, and Photo Restoration. Ask me about any of them!',
  },
  {
    keywords: ['price', 'cost', 'fee', 'charge', 'how much', 'budget', 'expensive', 'afford'],
    answer: 'Every project is quoted individually, since it depends on how far back you want to go and where the records are. The first consultation is free. Tell us about your project and budget on the contact form and we\'ll send a personalised research plan.',
    link: { to: '/contact', label: 'Get a free consultation' },
  },
  {
    keywords: ['free', 'consult', 'consultation'],
    answer: 'Yes, consultations are free. Fill in the contact form with a few details about your family and we\'ll reply within 2 business days.',
    link: { to: '/contact', label: 'Request a consultation' },
  },
  {
    keywords: ['family tree', 'tree', 'generation', 'ancestor', 'start', 'begin', 'get started'],
    answer: 'Family Tree Construction builds a multi-generation tree with documented sources and verified records. A good way to start is to write down what you already know (names, dates, places) and share it with us in a free consultation.',
    link: { to: '/contact', label: 'Start your family tree' },
  },
  {
    keywords: ['dna', 'ancestry.com', 'ancestrydna', '23andme', 'myheritage', 'match', 'ethnicity', 'genetic'],
    answer: 'Our DNA Analysis & Interpretation service works with AncestryDNA, 23andMe, and MyHeritage results to identify relatives and confirm lineages. Ryan is a trained DNA analyst on the Ancestry and 23andMe platforms.',
  },
  {
    keywords: ['record', 'census', 'birth', 'death', 'marriage', 'certificate', 'deed', 'archive', 'document'],
    answer: 'Historical Records Research covers census records, birth, marriage and death certificates, immigration documents, and land deeds, including pre-war European archives.',
  },
  {
    keywords: ['immigra', 'ship', 'manifest', 'ellis island', 'passenger', 'naturaliz', 'emigra'],
    answer: 'We trace your ancestors\' journey through port records, ship manifests, and naturalization papers, from their homeland to North America.',
  },
  {
    keywords: ['military', 'army', 'navy', 'war', 'wwi', 'wwii', 'ww1', 'ww2', 'world war', 'civil war','soldier', 'veteran', 'pension', 'draft', 'service record'],
    answer: 'Military Records Research uncovers service records, pension files, and draft registrations from conflicts spanning more than two centuries.',
  },
  {
    keywords: ['cemetery', 'grave', 'headstone', 'burial', 'buried', 'tomb'],
    answer: 'We offer cemetery visits: locating graves, taking photos, and maintenance, planting, and cleaning. Get in touch for a free consultation.',
    link: { to: '/contact', label: 'Ask about a cemetery visit' },
  },
  {
    keywords: ['photo', 'restor', 'picture', 'old photograph'],
    answer: 'Photo Restoration is available too. Mention it on the contact form and we\'ll be in touch.',
    link: { to: '/contact', label: 'Contact us' },
  },
  {
    keywords: ['poland', 'polish', 'jewish', 'ashkenazi', 'eastern europe', 'russia', 'ukrain', 'europe', 'italy', 'italian', 'country', 'countries', 'specialty', 'specialize'],
    answer: 'We specialise in Eastern European, Jewish, and North American lineages, and have researched in 15 countries. Premium members also get access to our Polish and Italian archive search tools.',
  },
  {
    keywords: ['premium', 'member', 'account', 'register', 'sign up', 'login', 'log in', 'archive search'],
    answer: 'You can create a free account to message us and see your research updates. Premium members also get the Polish and Italian archive search tools.',
    link: { to: '/register', label: 'Create an account' },
  },
  {
    keywords: ['who', 'about', 'ryan', 'experience', 'qualif', 'credential', 'certified', 'founder', 'history of'],
    answer: 'Makow Genealogy was founded in 2006 by Ryan Motchkavitz, BA (Political Science, Adelphi University), a member of the Association of Professional Genealogists and a trained DNA analyst. That\'s over 20 years of research and a 98% client satisfaction rate.',
    link: { to: '/about', label: 'About us' },
  },
  {
    keywords: ['how long', 'time', 'turnaround', 'reply', 'respond', 'when will', 'wait'],
    answer: 'We reply to every inquiry within 2 business days. Research timelines depend on the project and are covered in your personalised plan.',
  },
  {
    keywords: ['contact', 'email', 'phone', 'call', 'reach', 'talk', 'speak', 'hire', 'book'],
    answer: 'The best way to reach us is the contact form. We reply within 2 business days.',
    link: { to: '/contact', label: 'Go to the contact form' },
  },
  {
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
    answer: 'Hello! What would you like to know about tracing your family history?',
  },
  {
    keywords: ['thank', 'thanks', 'great', 'perfect', 'bye'],
    answer: 'You\'re welcome! Good luck with your family history search.',
  },
]

const FALLBACK = {
  answer: 'I\'m not sure about that one. I can answer questions about our services, pricing, DNA, records, and how to get started. For anything else, send us a message and we\'ll reply within 2 business days.',
  link: { to: '/contact', label: 'Contact us' },
}

const SUGGESTIONS = ['What services do you offer?', 'How much does it cost?', 'Can you help with DNA results?', 'How do I get started?']

const GREETING = { role: 'assistant', content: "Hi! I'm the Makow Genealogy assistant. Ask me about our research services, or pick a question below." }

function reply(question) {
  const q = ` ${question.toLowerCase().replace(/[^a-z0-9.' ]/g, ' ')} `
  let best = null, bestScore = 0
  for (const topic of TOPICS) {
    // Pad short keywords with spaces so "hi" doesn't match inside "history".
    const score = topic.keywords.filter(k => q.includes(k.length <= 3 ? ` ${k} ` : k)).length
    if (score > bestScore) { best = topic; bestScore = score }
  }
  const { answer, link } = best || FALLBACK
  return { role: 'assistant', content: answer, link }
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput] = useState('')
  const listRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages, open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const ask = text => {
    text = text.trim()
    if (!text) return
    setMessages(ms => [...ms, { role: 'user', content: text }, reply(text)])
    setInput('')
  }

  const askedSomething = messages.length > 1

  return (
    <>
      {open && (
        <div className={styles.panel} role="dialog" aria-label="Chat with Makow Genealogy">
          <div className={styles.header}>
            <span className={styles.title}>Ask Makow Genealogy</span>
            <button className={styles.close} onClick={() => setOpen(false)} aria-label="Close chat">×</button>
          </div>

          <div className={styles.list} ref={listRef} aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={`${styles.msg} ${styles[m.role]}`}>
                {m.content}
                {m.link && (
                  <Link to={m.link.to} className={styles.msgLink} onClick={() => setOpen(false)}>
                    {m.link.label} →
                  </Link>
                )}
              </div>
            ))}
            {!askedSomething && (
              <div className={styles.suggestions}>
                {SUGGESTIONS.map(s => (
                  <button key={s} className={styles.chip} onClick={() => ask(s)}>{s}</button>
                ))}
              </div>
            )}
          </div>

          <form className={styles.form} onSubmit={e => { e.preventDefault(); ask(input) }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your question…"
              maxLength={500}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={!input.trim()}>
              Send
            </button>
          </form>
        </div>
      )}

      <button
        className={styles.launcher}
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open ? '×' : '💬'}
      </button>
    </>
  )
}
