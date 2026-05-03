import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Join() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        joinGroup(session.user.id)
      } else {
        setStatus('login')
      }
    })
  }, [])

  const joinGroup = async (userId) => {
    const { error } = await supabase.from('group_members').insert({
      group_id: id,
      user_id: userId,
    })
    if (error && error.code !== '23505') {
      setStatus('error')
    } else {
      setStatus('success')
      setTimeout(() => navigate('/group/' + id), 1500)
    }
  }

  if (status === 'loading') return (
    <div className="min-h-screen bg-[#f5f5f3] flex items-center justify-center">
      <p className="text-gray-400">Joining crew...</p>
    </div>
  )

  if (status === 'login') return (
    <div className="min-h-screen bg-[#f5f5f3] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="logo text-5xl mb-4">SPOTTER</h1>
        <p className="text-gray-500 text-sm mb-8">You have been invited! Create an account to join.</p>
        <button onClick={() => navigate('/login')} className="w-full bg-[#3B6D11] text-[#C0DD97] py-3 rounded-xl font-medium text-sm border-none cursor-pointer">
          Create account / Sign in
        </button>
      </div>
    </div>
  )

  if (status === 'success') return (
    <div className="min-h-screen bg-[#f5f5f3] flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-3">🎉</p>
        <p className="text-[#3B6D11] font-medium">You joined the crew!</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f5f5f3] flex items-center justify-center">
      <p className="text-gray-400">Something went wrong.</p>
    </div>
  )
}