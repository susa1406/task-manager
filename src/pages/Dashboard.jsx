import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { moneyService } from '../services/moneyService'
import { expenseService } from '../services/expenseService'
import { goalService } from '../services/goalService'
import { supabase } from '../lib/supabase'
import {
  getGreeting, getCurrentDateFormatted, formatCurrency, formatDate,
  calcGoalProgress, CATEGORY_COLORS
} from '../utils/helpers'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import {
  Wallet, Receipt, Scale, Target, TrendingUp,
  ShoppingBag, BookOpen, ArrowRight, Sun, Moon, Sunrise
} from 'lucide-react'

const GREETING_ICONS = { 'Good Morning': Sun, 'Good Afternoon': Sun, 'Good Evening': Moon }

function SkeletonCard() {
  return (
    <div className="stat-card">
      <div className="skeleton skeleton-line" style={{ width: 40, height: 40, borderRadius: 8, marginBottom: 12 }} />
      <div className="skeleton skeleton-line short" />
      <div className="skeleton skeleton-line medium" style={{ height: 28, marginTop: 8 }} />
      <div className="skeleton skeleton-line short" style={{ marginTop: 4 }} />
    </div>
  )
}

function CustomTooltip({ active, payload }) {
  if (active && payload?.length) {
    const d = payload[0].payload
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '10px 14px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{d.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatCurrency(d.value)} · {d.pct}%</div>
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalReceived: 0, totalExpenses: 0, monthlyReceived: 0, monthlyExpenses: 0 })
  const [chartData, setChartData] = useState([])
  const [activity, setActivity] = useState([])
  const [activeGoal, setActiveGoal] = useState(null)
  const greeting = getGreeting()
  const GreetIcon = greeting === 'Good Morning' ? Sun : greeting === 'Good Afternoon' ? Sun : Moon

  const fetchDashboard = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [totalRec, totalExp, monthlyRec, monthlyExp, catTotals, goal] = await Promise.all([
        moneyService.getTotalReceived(user.id),
        expenseService.getTotalExpenses(user.id),
        moneyService.getMonthlyTotal(user.id),
        expenseService.getMonthlyTotal(user.id),
        expenseService.getCategoryTotals(user.id),
        goalService.getActive(user.id),
      ])
      setStats({ totalReceived: totalRec, totalExpenses: totalExp, monthlyReceived: monthlyRec, monthlyExpenses: monthlyExp })
      setActiveGoal(goal)

      const total = Object.values(catTotals).reduce((s, v) => s + v, 0)
      const data = Object.entries(catTotals)
        .map(([name, value]) => ({
          name,
          value,
          pct: total > 0 ? Math.round((value / total) * 100) : 0,
          fill: CATEGORY_COLORS[name] || '#78909c',
        }))
        .sort((a, b) => b.value - a.value)
      setChartData(data)

      await fetchActivity()
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  async function fetchActivity() {
    const now = new Date()
    const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const [expenses, money, experiences] = await Promise.all([
      supabase.from('expenses').select('id,amount,category,date,note').eq('user_id', user.id).gte('date', since.split('T')[0]).order('date', { ascending: false }).limit(5),
      supabase.from('money_received').select('id,amount,source,date,note').eq('user_id', user.id).gte('date', since.split('T')[0]).order('date', { ascending: false }).limit(5),
      supabase.from('experiences').select('id,title,category,date').eq('user_id', user.id).gte('date', since.split('T')[0]).order('date', { ascending: false }).limit(5),
    ])

    const items = [
      ...(expenses.data || []).map(e => ({ ...e, type: 'expense', sortDate: e.date })),
      ...(money.data || []).map(m => ({ ...m, type: 'money', sortDate: m.date })),
      ...(experiences.data || []).map(x => ({ ...x, type: 'experience', sortDate: x.date })),
    ]
    items.sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate))
    setActivity(items.slice(0, 8))
  }

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  const balance = stats.totalReceived - stats.totalExpenses
  const goalPct = activeGoal ? calcGoalProgress(activeGoal.current_amount ?? activeGoal.progress_percentage, activeGoal.target_amount) : 0

  return (
    <div>
      {/* Greeting */}
      <div className="greeting-section">
        <div className="greeting-text">
          <GreetIcon size={22} color="var(--accent-gold)" />
          {greeting}, {profile?.name || user?.email?.split('@')[0] || 'User'}
        </div>
        <div className="greeting-date">{getCurrentDateFormatted()}</div>
      </div>

      {/* Stat Cards */}
      <div className="stat-cards-grid">
        {loading ? (
          [1,2,3,4].map(i => <SkeletonCard key={i} />)
        ) : (<>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(34,197,94,0.15)' }}>
              <Wallet size={20} color="#22c55e" />
            </div>
            <div className="stat-card-label">Money Received</div>
            <div className="stat-card-value">{formatCurrency(stats.totalReceived)}</div>
            <div className="stat-card-sub">This month: <span>{formatCurrency(stats.monthlyReceived)}</span></div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(220,20,20,0.15)' }}>
              <Receipt size={20} color="var(--accent-red)" />
            </div>
            <div className="stat-card-label">Money Spent</div>
            <div className="stat-card-value">{formatCurrency(stats.totalExpenses)}</div>
            <div className="stat-card-sub">This month: <span style={{ color: 'var(--accent-red)' }}>{formatCurrency(stats.monthlyExpenses)}</span></div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(212,160,23,0.15)' }}>
              <Scale size={20} color="var(--accent-gold)" />
            </div>
            <div className="stat-card-label">Current Balance</div>
            <div className="stat-card-value" style={{ color: balance >= 0 ? 'var(--accent-gold)' : 'var(--error)' }}>
              {formatCurrency(balance)}
            </div>
            <div className="stat-card-sub" style={{ color: balance >= 0 ? 'var(--success)' : 'var(--error)' }}>
              {balance >= 0 ? 'Remaining' : 'Overspent'}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>
              <Target size={20} color="var(--info)" />
            </div>
            <div className="stat-card-label">Current Goal</div>
            {activeGoal ? (<>
              <div className="stat-card-value" style={{ fontSize: 16 }}>{activeGoal.title}</div>
              {activeGoal.target_amount && (
                <div className="stat-card-sub">
                  {formatCurrency(activeGoal.current_amount || 0)} / {formatCurrency(activeGoal.target_amount)}
                </div>
              )}
              <div className="progress-bar">
                <div className="progress-fill gold" style={{ width: `${activeGoal.target_amount ? calcGoalProgress(activeGoal.current_amount, activeGoal.target_amount) : (activeGoal.progress_percentage || 0)}%` }} />
              </div>
              <div className="progress-percent">{activeGoal.target_amount ? calcGoalProgress(activeGoal.current_amount, activeGoal.target_amount) : (activeGoal.progress_percentage || 0)}%</div>
            </>) : (
              <div className="stat-card-sub" style={{ marginTop: 8 }}>No active goal</div>
            )}
          </div>
        </>)}
      </div>

      {/* Chart + Activity */}
      <div className="dashboard-grid">
        {/* Expense Chart */}
        <div className="dashboard-chart-card">
          <div className="dashboard-chart-header">
            <div className="dashboard-chart-title">Monthly Expense Overview</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
            </div>
          </div>
          {loading ? (
            <div className="loading-spinner"><div className="spinner" /></div>
          ) : chartData.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 20px' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
              <p>No expenses this month</p>
            </div>
          ) : (
            <div className="chart-area">
              <div style={{ width: 180, height: 180, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ textAlign: 'center', marginTop: -10 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(stats.monthlyExpenses)}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>TOTAL SPENT</div>
                </div>
              </div>
              <div className="chart-legend">
                {chartData.map((item, i) => (
                  <div className="chart-legend-item" key={i}>
                    <div className="chart-legend-dot" style={{ background: item.fill }} />
                    <span className="chart-legend-label">{item.name}</span>
                    <span className="chart-legend-pct">{item.pct}%</span>
                    <span className="chart-legend-amt">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="dashboard-chart-card">
          <div className="dashboard-chart-header">
            <div className="dashboard-chart-title">Recent Activity</div>
          </div>
          {loading ? (
            <div className="loading-spinner"><div className="spinner" /></div>
          ) : activity.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 20px' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="activity-list">
              {activity.map((item, i) => {
                let icon, title, sub, color
                if (item.type === 'expense') {
                  icon = <Receipt size={16} />; color = 'rgba(220,20,20,0.2)'
                  title = `${item.category} expense added`
                  sub = `${formatCurrency(item.amount)} · ${formatDate(item.date)}`
                } else if (item.type === 'money') {
                  icon = <Wallet size={16} />; color = 'rgba(34,197,94,0.2)'
                  title = `Money received`
                  sub = `${item.source} · ${formatCurrency(item.amount)} · ${formatDate(item.date)}`
                } else {
                  icon = <BookOpen size={16} />; color = 'rgba(59,130,246,0.2)'
                  title = `Experience added`
                  sub = `${item.title} · ${formatDate(item.date)}`
                }
                return (
                  <div className="activity-item" key={i}>
                    <div className="activity-icon" style={{ background: color }}>{icon}</div>
                    <div className="activity-body">
                      <div className="activity-title">{title}</div>
                      <div className="activity-sub">{sub}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
