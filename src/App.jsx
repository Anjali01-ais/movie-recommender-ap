import { useState, useRef, useEffect } from 'react'



const TMDB_API_KEY = 'your_tmdb_key_here' // 

const SYSTEM_PROMPT = (prefs) => `You are CineAI, a passionate movie recommender. Have a warm conversation to understand what the user wants, then recommend perfect movies.

User preferences:
- Language: ${prefs.language}
- Audience: ${prefs.audience}
- Dark mode: ${prefs.darkMode ? 'yes' : 'no'}

Guidelines:
- Greet warmly and ask what they're in the mood for.
- Ask about mood, genre, favorite past movies, era.
- After 2-3 messages recommend 2-3 movies with:
  🎬 Title (Year)
  Hook: one exciting line
  About: 2-3 sentences
  IMDb: rating
- ${prefs.audience === 'Family' ? 'Only recommend family-friendly, kid-safe movies. No violence, adult themes, or horror.' : ''}
- ${prefs.audience === 'Adult' ? 'You can recommend mature content including thrillers, horror, and adult dramas.' : ''}
- ${prefs.language === 'Hindi' ? 'Prioritize Bollywood and Hindi language films.' : ''}
- ${prefs.language === 'Korean' ? 'Prioritize Korean cinema and K-dramas.' : ''}
- After recommending ask if they want similar or something different.
- Stay in character as CineAI always.`

const SURPRISE_PROMPTS = [
  "Surprise me with a hidden gem most people haven't seen!",
  "Give me a random must-watch movie, any genre!",
  "Pick the best movie you'd recommend right now!",
  "Surprise me with a classic film I should watch!",
]

