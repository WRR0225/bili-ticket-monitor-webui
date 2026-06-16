import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

// 状态颜色配置
const STATUS_CONFIG = {
  '未开售': { color: '#94a3b8', bgColor: 'rgba(148,163,184,0.15)', dotColor: '#64748b' },
  '预售中': { color: '#22c55e', bgColor: 'rgba(34,197,94,0.15)', dotColor: '#22c55e' },
  '暂时售罄': { color: '#f97316', bgColor: 'rgba(249,115,22,0.15)', dotColor: '#f97316' },
  '已售罄': { color: '#ef4444', bgColor: 'rgba(239,68,68,0.15)', dotColor: '#ef4444' },
  '已停售': { color: '#ef4444', bgColor: 'rgba(239,68,68,0.15)', dotColor: '#ef4444' },
  '不可售': { color: '#ef4444', bgColor: 'rgba(239,68,68,0.15)', dotColor: '#ef4444' },
}

// 进度条块颜色
const BLOCK_COLORS = {
  '已售罄': '#ef4444',
  '已停售': '#ef4444',
  '不可售': '#ef4444',
  '未开售': '#64748b',
  '暂时售罄': '#f97316',
  '预售中': '#22c55e',
}

function App() {
  const [ticketId, setTicketId] = useState(() => localStorage.getItem('ticketId') || '')
  const [inputId, setInputId] = useState(() => localStorage.getItem('ticketId') || '')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [interval, setIntervalValue] = useState(2)
  const [expanded, setExpanded] = useState(true)
  const [statusChanges, setStatusChanges] = useState({})
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const prevDataRef = useRef(null)
  const timerRef = useRef(null)

  // 切换主题
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
  }

  // 获取数据
  const fetchData = useCallback(async () => {
    if (!ticketId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/ticket/${ticketId}`)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `请求失败 (${res.status})`)
      }
      const result = await res.json()
      
      // 检测状态变化
      if (prevDataRef.current) {
        const prevMap = new Map(prevDataRef.current.allTickets?.map(t => [t.id, t.status]))
        const changes = {}
        result.allTickets?.forEach(t => {
          const prev = prevMap.get(t.id)
          if (prev && prev !== t.status) {
            changes[t.id] = { from: prev, to: t.status, time: new Date() }
          }
        })
        if (Object.keys(changes).length > 0) {
          setStatusChanges(prev => ({ ...prev, ...changes }))
        }
      }
      
      prevDataRef.current = result
      setData(result)
      setLastUpdate(new Date())
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  // 自动轮询
  useEffect(() => {
    if (!ticketId) return
    fetchData()
    timerRef.current = window.setInterval(fetchData, interval * 1000)
    return () => window.clearInterval(timerRef.current)
  }, [ticketId, interval, fetchData])

  // 保存票务ID
  const handleSetId = () => {
    const id = inputId.trim()
    if (id) {
      setTicketId(id)
      localStorage.setItem('ticketId', id)
    }
  }

  // 删除监控
  const handleDelete = () => {
    const name = data?.name || ticketId
    if (window.confirm(`确定删除对「${name}」的监控吗？`)) {
      setTicketId('')
      setInputId('')
      setData(null)
      setError(null)
      setLastUpdate(null)
      setStatusChanges({})
      localStorage.removeItem('ticketId')
    }
  }


  // 格式化日期
  const formatDate = (date) => {
    if (!date) return ''
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d} ${days[date.getDay()]}`
  }

  // 格式化时间（时分）
  const formatTimeHM = (date) => {
    return String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0')
  }

  // 格式化时间
  const formatTime = (date) => {
    if (!date) return ''
    return date.toLocaleTimeString('zh-CN', { hour12: false })
  }

  const now = new Date()
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000)
  const startTimeStr = formatTimeHM(tenMinAgo)
  const TOTAL_BLOCKS = 60

  return (
    <div className={`app ${theme === 'light' ? 'light' : ''}`}>
      {/* 配置面板 */}
      <div className="config-panel">
        <div className="config-inner">
          <div className="config-title">
            <span className="config-icon">🎫</span>
            B站会员购余票监控
            <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? '切换浅色模式' : '切换深色模式'}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
          <div className="config-form">
            <div className="input-group">
              <label>票务ID</label>
              <input
                type="text"
                value={inputId}
                onChange={e => setInputId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSetId()}
                placeholder="输入B站会员购票务ID"
              />

            </div>
            <div className="input-group interval-group">
              <label>刷新间隔(秒)</label>
              <div className="interval-control">
                <button className="interval-btn" onClick={() => setIntervalValue(v => Math.max(1, v - 1))}>−</button>
                <span className="interval-value">{interval}</span>
                <button className="interval-btn" onClick={() => setIntervalValue(v => Math.min(60, v + 1))}>+</button>
              </div>
            </div>
            <button className="btn-primary" onClick={handleSetId}>
              开始监控
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      {ticketId && (
        <div className="monitor-container">
          {/* 加载状态 */}
          {loading && !data && (
            <div className="loading">
              <div className="spinner"></div>
              <span>正在获取票务数据...</span>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="error-banner">
              <span>⚠️ {error}</span>
            </div>
          )}

          {/* 数据展示 */}
          {data && (
            <div className="monitor-content">
              {/* 顶部信息栏 */}
              <div className="header">
                <h1 className="event-name">{data.name}</h1>
                <button className="delete-btn" onClick={handleDelete} title="删除监控">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              {/* 状态统计 */}
              <div className="stats-bar" onClick={() => setExpanded(!expanded)}>
                <div className="stats-badges">
                  {data.stats.soldOut > 0 && (
                    <span className="stat-badge stat-sold-out">已售罄：{data.stats.soldOut}</span>
                  )}
                  {data.stats.tempSoldOut > 0 && (
                    <span className="stat-badge stat-temp-sold">暂时售罄：{data.stats.tempSoldOut}</span>
                  )}
                  {data.stats.onSale > 0 && (
                    <span className="stat-badge stat-on-sale">预售中：{data.stats.onSale}</span>
                  )}
                  {data.stats.notStarted > 0 && (
                    <span className="stat-badge stat-not-started">未开售：{data.stats.notStarted}</span>
                  )}
                  {data.stats.stopped > 0 && (
                    <span className="stat-badge stat-stopped">已停售：{data.stats.stopped}</span>
                  )}
                </div>
                <button className="expand-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
              </div>

              {/* 更新时间 */}
              <div className="update-time">
                上次更新：{lastUpdate ? formatTime(lastUpdate) : '--'}
                <span className="monitor-id">ID: {ticketId} | 间隔: {interval}s</span>
              </div>

              {/* 票种列表 */}
              {expanded && data.screens.map((screen, si) => (
                <div key={si} className="screen-group">
                  <div className="screen-title">{screen.screenName}</div>
                  {screen.tickets.map((ticket) => {
                    const config = STATUS_CONFIG[ticket.status] || STATUS_CONFIG['未知']
                    const blockColor = BLOCK_COLORS[ticket.status] || '#64748b'
                    const changed = statusChanges[ticket.id]
                    
                    return (
                      <div key={ticket.id} className={`ticket-card ${changed ? 'changed' : ''}`}>
                        <div className="ticket-row">
                          <div className="ticket-dot" style={{ backgroundColor: config.dotColor, boxShadow: `0 0 10px ${config.dotColor}` }}></div>
                          <div className="ticket-name">{ticket.name}</div>
                          <div className="ticket-status" style={{ backgroundColor: config.bgColor, color: config.color }}>
                            {ticket.status}
                          </div>
                        </div>
                        <div className="progress-bar">
                          {Array.from({ length: TOTAL_BLOCKS }, (_, i) => {
                            const filled = ticket.status === '暂时售罄' ? (i < 54) : (i < TOTAL_BLOCKS)
                            const hasGreen = ticket.status === '暂时售罄' && i < 6
                            return (
                              <div
                                key={i}
                                className="progress-block"
                                style={{
                                  backgroundColor: hasGreen ? '#22c55e' : filled ? blockColor : 'rgba(100,116,139,0.2)',
                                }}
                              />
                            )
                          })}
                        </div>
                        <div className="ticket-time">
                          <span>{startTimeStr}</span>
                          <span>现在</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}

              {/* 无数据 */}
              {data.allTickets?.length === 0 && (
                <div className="empty">暂无票务数据</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 底部欢迎 */}
      {!ticketId && (
        <div className="welcome">
          <div className="welcome-icon">🎫</div>
          <h2>B站会员购余票监控</h2>
          <p>请输入票务ID开始监控，实时追踪票务状态变化</p>
        </div>
      )}
    </div>
  )
}

export default App
