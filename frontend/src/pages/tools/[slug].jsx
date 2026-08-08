/**
 * GRADSKOOL — Tools Individual Page
 * Route: /tools/[slug]
 *
 * Rebuilt from static HTML exactly:
 * - Lead gate modal (name + phone + email + target exam)
 * - Tool header (name, description, question count, exam badge)
 * - Topic nav (search + pill buttons)
 * - Tool body: varies by tool_type
 *     grammar/gk/reasoning/legal → topic blocks (accordion + tabs: Rules | ALP Insight | Quiz)
 *     rc_passages                → passage list + passage detail + MCQ
 *     vocabulary                 → vocab flashcard
 *     mcq_practice               → plain MCQ stream
 * - Question card: num, text, 4 options, correct highlight, explanation
 *
 * Design tokens from static HTML:
 *   --accent:#ff5e5f  --black:#0f0f0f  --gray-5:#f7f7f7  --border:#e2e2e2
 *   font: Nunito/Nunito Sans + DM Mono
 *   question-card border: 1.5px solid #0f0f0f
 *   option-btn border: 1.5px solid #e2e2e2 → hover black bg
 *   active topic pill: bg #ff5e5f text white
 */
import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  useToolDetail, useToolGate,
  usePassageList, usePassageDetail,
  useVocabList, useQATopics, useQATopicDetail,
} from '../../hooks/useToolsBlogDashboard'

// ── DESIGN TOKENS (from static HTML) ─────────────────────────────────────────

const T = {
  accent:  '#ff5e5f',
  black:   '#0f0f0f',
  gray1:   '#444',
  gray2:   '#777',
  gray3:   '#ccc',
  gray5:   '#f7f7f7',
  white:   '#fff',
  border:  '#e2e2e2',
  mono:    "'DM Mono', 'Courier New', monospace",
  sans:    "'Nunito Sans', var(--font-sans), system-ui, sans-serif",
  head:    "'Nunito', var(--font-sans), system-ui, sans-serif",
}

export default function ToolPage() {
  const router = useRouter()
  const { slug } = router.query
  const { tool, loading } = useToolDetail(slug)
  // Lead gate removed — all tools are freely accessible
  const hasAccess = true
  const justUnlocked = false

  if (loading) return <ToolSkeleton />
  if (!tool)   return (
    <div style={{ padding:'4rem', textAlign:'center', fontFamily:T.sans }}>
      <p style={{ color:T.gray2, marginBottom:'1rem' }}>Tool not found.</p>
      <Link href="/tools" style={{ color:T.accent, textDecoration:'none' }}>← All Tools</Link>
    </div>
  )

  const showGate = tool.requires_lead_gate && !hasAccess && !justUnlocked

  return (
    <>
      <Head>
        <title>{tool.meta_title || `${tool.name} — GRADSKOOL Free Tool`}</title>
        <meta name="description" content={tool.meta_desc || tool.description} />
      </Head>

      {/* Lead gate */}
      {showGate && (
        
      )}

      {/* Topbar */}
      <header style={hdr.bar}>
        <Link href="/" style={hdr.logo}>
          GRAD<span style={{ color:T.accent }}>SKOOL</span>
        </Link>
        <div style={hdr.center}>
          <Link href="/tools" style={hdr.back}>← All Tools</Link>
          <span style={hdr.sep}>/</span>
          <span style={hdr.name}>{tool.name}</span>
        </div>
        <div style={hdr.right}>
          <span style={hdr.badge}>FREE TOOL</span>
          <Link href="/courses" style={hdr.enrol}>Enrol Now →</Link>
        </div>
      </header>

      {/* Tool hero */}
      <div style={hero.wrap}>
        <div style={hero.inner}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'2rem', flexWrap:'wrap' }}>
            <div>
              <p style={hero.eyebrow}>{tool.tool_type?.replace(/_/g,' ').toUpperCase()}</p>
              <h1 style={hero.title}>{tool.name}</h1>
              <p style={hero.desc}>{tool.description}</p>
            </div>
            <div style={{ display:'flex', gap:'1rem', flexShrink:0, flexWrap:'wrap' }}>
              {tool.question_count > 0 && (
                <div style={hero.stat}>
                  <span style={hero.statNum}>{tool.question_count.toLocaleString()}</span>
                  <span style={hero.statLabel}>Questions</span>
                </div>
              )}
              {tool.tags?.map(t => (
                <div key={t.slug || t.name} style={hero.examBadge}>{t.name}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tool body — by type */}
      {tool.tool_type === 'rc_passages' && <RCPassageTool toolSlug={slug} />}
      {tool.tool_type === 'vocabulary'   && <VocabTool toolSlug={slug} />}
      {tool.tool_type === 'qa_topics'    && <QATool toolSlug={slug} />}
      {['grammar','gk','reasoning','legal','mcq_practice'].includes(tool.tool_type) && (
        <MCQTopicTool toolSlug={slug} tool={tool} />
      )}
    </>
  )
}

