import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import BottomNav from '../components/BottomNav'

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function Group({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [checkins, setCheckins] = useState([])
  const [todayDone, setTodayDone] = useState(false)
  const [loading, setLoading] = useState(true)
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [goal, setGoal] = useState('')
  const [showGoal, setShowGoal] = useState(false)
  const [groupGoals, setGroupGoals] = useState([]) // shared goals from all members

  const today = new Date().toISOString().split('T')[0]
  const dayOfWeek = new Date().getDay()
  const weekDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1

  const getWeekStart = () => {
    const now = new Date()
    const day = now.getDay()
    const diff = day === 0 ? -6 : 1 - day
    const monday = new Date(now)
    monday.setDate(now.getDate() + diff)
    return monday.toISOString().split('T')[0]
  }

  const weekStart = getWeekStart()

  useEffect(() => {
    fetchGroup()
    setInviteLink(`${window.location.origin}/join/${id}`)
  }, [id])

  const fetchGroup = async () => {
    const { data: groupData } = await supabase
      .from('groups').select('*').eq('id', id).single()
    setGroup(groupData)

    const { data: membersData } = await supabase
      .from('group_members')
      .select('user_id, profiles(username, email)')
      .eq('group_id', id)
    setMembers(membersData || [])

    const { data: checkinsData } = await supabase
      .from('checkins')
      .select('*')
      .eq('group_id', id)
      .order('created_at', { ascending: false })
    setCheckins(checkinsData || [])

    const myTodayCheckin = checkinsData?.find(
      c => c.user_id === session.user.id && c.date === today
    )
    setTodayDone(!!myTodayCheckin)

    // Fetch shared goals for this group this week
    const { data: goalsData } = await supabase
      .from('goals')
      .select('*, profiles(username, email)')
      .eq('group_id', id)
      .eq('week_start', weekStart)
      .eq('is_shared', true)
    setGroupGoals(goalsData || [])

    setLoading(false)
  }

  const logWorkout = async () => {
    if (todayDone) return
    await supabase.from('checkins').insert({
      user_id: session.user.id,
      group_id: id,
      date: today,
      note: goal || null,
    })
    setTodayDone(true)
    setShowGoal(false)
    fetchGroup()
  }

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getUserCheckins = (userId) => {
    const weekStartDate = new Date()
    weekStartDate.setDate(weekStartDate.getDate() - weekDay)
    return checkins.filter(c => {
      const d = new Date(c.date)
      return c.user_id === userId && d >= weekStartDate
    })
  }

  const getMemberName = (userId) => {
    if (userId === session.user.id) return 'You'
    const member = members.find(m => m.user_id === userId)
    return member?.profiles?.username || member?.profiles?.email?.split('@')[0] || 'Someone'
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  // For each shared goal, count how many checkins this week
  const getGoalProgress = (userId) => {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const weekEndStr = weekEnd.toISOString().split('T')[0]
    return checkins.filter(c =>
      c.user_id === userId &&
      c.date >= weekStart &&
      c.date <= weekEndStr
    ).length
  }

  const getGoalName = (goal) => {
    if (goal.user_id === session.user.id) return 'You'
    return goal.profiles?.username || goal.profiles?.email?.split('@')[0] || 'Someone'
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-400">Loading...</p></div>

  return (
    <div className="min-h-screen bg-[#f5f5f3] pb-24 max-w-md mx-auto">
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-sm text-[#3B6D11] bg-transparent border-none cursor-pointer">← Back</button>
        <span className="font-medium text-[#1a1a1a] flex-1">{group?.name}</span>
      </div>

      <div className="px-5 py-5">
        {/* Today's check-in */}
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Today's check-in</p>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4 text-center">
          {todayDone ? (
            <div>
              <div className="w-16 h-16 rounded-full bg-[#EAF3DE] border-2 border-[#639922] flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl text-[#3B6D11]">✓</span>
              </div>
              <p className="text-sm text-[#3B6D11] font-medium">Logged! Crew notified.</p>
            </div>
          ) : showGoal ? (
            <div>
              <input
                type="text"
                value={goal}
                onChange={e => setGoal(e.target.value)}
                placeholder="e.g. Deadlifts · 45min (optional)"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#3B6D11] mb-3"
              />
              <button onClick={logWorkout} className="w-full bg-[#3B6D11] text-[#C0DD97] py-3 rounded-xl font-medium text-sm border-none cursor-pointer">
                Confirm check-in
              </button>
            </div>
          ) : (
            <div>
              <button
                onClick={() => setShowGoal(true)}
                className="w-16 h-16 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center mx-auto mb-3 cursor-pointer"
              >
                <span className="text-2xl text-gray-400">+</span>
              </button>
              <p className="text-sm text-gray-400">Tap to log today's workout</p>
            </div>
          )}
        </div>

        {/* This week */}
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">This week</p>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-4">
          <div className="flex justify-center gap-2">
            {DAYS.map((d, i) => {
              const myCheckins = getUserCheckins(session.user.id)
              const weekStartDate = new Date()
              weekStartDate.setDate(weekStartDate.getDate() - weekDay)
              const dayDate = new Date(weekStartDate)
              dayDate.setDate(dayDate.getDate() + i)
              const dateStr = dayDate.toISOString().split('T')[0]
              const done = myCheckins.some(c => c.date === dateStr)
              const isToday = i === weekDay
              return (
                <div key={i} className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium
                  ${done ? 'bg-[#639922] text-white' : isToday ? 'bg-[#3B6D11] text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {d}
                </div>
              )
            })}
          </div>
        </div>

        {/* Weekly goals — shared */}
        {groupGoals.length > 0 && (
          <>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">This week's goals</p>
            <div className="mb-4">
              {groupGoals.map(g => {
                const done = getGoalProgress(g.user_id)
                const pct = Math.min(100, Math.round((done / g.target) * 100))
                const completed = done >= g.target
                const name = getGoalName(g)
                const initials = name.slice(0, 2).toUpperCase()
                const isMe = g.user_id === session.user.id
                return (
                  <div key={g.id} className="bg-white rounded-2xl p-4 border border-gray-100 mb-2">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${isMe ? 'bg-[#EAF3DE] text-[#3B6D11]' : 'bg-blue-50 text-blue-600'}`}>
                        {initials}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#1a1a1a]">{name}</p>
                        <p className="text-xs text-gray-400">Goal: {g.target} sessions this week</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${completed ? 'bg-[#EAF3DE] text-[#3B6D11]' : 'bg-gray-100 text-gray-500'}`}>
                        {completed ? '🎉' : `${done}/${g.target}`}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-[#639922] h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Crew */}
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Crew</p>
        <div className="bg-white rounded-2xl border border-gray-100 mb-4 overflow-hidden">
          {members.map((m, i) => {
            const userCheckins = getUserCheckins(m.user_id)
            const isMe = m.user_id === session.user.id
            const hasDoneToday = userCheckins.some(c => c.date === today)
            const initials = (m.profiles?.username || m.profiles?.email || 'U').slice(0, 2).toUpperCase()
            return (
              <div key={m.user_id} className={`flex items-center gap-3 px-4 py-3 ${i < members.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${isMe ? 'bg-[#EAF3DE] text-[#3B6D11]' : 'bg-blue-50 text-blue-600'}`}>
                  {initials}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#1a1a1a]">{isMe ? 'You' : (m.profiles?.username || m.profiles?.email)}</p>
                  <p className="text-xs text-gray-400">{userCheckins.length} sessions this week</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${hasDoneToday ? 'bg-[#EAF3DE] text-[#3B6D11]' : 'bg-amber-50 text-amber-600'}`}>
                  {hasDoneToday ? 'Done' : 'Pending'}
                </span>
              </div>
            )
          })}
        </div>

        {/* Feed */}
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Workout feed</p>
        <div className="mb-4">
          {checkins.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
              <p className="text-gray-400 text-sm">No workouts logged yet. Be the first! 💪</p>
            </div>
          ) : (
            checkins.map((c) => {
              const isMe = c.user_id === session.user.id
              const name = getMemberName(c.user_id)
              const initials = name.slice(0, 2).toUpperCase()
              return (
                <div key={c.id} className="bg-white rounded-2xl p-4 border border-gray-100 mb-2 flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${isMe ? 'bg-[#EAF3DE] text-[#3B6D11]' : 'bg-blue-50 text-blue-600'}`}>
                    {initials}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium text-[#1a1a1a]">{name}</p>
                      <p className="text-xs text-gray-400">{formatDate(c.date)}</p>
                    </div>
                    {c.note ? (
                      <p className="text-xs text-gray-500 mt-0.5">{c.note}</p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-0.5 italic">Workout logged ✓</p>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Invite */}
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Invite your crew</p>
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-400 mb-2 break-all">{inviteLink}</p>
          <button onClick={copyInvite} className="w-full bg-[#3B6D11] text-[#C0DD97] py-2.5 rounded-xl text-sm font-medium border-none cursor-pointer">
            {copied ? 'Copied!' : 'Copy invite link'}
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
