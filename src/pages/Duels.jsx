import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import BottomNav from '../components/BottomNav'

const METRICS = ['Training time (hours)', 'Distance (km)', 'Number of sessions', 'Calories burned']
const DURATIONS = ['3 days', '1 week', '2 weeks', '1 month']

export default function Duels({ session }) {
  const [duels, setDuels] = useState([])
  const [showNew, setShowNew] = useState(false)
  const [opponent, setOpponent] = useState('')
  const [metric, setMetric] = useState(METRICS[0])
  const [target, setTarget] = useState('')
  const [duration, setDuration] = useState(DURATIONS[1])
  const [trash, setTrash] = useState('')
  const [type, setType] = useState('1v1')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchDuels() }, [])

  const fetchDuels = async () => {
    const { data } = await supabase
      .from('duels')
      .select('*')
      .or(`challenger_id.eq.${session.user.id},opponent_id.eq.${session.user.id}`)
      .order('created_at', { ascending: false })
    setDuels(data || [])
    setLoading(false)
  }

  const sendDuel = async () => {
    if (!opponent.trim() || !target) return
    const { data: oppProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', opponent)
      .single()

    if (!oppProfile) { alert('User not found. Check the username.'); return }

    await supabase.from('duels').insert({
      challenger_id: session.user.id,
      opponent_id: oppProfile.id,
      type,
      metric,
      challenger_target: parseFloat(target),
      duration,
      trash_talk: trash || null,
      status: 'pending',
    })
    setShowNew(false)
    setOpponent(''); setTarget(''); setTrash('')
    fetchDuels()
  }

  const respondDuel = async (duelId, accept) => {
    await supabase.from('duels').update({
      status: accept ? 'active' : 'declined',
      started_at: accept ? new Date().toISOString() : null,
    }).eq('id', duelId)
    fetchDuels()
  }

  const getStatusPill = (status) => {
    if (status === 'active') return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-500">Live</span>
    if (status === 'pending') return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">Pending</span>
    if (status === 'declined') return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-400">Declined</span>
    return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#EAF3DE] text-[#3B6D11]">Done</span>
  }

  const incoming = duels.filter(d => d.opponent_id === session.user.id && d.status === 'pending')
  const active = duels.filter(d => d.status === 'active')
  const past = duels.filter(d => ['completed', 'declined'].includes(d.status))

  return (
    <div className="min-h-screen bg-[#f5f5f3] pb-24 max-w-md mx-auto">
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
        <span className="logo text-2xl">DUELS</span>
        <button onClick={() => setShowNew(true)} className="text-sm text-[#3B6D11] font-medium bg-transparent border-none cursor-pointer">+ New duel</button>
      </div>

      <div className="px-5 py-5">
        {showNew && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-5">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-4">New challenge</p>
            <div className="flex gap-2 mb-4">
              {['1v1', 'Group'].map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border cursor-pointer ${type === t ? 'bg-[#EAF3DE] text-[#3B6D11] border-[#639922]' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                  {t === '1v1' ? '1 vs 1' : 'Group vs group'}
                </button>
              ))}
            </div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Opponent username</label>
            <input value={opponent} onChange={e => setOpponent(e.target.value)} placeholder="@username"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#3B6D11] mb-3" />
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Your metric</label>
            <select value={metric} onChange={e => setMetric(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#3B6D11] mb-3">
              {METRICS.map(m => <option key={m}>{m}</option>)}
            </select>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Your target</label>
            <input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="e.g. 10"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#3B6D11] mb-3" />
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Duration</label>
            <select value={duration} onChange={e => setDuration(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#3B6D11] mb-3">
              {DURATIONS.map(d => <option key={d}>{d}</option>)}
            </select>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Trash talk (optional)</label>
            <input value={trash} onChange={e => setTrash(e.target.value)} placeholder="Let's see what you've got 💪"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#3B6D11] mb-4" />
            <div className="flex gap-2">
              <button onClick={sendDuel} className="flex-1 bg-[#3B6D11] text-[#C0DD97] py-3 rounded-xl text-sm font-medium border-none cursor-pointer">Send challenge</button>
              <button onClick={() => setShowNew(false)} className="flex-1 bg-gray-100 text-gray-500 py-3 rounded-xl text-sm font-medium border-none cursor-pointer">Cancel</button>
            </div>
          </div>
        )}

        {incoming.length > 0 && (
          <>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Incoming challenge</p>
            {incoming.map(d => (
              <div key={d.id} className="bg-white rounded-2xl p-4 border-2 border-red-200 mb-3">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium text-[#1a1a1a] text-sm">Someone challenged you</p>
                    <p className="text-xs text-gray-400 mt-0.5">{d.metric} · {d.duration} · {d.type}</p>
                    {d.trash_talk && <p className="text-xs text-gray-500 italic mt-1">"{d.trash_talk}"</p>}
                  </div>
                  {getStatusPill(d.status)}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => respondDuel(d.id, true)} className="flex-1 bg-[#3B6D11] text-[#C0DD97] py-2.5 rounded-xl text-sm font-medium border-none cursor-pointer">Accept</button>
                  <button onClick={() => respondDuel(d.id, false)} className="flex-1 bg-red-50 text-red-500 py-2.5 rounded-xl text-sm font-medium border-none cursor-pointer">Decline</button>
                </div>
              </div>
            ))}
          </>
        )}

        {active.length > 0 && (
          <>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Active duels</p>
            {active.map(d => (
              <div key={d.id} className="bg-white rounded-2xl p-4 border border-gray-100 mb-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-[#1a1a1a] text-sm">{d.type} · {d.metric}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{d.duration}</p>
                  </div>
                  {getStatusPill(d.status)}
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>You</span><span>Target: {d.challenger_target}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full"><div className="h-1.5 bg-[#639922] rounded-full" style={{ width: '40%' }}></div></div>
                </div>
              </div>
            ))}
          </>
        )}

        {!showNew && incoming.length === 0 && active.length === 0 && past.length === 0 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
            <p className="text-gray-400 text-sm mb-3">No duels yet.</p>
            <button onClick={() => setShowNew(true)} className="text-[#3B6D11] text-sm font-medium bg-transparent border-none cursor-pointer">Challenge someone →</button>
          </div>
        )}

        {past.length > 0 && (
          <>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 mt-2">Past duels</p>
            {past.map(d => (
              <div key={d.id} className="bg-white rounded-2xl p-4 border border-gray-100 mb-3 opacity-60">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-[#1a1a1a] text-sm">{d.type} · {d.metric}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{d.duration}</p>
                  </div>
                  {getStatusPill(d.status)}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  )
}