import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import BottomNav from '../components/BottomNav'

export default function Profile({ session }) {
  const [username, setUsername] = useState('')
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [totalCheckins, setTotalCheckins] = useState(0)

  useEffect(() => {
    fetchProfile()
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
                <input value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="Your username"
                  className="flex-1 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#3B6D11]" />
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

        <button onClick={signOut} className="w-full bg-white text-gray-400 py-3 rounded-2xl text-sm border border-gray-100 cursor-pointer">
          Sign out
        </button>
      </div>
      <BottomNav />
    </div>
  )
}