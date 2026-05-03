import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import BottomNav from '../components/BottomNav'

export default function Profile({ session }) {
  const [username, setUsername] = useState('')
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [totalCheckins, setTotalCheckins] = useState(0)
  const [goals, setGoals] = useState([])
  const [userGroups, setUserGroups] = useState([])
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [goalTarget, setGoalTarget] = useState('')
  const [goalGroupId, setGoalGroupId] = useState('')
  const [goalShared, setGoalShared] = useState(true)
  const [savingGoal, setSavingGoal] = useState(false)
  const [checkinCounts, setCheckinCounts] = useState({})

  const today = new Date().toISOString().split('T')[0]
  const [goalStartDate, setGoalStartDate] = useState(today)
  const [goalEndDate, setGoalEndDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 6)
    return d.toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchProfile()
    fetchGoals()
  }, [])

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    if (data) setUsername(data.username || '')
    const { count } = await supabase
      .from('checkins')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
    setTotalCheckins(count || 0)
  }

  const fetchGoals = async () => {
    const { data: groupMembers } = await supabase
      .from('group_members')
      .select('group_id, groups(id, name)')
      .eq('user_id', session.user.id)
    setUserGroups(groupMembers || [])

    const { data: goalsData } = await supabase
      .from('goals')
      .select('*, groups(name)')
      .eq('user_id', session.user.id)
      .gte('end_date', today)
      .order('week_start', { ascending: true })
    setGoals(goalsData || [])
  }

  const fetchCheckinsForGoal = async (groupId, startDate, endDate) => {
    const { data } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('group_id', groupId)
      .gte('date', startDate)
      .lte('date', endDate)
    return data?.length || 0
  }

  useEffect(() => {
    if (goals.length === 0) return
    const fetchCounts = async () => {
      const counts = {}
      for (const goal of goals) {
        counts[goal.id] = await fetchCheckinsForGoal(
          goal.group_id,
          goal.week_start,
          goal.end_date || goal.week_start
        )
      }
      setCheckinCounts(counts)
    }
    fetchCounts()
  }, [goals])

  const deleteGoal = async (goalId) => {
    await supabase.from('goals').delete().eq('id', goalId)
    fetchGoals()
  }

  const saveGoal = async () => {
    if (!goalTarget || !goalStartDate || !goalEndDate) return
    setSavingGoal(true)
    await supabase.from('goals').insert({
      user_id: session.user.id,
      group_id: goalGroupId || null,
      target: parseInt(goalTarget),
      week_start: goalStartDate,
      end_date: goalEndDate,
      is_shared: goalShared,
    })
    setShowGoalForm(false)
    setGoalTarget('')
    setGoalGroupId('')
    setGoalShared(true)
    setGoalStartDate(today)
    const d = new Date()
    d.setDate(d.getDate() + 6)
    setGoalEndDate(d.toISOString().split('T')[0])
    setSavingGoal(false)
    fetchGoals()
  }

  const saveUsername = async () => {
    await supabase.from('profiles').upsert({
      id: session.user.id,
      username,
      email: session.user.email,
    })
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const formatDateRange = (start, end) => {
    const s = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const e = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${s} → ${e}`
  }

  const initials = (username || session.user.email || 'U').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-[#f5f5f3] pb-24 max-w-md mx-auto">
      <div className="bg-white border-b border-gray-100 px-5 py-4">
        <span className="logo text-2xl">SPOTTER</span>
      </div>
      <div className="px-5 py-5">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#EAF3DE] flex items-center justify-center text-[#3B6D11] font-medium text-lg">
            {initials}
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="flex gap-2">
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Your username"
                  className="flex-1 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#3B6D11]"
                />
                <button onClick={saveUsername} className="bg-[#3B6D11] text-[#C0DD97] px-3 py-2 rounded-xl text-sm border-none cursor-pointer">Save</button>
              </div>
            ) : (
              <div>
                <p className="font-medium text-[#1a1a1a]">{username || 'Set username'}</p>
                <p className="text-xs text-gray-400 mt-0.5">{session.user.email}</p>
              </div>
            )}
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-xs text-[#3B6D11] bg-transparent border-none cursor-pointer">Edit</button>
          )}
        </div>

        {saved && <p className="text-xs text-[#3B6D11] text-center mb-3">Username saved!</p>}

        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Stats</p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
            <p className="text-2xl font-medium text-[#1a1a1a]">{totalCheckins}</p>
            <p className="text-xs text-gray-400 mt-1">Workouts logged</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
            <p className="text-2xl font-medium text-[#3B6D11]">—</p>
            <p className="text-xs text-gray-400 mt-1">Duels won</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider">My goals</p>
          <button
            onClick={() => setShowGoalForm(!showGoalForm)}
            className="text-xs text-[#3B6D11] bg-transparent border-none cursor-pointer font-medium"
          >
            {showGoalForm ? 'Cancel' : '+ Set goal'}
          </button>
        </div>

        {showGoalForm && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-3">
            <p className="text-sm font-medium text-[#1a1a1a] mb-3">New goal</p>

            <p className="text-xs text-gray-400 mb-1">Group (optional)</p>
            <select
              value={goalGroupId}
              onChange={e => setGoalGroupId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#3B6D11] mb-3"
            >
              <option value="">No group (personal goal)</option>
              {userGroups.map(gm => (
                <option key={gm.group_id} value={gm.group_id}>{gm.groups?.name}</option>
              ))}
            </select>

            <p className="text-xs text-gray-400 mb-1">Target (number of sessions)</p>
            <input
              type="number"
              min="1"
              max="99"
              value={goalTarget}
              onChange={e => setGoalTarget(e.target.value)}
              placeholder="e.g. 12"
              className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#3B6D11] mb-3"
            />

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Start date</p>
                <input
                  type="date"
                  value={goalStartDate}
                  onChange={e => setGoalStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#3B6D11]"
                />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">End date</p>
                <input
                  type="date"
                  value={goalEndDate}
                  min={goalStartDate}
                  onChange={e => setGoalEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#3B6D11]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="share-goal"
                checked={goalShared}
                onChange={e => setGoalShared(e.target.checked)}
                className="w-4 h-4 accent-[#3B6D11]"
              />
              <label htmlFor="share-goal" className="text-sm text-gray-600">Share with group</label>
            </div>

            <button
              onClick={saveGoal}
              disabled={!goalTarget || !goalStartDate || !goalEndDate || savingGoal}
              className="w-full bg-[#3B6D11] text-[#C0DD97] py-3 rounded-xl font-medium text-sm border-none cursor-pointer disabled:opacity-40"
            >
              {savingGoal ? 'Saving...' : 'Save goal'}
            </button>
          </div>
        )}

        {goals.length === 0 && !showGoalForm ? (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 text-center mb-4">
            <p className="text-sm text-gray-400">No active goals.</p>
            <p className="text-xs text-gray-300 mt-1">Tap "+ Set goal" to get started 💪</p>
          </div>
        ) : (
          goals.map(goal => {
            const done = checkinCounts[goal.id] || 0
            const pct = Math.min(100, Math.round((done / goal.target) * 100))
            const completed = done >= goal.target
            return (
              <div key={goal.id} className="bg-white rounded-2xl p-4 border border-gray-100 mb-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-[#1a1a1a]">{goal.groups?.name || 'Personal goal'}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${completed ? 'bg-[#EAF3DE] text-[#3B6D11]' : 'bg-gray-100 text-gray-500'}`}>
                      {completed ? '🎉 Done!' : `${done}/${goal.target}`}
                    </span>
                    <button onClick={() => deleteGoal(goal.id)} className="text-gray-300 bg-transparent border-none cursor-pointer text-base">🗑️</button>
                  </div>
                </div>
                <p className="text-xs text-gray-300 mb-2">{formatDateRange(goal.week_start, goal.end_date || goal.week_start)}</p>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div
                    className="bg-[#639922] h-2 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-400">{done} of {goal.target} sessions</p>
                  {goal.is_shared && (
                    <p className="text-xs text-gray-300">👥 Shared with group</p>
                  )}
                </div>
              </div>
            )
          })
        )}

        <button onClick={signOut} className="w-full bg-white text-gray-400 py-3 rounded-2xl text-sm border border-gray-100 cursor-pointer">
          Sign out
        </button>
      </div>
      <BottomNav />
    </div>
  )
}
