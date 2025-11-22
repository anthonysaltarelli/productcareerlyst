'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ProfileData {
  first_name: string
  last_name: string
  linkedin: string
  portfolio: string
}

export const ProfileInformation = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    linkedin: '',
    portfolio: '',
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return

        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, linkedin, portfolio')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading profile:', error)
        } else if (data) {
          setProfile({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            linkedin: data.linkedin || '',
            portfolio: data.portfolio || '',
          })
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setMessage({ type: 'error', text: 'User not found' })
        return
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          first_name: profile.first_name || null,
          last_name: profile.last_name || null,
          linkedin: profile.linkedin || null,
          portfolio: profile.portfolio || null,
        }, {
          onConflict: 'user_id'
        })

      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof ProfileData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setProfile(prev => ({ ...prev, [field]: e.target.value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 font-semibold">Loading profile...</div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-3xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent mb-6">
        Profile Information
      </h2>
      <p className="text-gray-700 font-semibold mb-8">
        Update your personal information and professional links
      </p>

      {message && (
        <div
          className={`mb-6 p-4 rounded-[1rem] font-semibold ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 border-2 border-green-300'
              : 'bg-red-100 text-red-800 border-2 border-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="first_name"
              className="block text-sm font-bold text-gray-700 mb-2"
            >
              First Name
            </label>
            <input
              type="text"
              id="first_name"
              value={profile.first_name}
              onChange={handleChange('first_name')}
              className="w-full px-4 py-3 rounded-[1rem] border-2 border-gray-300 focus:border-purple-500 focus:outline-none font-semibold"
              placeholder="Enter your first name"
            />
          </div>

          <div>
            <label
              htmlFor="last_name"
              className="block text-sm font-bold text-gray-700 mb-2"
            >
              Last Name
            </label>
            <input
              type="text"
              id="last_name"
              value={profile.last_name}
              onChange={handleChange('last_name')}
              className="w-full px-4 py-3 rounded-[1rem] border-2 border-gray-300 focus:border-purple-500 focus:outline-none font-semibold"
              placeholder="Enter your last name"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="linkedin"
            className="block text-sm font-bold text-gray-700 mb-2"
          >
            LinkedIn Profile URL
          </label>
          <input
            type="url"
            id="linkedin"
            value={profile.linkedin}
            onChange={handleChange('linkedin')}
            className="w-full px-4 py-3 rounded-[1rem] border-2 border-gray-300 focus:border-purple-500 focus:outline-none font-semibold"
            placeholder="https://linkedin.com/in/yourprofile"
          />
        </div>

        <div>
          <label
            htmlFor="portfolio"
            className="block text-sm font-bold text-gray-700 mb-2"
          >
            Portfolio Website URL
          </label>
          <input
            type="url"
            id="portfolio"
            value={profile.portfolio}
            onChange={handleChange('portfolio')}
            className="w-full px-4 py-3 rounded-[1rem] border-2 border-gray-300 focus:border-purple-500 focus:outline-none font-semibold"
            placeholder="https://yourportfolio.com"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_6px_0_0_rgba(147,51,234,0.6)]"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}

