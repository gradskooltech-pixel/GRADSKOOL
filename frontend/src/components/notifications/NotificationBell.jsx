/**
 * GRADSKOOL — NotificationBell
 *
 * Dropdown notification bell for the student navbar.
 * Polls unread count every 60 seconds.
 * Clicking a notification marks it read + follows action_url.
 */
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import api from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'

const CATEGORY_ICONS = {
  enrollment:  '🎓',
  payment:     '💳',
  session:     '📡',
  mock:        '📝',
  content:     '🎬',
  system:      '📢',
  achievement: '🏆',
}

export function NotificationBell() {
  const { isLoggedIn } = useAuth()
  const [unread, setUnread]     = useState(0)
  const [open, setOpen]         = useState(false)
  const [notifs, setNotifs]     = useState([])
  const [loading, setLoading]   = useState(false)
  const dropdownRef = useRef(null)

  // Poll unread count every 60s
  useEffect(() => {
    if (!isLoggedIn) return
    const fetchCount = () => {
      api.get('/notifications/unread-count/')
        .then(({ data }) => setUnread(data.unread_count || 0))
        .catch(() => {})
    }
    fetchCount()
    const interval = setInterval(fetchCount, 60000)
    return () => clearInterval(interval)
  }, [isLoggedIn])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = async () => {
    if (open) { setOpen(false); return }
    setOpen(true)
    setLoading(true)
    try {
      const { data } = await api.get('/notifications/')
      setNotifs(data.notifications || [])
      setUnread(data.unread_count || 0)
    } catch {}
    setLoading(false)
  }

  const markRead = async (notif) => {
    if (!notif.is_read) {
      await api.post('/notifications/mark-read/', { ids: [notif.id] })
      setNotifs(prev => prev.map(n =>
        n.id === notif.id ? { ...n, is_read: true } : n
      ))
      setUnread(prev => Math.max(0, prev - 1))
    }
  }

  const markAllRead = async () => {
    await api.post('/notifications/mark-all-read/')
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnread(0)
  }

  if (!isLoggedIn) return null

  return (
    <div ref={dropdownRef} style={s.wrap}>
      {/* Bell button */}
      <button onClick={handleOpen} style={s.bell} aria-label="Notifications">
        🔔
        {unread > 0 && (
          <span style={s.badge}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={s.dropdown}>
          <div style={s.dropHeader}>
            <span style={s.dropTitle}>Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} style={s.markAllBtn}>
                Mark all read
              </button>
            )}
          </div>

          <div style={s.dropBody}>
            {loading ? (
              <div style={s.loadingMsg}>Loading…</div>
            ) : notifs.length === 0 ? (
              <div style={s.emptyMsg}>
                <p style={s.emptyIcon}>🔔</p>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifs.map(notif => (
                <NotifItem
                  key={notif.id}
                  notif={notif}
                  onRead={() => markRead(notif)}
                  onClose={() => setOpen(false)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NotifItem({ notif, onRead, onClose }) {
  const icon = notif.icon || CATEGORY_ICONS[notif.category] || '📢'
  const timeAgo = getTimeAgo(notif.created_at)

  const handleClick = () => {
    onRead()
    onClose()
  }

  const inner = (
    <div
      style={{ ...s.notifItem, ...(notif.is_read ? {} : s.notifUnread) }}
      onClick={!notif.action_url ? handleClick : undefined}
    >
      <div style={s.notifIcon}>{icon}</div>
      <div style={s.notifBody}>
        <p style={s.notifTitle}>{notif.title}</p>
        <p style={s.notifDesc}>{notif.body}</p>
        <p style={s.notifTime}>{timeAgo}</p>
      </div>
      {!notif.is_read && <span style={s.unreadDot} />}
    </div>
  )

  if (notif.action_url) {
    return <Link href={notif.action_url} style={{ textDecoration: 'none' }} onClick={handleClick}>{inner}</Link>
  }
  return inner
}

function getTimeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

const s = {
  wrap: { position: 'relative' },
  bell: {
    position: 'relative',
    background: 'none', border: 'none',
    cursor: 'pointer', fontSize: '1.1rem',
    padding: '0.25rem',
    lineHeight: '1',
  },
  badge: {
    position: 'absolute', top: '-4px', right: '-4px',
    background: 'var(--red)', color: 'white',
    fontFamily: 'var(--font-sans)', fontSize: '0.6rem', fontWeight: '700',
    width: '16px', height: '16px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    lineHeight: '1',
  },
  dropdown: {
    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
    width: '360px',
    background: 'var(--white)',
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-lg)',
    zIndex: 200,
    overflow: 'hidden',
  },
  dropHeader: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.875rem 1rem',
    borderBottom: '1px solid var(--gray-100)',
  },
  dropTitle: {
    fontFamily: 'var(--font-sans)', fontSize: '0.85rem',
    fontWeight: '700', color: 'var(--black)',
  },
  markAllBtn: {
    fontFamily: 'var(--font-sans)', fontSize: '0.72rem',
    color: 'var(--red)', background: 'none', border: 'none',
    cursor: 'pointer', borderBottom: '1px solid var(--red-border)',
  },
  dropBody: { maxHeight: '420px', overflowY: 'auto' },
  loadingMsg: {
    padding: '2rem', textAlign: 'center',
    fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: 'var(--gray-400)',
  },
  emptyMsg: {
    padding: '2.5rem 1rem', textAlign: 'center',
    fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: 'var(--gray-400)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
  },
  emptyIcon: { fontSize: '1.75rem' },
  notifItem: {
    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
    padding: '0.875rem 1rem',
    borderBottom: '1px solid var(--gray-50)',
    cursor: 'pointer',
    transition: 'background 0.15s',
    position: 'relative',
  },
  notifUnread: { background: '#fafaf9' },
  notifIcon: {
    width: '32px', height: '32px', flexShrink: 0,
    background: 'var(--gray-100)', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.9rem',
  },
  notifBody: { flex: 1, minWidth: 0 },
  notifTitle: {
    fontFamily: 'var(--font-sans)', fontSize: '0.83rem',
    fontWeight: '600', color: 'var(--black)',
    lineHeight: '1.3', marginBottom: '0.2rem',
  },
  notifDesc: {
    fontFamily: 'var(--font-sans)', fontSize: '0.75rem',
    color: 'var(--gray-500)', lineHeight: '1.4',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    marginBottom: '0.25rem',
  },
  notifTime: {
    fontFamily: 'var(--font-sans)', fontSize: '0.68rem', color: 'var(--gray-400)',
  },
  unreadDot: {
    width: '7px', height: '7px', borderRadius: '50%',
    background: 'var(--red)', flexShrink: 0, marginTop: '4px',
  },
}