export default function App() {
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cineai-chat') || '[]') } catch { return [] }
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('cineai-dark') !== 'false')
  const [watchlist, setWatchlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cineai-watchlist') || '[]') } catch { return [] }
  })
  const [ratings, setRatings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cineai-ratings') || '{}') } catch { return {} }
  })
  const [showWatchlist, setShowWatchlist] = useState(false)
  const [language, setLanguage] = useState(() => localStorage.getItem('cineai-lang') || 'English')
  const [audience, setAudience] = useState(() => localStorage.getItem('cineai-audience') || 'All')
  const [posters, setPosters] = useState({})
  const bottomRef = useRef(null)

  const dm = darkMode

  const colors = {
    bg: dm ? '#0d0d0f' : '#f5f5f0',
    surface: dm ? '#18181f' : '#ffffff',
    border: dm ? '#2a2a35' : '#e0e0d8',
    text: dm ? '#e8e6e1' : '#1a1a1a',
    muted: dm ? '#666' : '#888',
    accent: '#f5c842',
    userBubble: '#f5c842',
    userText: '#0d0d0f',
    aiBubble: dm ? '#18181f' : '#ffffff',
    aiText: dm ? '#e8e6e1' : '#1a1a1a',
  }

  useEffect(() => {
    localStorage.setItem('cineai-chat', JSON.stringify(messages))
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => { localStorage.setItem('cineai-dark', darkMode) }, [darkMode])
  useEffect(() => { localStorage.setItem('cineai-watchlist', JSON.stringify(watchlist)) }, [watchlist])
  useEffect(() => { localStorage.setItem('cineai-ratings', JSON.stringify(ratings)) }, [ratings])
  useEffect(() => { localStorage.setItem('cineai-lang', language) }, [language])
  useEffect(() => { localStorage.setItem('cineai-audience', audience) }, [audience])

  useEffect(() => {
    if (messages.length === 0) startConversation()
  }, [])

  useEffect(() => {
    extractAndFetchPosters(messages)
  }, [messages])

  async function fetchPoster(title, year) {
    const key = `${title}-${year}`
    if (posters[key] || TMDB_API_KEY === 'your_tmdb_key_here') return
    try {
      const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&year=${year}`)
      const data = await res.json()
      const path = data.results?.[0]?.poster_path
      if (path) setPosters(p => ({ ...p, [key]: `https://image.tmdb.org/t/p/w200${path}` }))
    } catch {}
  }

  function extractAndFetchPosters(msgs) {
    msgs.forEach(msg => {
      if (msg.role !== 'assistant') return
      const matches = [...msg.content.matchAll(/🎬\s+(.+?)\s*\((\d{4})\)/g)]
      matches.forEach(([, title, year]) => fetchPoster(title.trim(), year))
    })
  }

  async function callGroq(msgs) {
    const prefs = { language, audience, darkMode }
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1000,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT(prefs) },
          ...msgs,
        ],
      }),
    })
    const data = await res.json()
    if (data.error) return 'Error: ' + data.error.message
    return data.choices?.[0]?.message?.content || 'Sorry, something went wrong!'
  }

  async function startConversation() {
    setLoading(true)
    try {
      const reply = await callGroq([{ role: 'user', content: 'Hello!' }])
      setMessages([{ role: 'assistant', content: reply }])
    } catch {
      setMessages([{ role: 'assistant', content: "Hey! I'm CineAI 🎬 What kind of movie are you in the mood for?" }])
    }
    setLoading(false)
  }

  async function sendMessage(text) {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    const newMessages = [...messages, { role: 'user', content: msg }]
    setMessages(newMessages)
    setLoading(true)
    try {
      const reply = await callGroq(newMessages)
      setMessages([...newMessages, { role: 'assistant', content: reply }])
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Network error. Try again.' }])
    }
    setLoading(false)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  function clearChat() {
    setMessages([])
    localStorage.removeItem('cineai-chat')
    setTimeout(startConversation, 100)
  }

  function addToWatchlist(title, year) {
    const item = { title, year, addedAt: Date.now() }
    if (!watchlist.find(w => w.title === title)) setWatchlist(w => [...w, item])
  }

  function removeFromWatchlist(title) {
    setWatchlist(w => w.filter(m => m.title !== title))
  }

  function rateMovie(title, star) {
    setRatings(r => ({ ...r, [title]: star }))
  }

  function extractMovies(content) {
    const matches = [...content.matchAll(/🎬\s+(.+?)\s*\((\d{4})\)/g)]
    return matches.map(([, title, year]) => ({ title: title.trim(), year }))
  }

  function surpriseMe() {
    const prompt = SURPRISE_PROMPTS[Math.floor(Math.random() * SURPRISE_PROMPTS.length)]
    sendMessage(prompt)
  }

  const s = {
    app: { minHeight: '100vh', background: colors.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: "'DM Sans', sans-serif", color: colors.text, transition: 'background 0.3s, color 0.3s' },
    header: { width: '100%', maxWidth: '760px', padding: '1.2rem 1.5rem 0.8rem', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' },
    logo: { fontFamily: "'DM Serif Display', serif", fontSize: '1.5rem', color: colors.accent, margin: 0 },
    headerRight: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
    pill: { background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '999px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer', color: colors.text, fontFamily: "'DM Sans', sans-serif" },
    activePill: { background: colors.accent, color: '#0d0d0f', border: 'none' },
    select: { background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '999px', padding: '4px 10px', fontSize: '12px', color: colors.text, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", outline: 'none' },
    chatWindow: { width: '100%', maxWidth: '760px', flex: 1, overflowY: 'auto', padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 'calc(100vh - 220px)' },
    msgWrap: (role) => ({ display: 'flex', flexDirection: 'column', alignItems: role === 'user' ? 'flex-end' : 'flex-start' }),
    roleLabel: (role) => ({ fontSize: '0.65rem', color: colors.muted, marginBottom: '3px', textAlign: role === 'user' ? 'right' : 'left', textTransform: 'uppercase', letterSpacing: '0.06em' }),
    bubble: (role) => ({ maxWidth: '80%', background: role === 'user' ? colors.userBubble : colors.aiBubble, color: role === 'user' ? colors.userText : colors.aiText, padding: '0.8rem 1rem', borderRadius: role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', fontSize: '0.9rem', lineHeight: '1.65', border: role === 'user' ? 'none' : `1px solid ${colors.border}`, whiteSpace: 'pre-wrap' }),
    movieRow: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' },
    movieCard: { background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '8px', display: 'flex', gap: '8px', alignItems: 'flex-start', minWidth: '180px', maxWidth: '220px' },
    poster: { width: '44px', height: '66px', borderRadius: '6px', objectFit: 'cover', background: colors.border, flexShrink: 0 },
    posterPlaceholder: { width: '44px', height: '66px', borderRadius: '6px', background: colors.border, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' },
    movieInfo: { flex: 1, minWidth: 0 },
    movieTitle: { fontSize: '11px', fontWeight: '500', color: colors.text, margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    movieYear: { fontSize: '10px', color: colors.muted, margin: '0 0 4px' },
    starRow: { display: 'flex', gap: '2px', marginBottom: '4px' },
    star: (filled) => ({ fontSize: '12px', cursor: 'pointer', color: filled ? '#f5c842' : colors.border }),
    addBtn: { fontSize: '10px', padding: '2px 8px', borderRadius: '999px', border: `1px solid ${colors.border}`, background: 'transparent', color: colors.text, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
    inputRow: { width: '100%', maxWidth: '760px', padding: '0.8rem 1.5rem 1.2rem', display: 'flex', gap: '8px', borderTop: `1px solid ${colors.border}`, background: colors.bg, position: 'sticky', bottom: 0 },
    input: { flex: 1, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '0.7rem 1rem', color: colors.text, fontSize: '0.9rem', outline: 'none', fontFamily: "'DM Sans', sans-serif", resize: 'none', lineHeight: '1.5' },
    sendBtn: { background: colors.accent, color: '#0d0d0f', border: 'none', borderRadius: '12px', padding: '0 1.1rem', fontWeight: '500', fontSize: '0.88rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 },
    surpriseBtn: { background: 'transparent', border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '0 0.9rem', fontSize: '0.85rem', cursor: 'pointer', color: colors.text, fontFamily: "'DM Sans', sans-serif", flexShrink: 0 },
    typing: { alignSelf: 'flex-start', background: colors.aiBubble, border: `1px solid ${colors.border}`, borderRadius: '18px 18px 18px 4px', padding: '0.8rem 1rem', color: colors.muted, fontSize: '0.85rem' },
    watchlistPanel: { position: 'fixed', top: 0, right: 0, width: '280px', height: '100vh', background: colors.surface, borderLeft: `1px solid ${colors.border}`, padding: '1.2rem', overflowY: 'auto', zIndex: 100, fontFamily: "'DM Sans', sans-serif" },
    watchlistTitle: { fontSize: '1rem', fontWeight: '500', color: colors.text, margin: '0 0 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    watchlistItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${colors.border}`, fontSize: '13px', color: colors.text },
    closeBtn: { background: 'none', border: 'none', color: colors.muted, cursor: 'pointer', fontSize: '18px' },
  }

  return (
    <div style={s.app}>
      {showWatchlist && (
        <div style={s.watchlistPanel}>
          <div style={s.watchlistTitle}>
            ❤️ Watchlist ({watchlist.length})
            <button style={s.closeBtn} onClick={() => setShowWatchlist(false)}>✕</button>
          </div>
          {watchlist.length === 0 && <p style={{ color: colors.muted, fontSize: '13px' }}>No movies saved yet. Ask CineAI for recommendations!</p>}
          {watchlist.map(m => (
            <div key={m.title} style={s.watchlistItem}>
              <div>
                <div style={{ fontWeight: '500' }}>{m.title}</div>
                <div style={{ fontSize: '11px', color: colors.muted }}>{m.year}</div>
                <div style={s.starRow}>
                  {[1,2,3,4,5].map(star => (
                    <span key={star} style={s.star(ratings[m.title] >= star)} onClick={() => rateMovie(m.title, star)}>★</span>
                  ))}
                </div>
              </div>
              <button style={s.closeBtn} onClick={() => removeFromWatchlist(m.title)}>✕</button>
            </div>
          ))}
        </div>
      )}

      <div style={s.header}>
        <h1 style={s.logo}>🎬 CineAI</h1>
        <div style={s.headerRight}>
          <select style={s.select} value={language} onChange={e => setLanguage(e.target.value)}>
            <option>English</option>
            <option>Hindi</option>
            <option>Korean</option>
            <option>Spanish</option>
            <option>French</option>
          </select>
          <select style={s.select} value={audience} onChange={e => setAudience(e.target.value)}>
            <option value="All">All audiences</option>
            <option value="Family">Family friendly</option>
            <option value="Adult">Adult</option>
          </select>
          <button style={{ ...s.pill }} onClick={() => setDarkMode(d => !d)}>{dm ? '☀️ Light' : '🌙 Dark'}</button>
          <button style={{ ...s.pill }} onClick={() => setShowWatchlist(w => !w)}>❤️ {watchlist.length}</button>
          <button style={{ ...s.pill }} onClick={clearChat}>🗑 Clear</button>
        </div>
      </div>

      <div style={s.chatWindow}>
        {messages.map((msg, i) => {
          const movies = msg.role === 'assistant' ? extractMovies(msg.content) : []
          return (
            <div key={i} style={s.msgWrap(msg.role)}>
              <div style={s.roleLabel(msg.role)}>{msg.role === 'user' ? 'You' : 'CineAI'}</div>
              <div style={s.bubble(msg.role)}>{msg.content}</div>
              {movies.length > 0 && (
                <div style={s.movieRow}>
                  {movies.map(({ title, year }) => {
                    const key = `${title}-${year}`
                    const inList = watchlist.find(w => w.title === title)
                    return (
                      <div key={key} style={s.movieCard}>
                        {posters[key]
                          ? <img src={posters[key]} alt={title} style={s.poster} />
                          : <div style={s.posterPlaceholder}>🎬</div>
                        }
                        <div style={s.movieInfo}>
                          <p style={s.movieTitle} title={title}>{title}</p>
                          <p style={s.movieYear}>{year}</p>
                          <div style={s.starRow}>
                            {[1,2,3,4,5].map(star => (
                              <span key={star} style={s.star(ratings[title] >= star)} onClick={() => rateMovie(title, star)}>★</span>
                            ))}
                          </div>
                          <button style={{ ...s.addBtn, background: inList ? colors.accent : 'transparent', color: inList ? '#0d0d0f' : colors.text }}
                            onClick={() => inList ? removeFromWatchlist(title) : addToWatchlist(title, year)}>
                            {inList ? '✓ Saved' : '+ Watchlist'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
        {loading && <div style={s.typing}>CineAI is thinking...</div>}
        <div ref={bottomRef} />
      </div>

      <div style={s.inputRow}>
        <button style={s.surpriseBtn} onClick={surpriseMe} disabled={loading}>✨ Surprise me</button>
        <textarea style={s.input} rows={1} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder="Tell me what you're in the mood for..." disabled={loading} />
        <button style={s.sendBtn} onClick={() => sendMessage()} disabled={loading}>Send</button>
      </div>
    </div>
  )
}
/ /   s t y l e s   a n d   t h e m e   c o n f i g u r e d  
 