// ── RC PASSAGE TOOL ───────────────────────────────────────────────────────────

function RCPassageTool({ toolSlug }) {
  const { passages, loading } = usePassageList(toolSlug)
  const [selected, setSelected] = useState(null)
  const [search, setSearch]     = useState('')

  const filtered = (passages || []).filter(p =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <BodySkel />
  if (selected) return <PassageDetail passageId={selected.id} onBack={() => setSelected(null)} />

  return (
    <div style={body.wrap}>
      <div style={body.container}>
        {/* Search */}
        <div style={tn.bar}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search passages by title or category…"
            style={tn.search}
          />
        </div>
        {/* Passage grid */}
        <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
          {filtered.map(p => (
            <button key={p.id} onClick={() => setSelected(p)} style={passCard.btn}>
              <div style={passCard.left}>
                {p.category && <span style={passCard.cat}>{p.category}</span>}
                <span style={passCard.title}>{p.title || `Passage ${p.id}`}</span>
              </div>
              <div style={passCard.right}>
                {p.question_count && <span style={passCard.qCount}>{p.question_count}Q</span>}
                <span style={passCard.arrow}>→</span>
              </div>
            </button>
          ))}
        </div>
        {filtered.length === 0 && <p style={{ padding:'2rem', textAlign:'center', color:T.gray2, fontFamily:T.sans, fontSize:'14px' }}>No passages found.</p>}
      </div>
    </div>
  )
}

function PassageDetail({ passageId, onBack }) {
  const { passage, questions, loading } = usePassageDetail(passageId)
  const [answers, setAnswers]   = useState({})
  const [revealed, setRevealed] = useState({})

  const answer = (qId, optId, correct) => {
    if (answers[qId] !== undefined) return
    setAnswers(a => ({ ...a, [qId]: optId }))
    setRevealed(r => ({ ...r, [qId]: true }))
  }

  if (loading) return <BodySkel />

  return (
    <div style={body.wrap}>
      <div style={body.containerWide}>
        <button onClick={onBack} style={qcard.backBtn}>← Back to passages</button>

        {passage && (
          <div style={pass.box}>
            <p style={pass.label}>{passage.category}</p>
            <h2 style={pass.title}>{passage.title}</h2>
            <div style={pass.text}>{passage.text}</div>
          </div>
        )}

        <div style={{ marginTop:'2rem' }}>
          {(questions || []).map((q, i) => (
            <QuestionCard
              key={q.id} q={q} idx={i}
              answer={answers[q.id]}
              revealed={revealed[q.id]}
              onAnswer={(optId, correct) => answer(q.id, optId, correct)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── VOCAB TOOL ────────────────────────────────────────────────────────────────

function VocabTool({ toolSlug }) {
  const { words, loading } = useVocabList(toolSlug)
  const [idx, setIdx]     = useState(0)
  const [flipped, setFlip]= useState(false)
  const [search, setSearch]= useState('')
  const [diff, setDiff]   = useState('all')

  const filtered = (words || []).filter(w => {
    if (search && !w.word?.toLowerCase().includes(search.toLowerCase())) return false
    if (diff !== 'all' && w.difficulty !== diff) return false
    return true
  })

  const cur = filtered[idx]

  if (loading) return <BodySkel />

  return (
    <div style={body.wrap}>
      <div style={body.container}>
        {/* Filters */}
        <div style={tn.bar}>
          <input value={search} onChange={e => { setSearch(e.target.value); setIdx(0) }}
            placeholder="Search words…" style={tn.search} />
          <div style={tn.grid}>
            {['all','Easy','Medium','Hard'].map(d => (
              <button key={d} onClick={() => { setDiff(d); setIdx(0) }}
                style={{ ...tn.pill, ...(diff===d ? tn.pillActive : {}) }}>{d}</button>
            ))}
          </div>
        </div>

        {/* Progress */}
        <div style={vocab.progress}>
          <div style={{ fontFamily:T.head, fontSize:'11px', fontWeight:'800', letterSpacing:'1.5px', textTransform:'uppercase', color:T.gray2 }}>
            {idx+1} of {filtered.length}
          </div>
          <div style={{ flex:1, height:'2px', background:T.gray3, marginLeft:'1rem' }}>
            <div style={{ height:'100%', background:T.black, width:`${((idx+1)/Math.max(filtered.length,1))*100}%`, transition:'width 0.4s' }} />
          </div>
        </div>

        {cur ? (
          <div style={vocab.card} onClick={() => setFlip(f => !f)}>
            {!flipped ? (
              <div style={{ textAlign:'center' }}>
                <p style={vocab.word}>{cur.word}</p>
                <p style={vocab.hint}>Click to reveal meaning</p>
              </div>
            ) : (
              <div>
                <p style={vocab.word}>{cur.word}</p>
                {cur.pos    && <span style={vocab.pos}>{cur.pos}</span>}
                <p style={vocab.meaning}>{cur.meaning}</p>
                {cur.example && <p style={vocab.example}>"{cur.example}"</p>}
                {cur.synonyms && <p style={vocab.syns}>Also: {cur.synonyms}</p>}
              </div>
            )}
          </div>
        ) : (
          <p style={{ padding:'2rem', textAlign:'center', color:T.gray2, fontFamily:T.sans, fontSize:'14px' }}>No words found.</p>
        )}

        <div style={vocab.nav}>
          <button onClick={() => { setIdx(i => Math.max(0,i-1)); setFlip(false) }}
            disabled={idx===0} style={vocab.navBtn}>← Prev</button>
          <button onClick={() => { setIdx(i => Math.min(filtered.length-1,i+1)); setFlip(false) }}
            disabled={idx>=filtered.length-1} style={vocab.navBtn}>Next →</button>
        </div>
      </div>
    </div>
  )
}

// ── QA TOOL ───────────────────────────────────────────────────────────────────

function QATool({ toolSlug }) {
  const { topics, loading } = useQATopics(toolSlug)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = (topics || []).filter(t =>
    !search || t.title?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <BodySkel />
  if (selected) return <QATopicDetail topicId={selected.id} toolSlug={toolSlug} onBack={() => setSelected(null)} />

  return (
    <div style={body.wrap}>
      <div style={body.container}>
        <div style={tn.bar}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search topics…" style={tn.search} />
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
          {filtered.map(t => (
            <button key={t.id} onClick={() => setSelected(t)} style={passCard.btn}>
              <div style={passCard.left}>
                {t.section && <span style={passCard.cat}>{t.section}</span>}
                <span style={passCard.title}>{t.title}</span>
              </div>
              <div style={passCard.right}>
                {t.question_count > 0 && <span style={passCard.qCount}>{t.question_count}Q</span>}
                <span style={passCard.arrow}>→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function QATopicDetail({ topicId, toolSlug, onBack }) {
  const { topic, questions, loading } = useQATopicDetail(toolSlug, topicId)
  const [tab, setTab]       = useState('rules')
  const [answers, setAnswers]   = useState({})
  const [revealed, setRevealed] = useState({})

  if (loading) return <BodySkel />

  return (
    <div style={body.wrap}>
      <div style={body.container}>
        <button onClick={onBack} style={qcard.backBtn}>← Back to topics</button>
        <h2 style={{ fontFamily:T.head, fontSize:'22px', fontWeight:'800', color:T.black, marginBottom:'1.5rem' }}>{topic?.title}</h2>

        {/* Tab bar */}
        <div style={tabs.bar}>
          {[['rules','Rules'], ['insight','ALP Insight'], ['quiz','Quiz']].map(([val,lbl]) => (
            <button key={val} onClick={() => setTab(val)}
              style={{ ...tabs.btn, ...(tab===val ? tabs.active : {}) }}>
              {lbl}
            </button>
          ))}
        </div>

        {/* Rules */}
        {tab === 'rules' && topic?.concept_notes && (
          <div style={rules.box} dangerouslySetInnerHTML={{ __html: topic.concept_notes }} />
        )}

        {/* ALP Insight */}
        {tab === 'insight' && topic?.alp_insight && (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {topic.alp_insight.split('\n\n').map((para, i) => (
              <div key={i} style={alp.card}>{para}</div>
            ))}
          </div>
        )}

        {/* Quiz */}
        {tab === 'quiz' && (
          <div style={{ marginTop:'1rem' }}>
            {!questions?.length
              ? <p style={{ fontFamily:T.sans, fontSize:'14px', color:T.gray2, padding:'2rem 0' }}>No questions yet.</p>
              : questions.map((q, i) => (
                <QuestionCard key={q.id} q={q} idx={i}
                  answer={answers[q.id]}
                  revealed={revealed[q.id]}
                  onAnswer={(optId) => {
                    if (answers[q.id] !== undefined) return
                    setAnswers(a => ({ ...a, [q.id]: optId }))
                    setRevealed(r => ({ ...r, [q.id]: true }))
                  }}
                />
              ))
            }
          </div>
        )}
      </div>
    </div>
  )
}

// ── MCQ TOPIC TOOL (grammar / gk / reasoning / legal) ────────────────────────

function MCQTopicTool({ toolSlug, tool }) {
  const { topics, loading } = useQATopics(toolSlug)
  const [activeTopic, setActiveTopic] = useState(null)
  const [search, setSearch] = useState('')
  const [answers, setAnswers]   = useState({})
  const [revealed, setRevealed] = useState({})
  const [currentQ, setCurrentQ] = useState(0)

  // Learning path progress
  const completedTopics = Object.keys(revealed).length

  const filtered = (topics || []).filter(t =>
    !search || t.title?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <BodySkel />

  const selectedTopic = topics?.find(t => t.id === activeTopic)

  return (
    <div>
      {/* Topic nav */}
      <div style={tn.bar}>
        <div style={{ maxWidth:'1000px', margin:'0 auto', padding:'0 24px' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search topics…" style={tn.search} />
          <div style={tn.grid}>
            <button onClick={() => setActiveTopic(null)}
              style={{ ...tn.pill, ...(activeTopic===null ? tn.pillActive : {}) }}>
              All Topics
            </button>
            {filtered.map(t => (
              <button key={t.id} onClick={() => { setActiveTopic(t.id); setCurrentQ(0) }}
                style={{ ...tn.pill, ...(activeTopic===t.id ? tn.pillActive : {}) }}>
                {t.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={body.wrap}>
        <div style={body.container}>
          {!activeTopic ? (
            // Overview: accordion of topics
            <div>
              {/* Learning path progress bar */}
              <div style={lp.wrap}>
                <div style={lp.header}>
                  <span style={lp.label}>Your Learning Path</span>
                  <span style={{ fontFamily:T.mono, fontSize:'12px', color:T.gray2 }}>
                    {completedTopics} of {topics?.length || 0} topics attempted
                  </span>
                </div>
                <div style={{ height:'4px', background:T.border }}>
                  <div style={{ height:'100%', background:T.black, width:`${(completedTopics/Math.max(topics?.length||1,1))*100}%`, transition:'width 0.4s' }} />
                </div>
              </div>

              {/* Topic blocks */}
              {(topics || []).map(t => (
                <TopicBlock key={t.id} topic={t}
                  onQuiz={() => { setActiveTopic(t.id); setCurrentQ(0) }} />
              ))}
            </div>
          ) : (
            // Quiz mode for selected topic
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
                <button onClick={() => setActiveTopic(null)} style={qcard.backBtn}>← All Topics</button>
                <span style={{ fontFamily:T.head, fontSize:'18px', fontWeight:'800', color:T.black }}>{selectedTopic?.title}</span>
              </div>

              {/* Tabs */}
              <div style={tabs.bar}>
                {[['rules','Rules'],['insight','ALP Insight'],['quiz','Quiz']].map(([val,lbl]) => (
                  <button key={val}
                    onClick={() => setCurrentQ(val === 'quiz' ? 0 : -1)}
                    style={{ ...tabs.btn, ...(
                      (val==='quiz' && currentQ>=0) ||
                      (val==='rules' && currentQ===-1) ||
                      (val==='insight' && currentQ===-2) ? tabs.active : {}
                    ) }}>
                    {lbl}
                  </button>
                ))}
              </div>

              {currentQ === -1 && selectedTopic?.concept_notes && (
                <div style={rules.box} dangerouslySetInnerHTML={{ __html: selectedTopic.concept_notes }} />
              )}
              {currentQ === -2 && selectedTopic?.alp_insight && (
                <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginTop:'1rem' }}>
                  {selectedTopic.alp_insight.split('\n\n').map((para, i) => (
                    <div key={i} style={alp.card}>{para}</div>
                  ))}
                </div>
              )}
              {currentQ >= 0 && (
                <QuizStream
                  toolSlug={toolSlug} topicId={activeTopic}
                  answers={answers} revealed={revealed}
                  onAnswer={(qId, optId) => {
                    if (answers[qId] !== undefined) return
                    setAnswers(a => ({ ...a, [qId]: optId }))
                    setRevealed(r => ({ ...r, [qId]: true }))
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TopicBlock({ topic, onQuiz }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ border:`1.5px solid ${open ? T.black : T.border}`, marginBottom:'6px', transition:'border-color 0.2s' }}>
      <button onClick={() => setOpen(!open)} style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'17px 24px', width:'100%', background: open ? T.black : T.white,
        border:'none', cursor:'pointer', textAlign:'left',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          {topic.question_count > 0 && (
            <span style={{ fontFamily:T.mono, fontSize:'11px', color: open ? T.gray3 : T.gray2, minWidth:'32px' }}>
              {topic.question_count}Q
            </span>
          )}
          <span style={{ fontFamily:T.head, fontSize:'14.5px', fontWeight:'800', color: open ? T.white : T.black, letterSpacing:'-0.2px' }}>
            {topic.title}
          </span>
        </div>
        <span style={{ fontSize:'13px', color: open ? T.white : T.gray2, transform: open ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}>▾</span>
      </button>
      {open && (
        <div style={{ padding:'24px', borderTop:`1.5px solid ${T.border}` }}>
          {topic.concept_notes
            ? <div style={rules.box} dangerouslySetInnerHTML={{ __html: topic.concept_notes }} />
            : <p style={{ fontFamily:T.sans, fontSize:'14px', color:T.gray2 }}>No rules content yet.</p>
          }
          {topic.question_count > 0 && (
            <button onClick={onQuiz} style={{ marginTop:'1.25rem', fontFamily:T.head, fontSize:'12px', fontWeight:'800', letterSpacing:'1.5px', textTransform:'uppercase', color:T.white, background:T.accent, border:'none', padding:'10px 20px', cursor:'pointer' }}>
              Start Quiz →
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function QuizStream({ toolSlug, topicId, answers, revealed, onAnswer }) {
  const { topic, questions, loading } = useQATopicDetail(toolSlug, topicId)
  if (loading) return <BodySkel />
  if (!questions?.length) return <p style={{ fontFamily:T.sans, fontSize:'14px', color:T.gray2, padding:'2rem 0' }}>No questions yet.</p>
  return (
    <div style={{ marginTop:'1rem' }}>
      {questions.map((q, i) => (
        <QuestionCard key={q.id} q={q} idx={i}
          answer={answers[q.id]} revealed={revealed[q.id]}
          onAnswer={(optId) => onAnswer(q.id, optId)} />
      ))}
    </div>
  )
}

// ── QUESTION CARD ─────────────────────────────────────────────────────────────

function QuestionCard({ q, idx, answer, revealed, onAnswer }) {
  const opts = q.options || []
  const correct = opts.find(o => o.is_correct)

  return (
    <div style={{ ...qcard.card, marginBottom:'16px' }}>
      {/* Question number + meta */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px' }}>
        <span style={qcard.num}>Q {String(idx+1).padStart(2,'0')}</span>
        {q.difficulty && (
          <span style={{ fontFamily:T.head, fontSize:'9.5px', fontWeight:'800', letterSpacing:'2px', textTransform:'uppercase',
            color: q.difficulty==='Easy' ? '#166534' : q.difficulty==='Hard' ? T.accent : T.gray2,
            background: q.difficulty==='Easy' ? '#f0fdf4' : q.difficulty==='Hard' ? '#fff0f0' : T.gray5,
            padding:'3px 8px' }}>
            {q.difficulty}
          </span>
        )}
      </div>

      {/* Question text */}
      <p style={qcard.text}>{q.text || q.body}</p>

      {/* Passage excerpt if present */}
      {q.passage_excerpt && (
        <div style={{ background:T.gray5, border:`1px solid ${T.border}`, padding:'12px 14px', marginBottom:'14px', fontFamily:T.sans, fontSize:'13px', color:T.gray1, lineHeight:'1.7', fontStyle:'italic' }}>
          {q.passage_excerpt}
        </div>
      )}

      {/* Options */}
      <div style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
        {opts.map(opt => {
          const chosen    = answer === opt.id
          const isCorrect = opt.is_correct
          const wasWrong  = revealed && chosen && !isCorrect

          let bg = T.white, borderColor = T.border, color = T.black
          if (revealed) {
            if (isCorrect)  { bg='#f0fdf4'; borderColor='#22c55e'; color='#166534' }
            if (wasWrong)   { bg='#fff0f0'; borderColor=T.accent;  color=T.accent  }
          }

          return (
            <button key={opt.id}
              onClick={() => !revealed && onAnswer(opt.id, isCorrect)}
              disabled={!!revealed}
              style={{
                fontFamily:T.sans, fontSize:'14px', textAlign:'left',
                background:bg, border:`1.5px solid ${borderColor}`,
                padding:'12px 16px', cursor: revealed ? 'default' : 'pointer',
                transition:'all 0.15s', display:'flex', alignItems:'center', gap:'13px',
                color, lineHeight:'1.5',
              }}>
              <span style={{ fontFamily:T.head, fontSize:'10px', fontWeight:'800', letterSpacing:'1px', color: revealed && isCorrect ? '#166534' : revealed && wasWrong ? T.accent : T.gray2, minWidth:'18px', flexShrink:0 }}>
                {opt.label || String.fromCharCode(65+opts.indexOf(opt))}.
              </span>
              {opt.text || opt.body}
              {revealed && isCorrect && <span style={{ marginLeft:'auto', color:'#22c55e', fontWeight:'800', fontSize:'16px' }}>✓</span>}
              {revealed && wasWrong  && <span style={{ marginLeft:'auto', color:T.accent, fontWeight:'800', fontSize:'16px' }}>✗</span>}
            </button>
          )
        })}
      </div>

      {/* Explanation */}
      {revealed && q.explanation && (
        <div style={{ marginTop:'12px', padding:'12px 14px', fontFamily:T.sans, fontSize:'13px', lineHeight:'1.7', borderLeft:`3px solid ${answer===correct?.id ? '#22c55e' : T.accent}`, background:T.gray5, color:T.gray1 }}>
          <strong style={{ fontFamily:T.head, fontSize:'10px', fontWeight:'800', letterSpacing:'1.5px', textTransform:'uppercase', color:T.gray2, display:'block', marginBottom:'6px' }}>Explanation</strong>
          {q.explanation}
        </div>
      )}
    </div>
  )
}

// ── SHARED UI ─────────────────────────────────────────────────────────────────

function ToolSkeleton() {
  return (
    <div style={{ minHeight:'100vh', background:T.white }}>
      <div style={{ height:'64px', background:T.gray5, borderBottom:`2px solid ${T.black}` }} />
      <div style={{ height:'120px', background:T.gray5, borderBottom:`1px solid ${T.border}` }} />
      <div style={{ maxWidth:'1000px', margin:'2rem auto', padding:'0 24px' }}>
        {[80,100,60,100,80].map((w,i) => <div key={i} style={{ height:'40px', width:`${w}%`, background:T.gray5, marginBottom:'8px' }} />)}
      </div>
    </div>
  )
}

function BodySkel() {
  return (
    <div style={{ maxWidth:'1000px', margin:'0 auto', padding:'2rem 24px' }}>
      {[0,1,2,3].map(i => <div key={i} style={{ height:'60px', background:T.gray5, marginBottom:'6px' }} />)}
    </div>
  )
}

// ── STYLES ────────────────────────────────────────────────────────────────────

const hdr = {
  bar:    { position:'sticky', top:0, zIndex:200, background:T.white, borderBottom:`2px solid ${T.black}`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px', height:'64px', gap:'1rem' },
  logo:   { fontFamily:"'Nunito',sans-serif", fontSize:'19px', fontWeight:'900', letterSpacing:'-0.5px', color:T.black, textDecoration:'none', flexShrink:0 },
  center: { display:'flex', alignItems:'center', gap:'0.4rem', flex:1, justifyContent:'center' },
  back:   { fontFamily:T.sans, fontSize:'13px', color:T.gray2, textDecoration:'none' },
  sep:    { color:T.gray3, fontSize:'13px' },
  name:   { fontFamily:T.head, fontSize:'13px', fontWeight:'700', color:T.black, maxWidth:'300px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  badge:  { fontFamily:T.head, fontSize:'9px', fontWeight:'800', letterSpacing:'2.5px', textTransform:'uppercase', color:T.gray1, border:`1.5px solid ${T.border}`, padding:'5px 12px', whiteSpace:'nowrap', flexShrink:0 },
  enrol:  { fontFamily:T.head, fontSize:'11px', fontWeight:'800', letterSpacing:'1px', textTransform:'uppercase', color:T.white, background:T.accent, border:'none', padding:'9px 18px', textDecoration:'none', whiteSpace:'nowrap', flexShrink:0 },
}

const hero = {
  wrap:       { background:T.gray5, borderBottom:`1.5px solid ${T.border}`, padding:'32px' },
  inner:      { maxWidth:'1000px', margin:'0 auto' },
  eyebrow:    { fontFamily:T.head, fontSize:'9.5px', fontWeight:'800', letterSpacing:'2px', textTransform:'uppercase', color:T.gray2, marginBottom:'8px' },
  title:      { fontFamily:T.head, fontSize:'28px', fontWeight:'900', color:T.black, lineHeight:'1.15', marginBottom:'8px', letterSpacing:'-0.5px' },
  desc:       { fontFamily:T.sans, fontSize:'14px', color:T.gray1, lineHeight:'1.65', maxWidth:'560px' },
  stat:       { textAlign:'center', background:T.white, border:`1.5px solid ${T.border}`, padding:'12px 18px' },
  statNum:    { display:'block', fontFamily:T.head, fontSize:'22px', fontWeight:'900', color:T.black, lineHeight:'1' },
  statLabel:  { fontFamily:T.head, fontSize:'9px', fontWeight:'800', letterSpacing:'1.5px', textTransform:'uppercase', color:T.gray2 },
  examBadge:  { fontFamily:T.head, fontSize:'9.5px', fontWeight:'800', letterSpacing:'2px', textTransform:'uppercase', color:T.accent, border:`1.5px solid ${T.accent}`, padding:'5px 12px', alignSelf:'center' },
}

const tn = {
  bar:    { background:T.gray5, borderBottom:`1.5px solid ${T.border}`, padding:'14px 32px' },
  search: { width:'100%', maxWidth:'360px', fontFamily:T.sans, fontSize:'13px', border:`1.5px solid ${T.border}`, padding:'10px 14px', marginBottom:'12px', outline:'none', background:T.white, color:T.black, display:'block' },
  grid:   { display:'flex', flexWrap:'wrap', gap:'6px' },
  pill:   { fontFamily:T.head, fontSize:'11px', fontWeight:'700', background:T.white, color:T.black, border:`1.5px solid ${T.border}`, padding:'6px 13px', cursor:'pointer', transition:'all 0.15s', whiteSpace:'nowrap' },
  pillActive: { background:T.accent, borderColor:T.accent, color:T.white },
}

const body = {
  wrap:        { background:T.white, minHeight:'60vh' },
  container:   { maxWidth:'1000px', margin:'0 auto', padding:'28px 24px 80px' },
  containerWide:{ maxWidth:'1000px', margin:'0 auto', padding:'28px 24px 80px' },
}

const passCard = {
  btn:   { width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', background:T.white, border:`1.5px solid ${T.border}`, borderTop:'none', cursor:'pointer', textAlign:'left', transition:'all 0.15s', gap:'1rem' },
  left:  { display:'flex', alignItems:'center', gap:'1rem', flex:1, minWidth:0 },
  cat:   { fontFamily:T.head, fontSize:'9px', fontWeight:'800', letterSpacing:'2px', textTransform:'uppercase', color:T.gray2, flexShrink:0 },
  title: { fontFamily:T.head, fontSize:'14px', fontWeight:'700', color:T.black, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  right: { display:'flex', alignItems:'center', gap:'1rem', flexShrink:0 },
  qCount:{ fontFamily:T.mono, fontSize:'12px', color:T.gray2 },
  arrow: { color:T.gray2, fontFamily:T.sans, fontSize:'14px' },
}

const pass = {
  box:    { background:T.gray5, border:`1.5px solid ${T.border}`, padding:'24px', marginBottom:'24px' },
  label:  { fontFamily:T.head, fontSize:'9.5px', fontWeight:'800', letterSpacing:'2px', textTransform:'uppercase', color:T.gray2, marginBottom:'8px' },
  title:  { fontFamily:T.head, fontSize:'17px', fontWeight:'800', color:T.black, marginBottom:'16px' },
  text:   { fontFamily:T.sans, fontSize:'14.5px', color:T.gray1, lineHeight:'1.85', whiteSpace:'pre-wrap' },
}

const vocab = {
  progress:{ display:'flex', alignItems:'center', marginBottom:'20px' },
  card:    { border:`1.5px solid ${T.black}`, padding:'40px', minHeight:'220px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'background 0.15s', userSelect:'none' },
  word:    { fontFamily:T.head, fontSize:'32px', fontWeight:'900', color:T.black, marginBottom:'12px', letterSpacing:'-0.5px' },
  hint:    { fontFamily:T.sans, fontSize:'13px', color:T.gray2 },
  pos:     { fontFamily:T.head, fontSize:'10px', fontWeight:'800', letterSpacing:'2px', textTransform:'uppercase', color:T.accent, display:'inline-block', marginBottom:'12px' },
  meaning: { fontFamily:T.sans, fontSize:'15px', color:T.gray1, lineHeight:'1.7', marginBottom:'10px' },
  example: { fontFamily:T.sans, fontSize:'13px', color:T.gray2, fontStyle:'italic', borderLeft:`3px solid ${T.border}`, paddingLeft:'12px', marginBottom:'8px' },
  syns:    { fontFamily:T.sans, fontSize:'12px', color:T.gray2 },
  nav:     { display:'flex', gap:'8px', marginTop:'16px' },
  navBtn:  { fontFamily:T.head, fontSize:'11px', fontWeight:'800', letterSpacing:'1.5px', textTransform:'uppercase', border:`1.5px solid ${T.black}`, background:T.white, color:T.black, padding:'10px 20px', cursor:'pointer', flex:1 },
}

const tabs = {
  bar:    { display:'flex', borderBottom:`1.5px solid ${T.border}`, marginBottom:'20px', gap:0 },
  btn:    { fontFamily:T.head, fontSize:'10.5px', fontWeight:'800', letterSpacing:'1.8px', textTransform:'uppercase', color:T.gray2, background:'none', border:'none', borderBottom:'3px solid transparent', padding:'10px 20px', cursor:'pointer', transition:'all 0.15s', marginBottom:'-1.5px' },
  active: { color:T.black, borderBottomColor:T.accent },
}

const rules = {
  box: { fontFamily:T.sans, fontSize:'14px', color:T.gray1, lineHeight:'1.75' },
}

const alp = {
  card: { background:'#fff', border:`1.5px solid ${T.border}`, borderLeft:`4px solid ${T.accent}`, padding:'14px 16px', fontSize:'13.5px', lineHeight:'1.75', color:'#2a1f00', fontFamily:T.sans },
}

const lp = {
  wrap:   { border:`1.5px solid ${T.border}`, padding:'20px 24px', marginBottom:'20px' },
  header: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' },
  label:  { fontFamily:T.head, fontSize:'13px', fontWeight:'800', letterSpacing:'1.5px', textTransform:'uppercase', color:T.black },
}

const qcard = {
  card:    { border:`1.5px solid ${T.black}`, padding:'24px' },
  num:     { fontFamily:T.head, fontSize:'9.5px', fontWeight:'800', letterSpacing:'2px', textTransform:'uppercase', color:T.gray2 },
  text:    { fontFamily:T.head, fontSize:'16px', fontWeight:'800', lineHeight:'1.55', marginBottom:'20px', color:T.black },
  backBtn: { fontFamily:T.head, fontSize:'11px', fontWeight:'800', letterSpacing:'1px', textTransform:'uppercase', background:'none', border:`1.5px solid ${T.border}`, padding:'8px 16px', cursor:'pointer', color:T.gray1, marginBottom:'20px', display:'inline-flex' },
}
