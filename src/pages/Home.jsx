import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import BottomNav from '../components/BottomNav'

export default function Home({ session }) {
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [groupName, setGroupName] = useState('')

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    const { data, error } = await supabase
      .from('group_members')
      .select('group_id, groups(id, name, created_at)')
      .eq('user_id', session.user.id)

    if (!error && data) {
      setGroups(data.map(d => d.groups))
    }
    setLoading(false)
  }

  const createGroup = async () => {
    if (!groupName.trim()) return
    const { data, error } = await supabase
      .from('groups')
      .insert({ name: groupName, created_by: session.user.id })
      .select()
      .single()

    if (!error && data) {
      await supabase.from('group_members').insert({
        group_id: data.id,
        user_id: session.user.id,
      })
      setGroupName('')
      setShowNewGroup(false)
      fetchGroups()
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f3] pb-24 max-w-md mx-auto">
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
        <span className="logo text-2xl">SPOTTER</span>
        <button
          onClick={() => setShowNewGroup(true)}
          className="text-sm text-[#3B6D11] font-medium bg-transparent border-none cursor-pointer"
        >
          + New crew
        </button>
      </div>

      <div className="px-5 py-5">
        {showNewGroup && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">New crew</p>
            <input
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="e.g. Iron Crew"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#3B6D11] mb-3"
            />
            <div className="flex gap-2">
              <button onClick={createGroup} className="flex-1 bg-[#3B6D11] text-[#C0DD97] py-2.5 rounded-xl text-sm font-medium border-none cursor-pointer">
                Create
              </button>
              <button onClick={() => setShowNewGroup(false)} className="flex-1 bg-gray-100 text-gray-500 py-2.5 rounded-xl text-sm font-medium border-none cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Your crews</p>

        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
            <p className="text-gray-400 text-sm mb-3">No crew yet.</p>
            <button
              onClick={() => setShowNewGroup(true)}
              className="text-[#3B6D11] text-sm font-medium bg-transparent border-none cursor-pointer"
            >
              Create your first crew →
            </button>
          </div>
        ) : (
          groups.map(group => (
            <div
              key={group.id}
              onClick={() => navigate(`/group/${group.id}`)}
              className="bg-white rounded-2xl p-4 border border-gray-100 mb-3 cursor-pointer active:bg-gray-50"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-[#1a1a1a]">{group.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Tap to view</p>
                </div>
                <span className="text-gray-300 text-lg">›</span>
              </div>
            </div>
          ))
        )}
      </div>
      <BottomNav />
    </div>
  )
}