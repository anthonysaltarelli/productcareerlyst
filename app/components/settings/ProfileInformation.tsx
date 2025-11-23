'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TrackedButton } from '@/app/components/TrackedButton'
import { trackEvent } from '@/lib/amplitude/client'
import { getDashboardTrackingContext } from '@/lib/utils/dashboard-tracking-context'
import type { DashboardStats } from '@/app/api/dashboard/stats/route'

interface ProfileData {
  first_name: string
  last_name: string
  linkedin: string
  portfolio: string
}

interface Subscription {
  plan: 'learn' | 'accelerate' | null
  status: string | null
  isActive: boolean
}

interface FeatureFlags {
  coach?: boolean
  compensation?: boolean
  impactPortfolio?: boolean
  careerTracker?: boolean
}

interface ProfileInformationProps {
  stats: DashboardStats | null
  subscription: Subscription | null
  userCreatedAt?: string | null
  featureFlags: FeatureFlags
  onProfileUpdated: () => void
}

export const ProfileInformation = ({
  stats,
  subscription,
  userCreatedAt,
  featureFlags,
  onProfileUpdated,
}: ProfileInformationProps) => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    linkedin: '',
    portfolio: '',
  })
  const [originalProfile, setOriginalProfile] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    linkedin: '',
    portfolio: '',
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [fieldFocusTimes, setFieldFocusTimes] = useState<Record<string, number>>({})
  const [fieldFirstFocus, setFieldFirstFocus] = useState<Record<string, boolean>>({})
  const [formStartTime] = useState(Date.now())
  const [submitAttempted, setSubmitAttempted] = useState(false)

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
          const loadedProfile = {
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            linkedin: data.linkedin || '',
            portfolio: data.portfolio || '',
          }
          setProfile(loadedProfile)
          setOriginalProfile(loadedProfile)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const getUserStateContext = () => {
    return getDashboardTrackingContext(
      stats,
      subscription,
      featureFlags,
      { createdAt: userCreatedAt }
    )
  }

  const handleFieldFocus = (fieldName: keyof ProfileData, fieldLabel: string) => () => {
    const currentValue = profile[fieldName]
    const hadValue = !!currentValue
    const isFirstTime = !fieldFirstFocus[fieldName]

    setFieldFocusTimes(prev => ({ ...prev, [fieldName]: Date.now() }))
    if (isFirstTime) {
      setFieldFirstFocus(prev => ({ ...prev, [fieldName]: true }))
    }

    trackEvent('User Focused Profile Field', {
      'Field Name': fieldName,
      'Field Label': fieldLabel,
      'Field Had Value': hadValue,
      'Field Value Length': currentValue.length,
      'Is First Time Focusing': isFirstTime,
      'Active Tab': 'profile',
      'Page Route': '/dashboard/settings',
      ...getUserStateContext(),
    })
  }

  const handleFieldBlur = (fieldName: keyof ProfileData, fieldLabel: string) => () => {
    const focusTime = fieldFocusTimes[fieldName]
    const timeSpent = focusTime ? Math.floor((Date.now() - focusTime) / 1000) : 0
    const currentValue = profile[fieldName]
    const originalValue = originalProfile[fieldName]
    const valueChanged = currentValue !== originalValue

    trackEvent('User Blurred Profile Field', {
      'Field Name': fieldName,
      'Field Label': fieldLabel,
      'Field Value Changed': valueChanged,
      'Field Value Length': currentValue.length,
      'Field Value Before': valueChanged ? originalValue : null,
      'Field Value After': valueChanged ? currentValue : null,
      'Time Spent in Field': timeSpent,
      'Active Tab': 'profile',
      'Page Route': '/dashboard/settings',
      ...getUserStateContext(),
    })
  }

  const validateField = (fieldName: keyof ProfileData, value: string): string | null => {
    if (fieldName === 'linkedin' || fieldName === 'portfolio') {
      if (value && value.trim() !== '') {
        try {
          new URL(value)
        } catch {
          return 'Invalid URL format'
        }
      }
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    setSubmitAttempted(true)

    // Calculate changed fields
    const changedFields: string[] = []
    if (profile.first_name !== originalProfile.first_name) changedFields.push('first_name')
    if (profile.last_name !== originalProfile.last_name) changedFields.push('last_name')
    if (profile.linkedin !== originalProfile.linkedin) changedFields.push('linkedin')
    if (profile.portfolio !== originalProfile.portfolio) changedFields.push('portfolio')

    // Validate fields
    const validationErrors: string[] = []
    const linkedinError = validateField('linkedin', profile.linkedin)
    const portfolioError = validateField('portfolio', profile.portfolio)
    if (linkedinError) validationErrors.push(linkedinError)
    if (portfolioError) validationErrors.push(portfolioError)

    // Calculate profile completion
    const fieldsFilledBefore = [
      originalProfile.first_name,
      originalProfile.last_name,
      originalProfile.linkedin,
      originalProfile.portfolio,
    ].filter(Boolean).length

    const fieldsFilledAfter = [
      profile.first_name,
      profile.last_name,
      profile.linkedin,
      profile.portfolio,
    ].filter(Boolean).length

    // Track form submission attempt
    trackEvent('User Attempted Profile Update', {
      'Form Fields Changed': changedFields,
      'Form Fields Changed Count': changedFields.length,
      'First Name Changed': changedFields.includes('first_name'),
      'Last Name Changed': changedFields.includes('last_name'),
      'LinkedIn URL Changed': changedFields.includes('linkedin'),
      'Portfolio URL Changed': changedFields.includes('portfolio'),
      'Form Has Errors': validationErrors.length > 0,
      'Form Validation Errors': validationErrors,
      'Active Tab': 'profile',
      'Profile Completion Before': fieldsFilledBefore,
      'Profile Completion After': fieldsFilledAfter,
      'Page Route': '/dashboard/settings',
      ...getUserStateContext(),
    })

    // If validation errors, track them
    if (validationErrors.length > 0) {
      validationErrors.forEach((error, index) => {
        const fieldName = index === 0 && linkedinError ? 'linkedin' : 'portfolio'
        trackEvent('User Encountered Profile Field Error', {
          'Field Name': fieldName,
          'Error Type': 'invalid_url',
          'Error Message': error,
          'Field Value': profile[fieldName],
          'Active Tab': 'profile',
          'Page Route': '/dashboard/settings',
          ...getUserStateContext(),
        })
      })
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setMessage({ type: 'error', text: 'User not found' })
        
        trackEvent('User Failed to Update Profile', {
          'Error Type': 'unauthorized',
          'Error Message': 'User not found',
          'Form Fields Changed': changedFields,
          'Form Fields Changed Count': changedFields.length,
          'Active Tab': 'profile',
          'Page Route': '/dashboard/settings',
          ...getUserStateContext(),
        })
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
        
        trackEvent('User Failed to Update Profile', {
          'Error Type': 'server_error',
          'Error Message': error.message,
          'Form Fields Changed': changedFields,
          'Form Fields Changed Count': changedFields.length,
          'Active Tab': 'profile',
          'Page Route': '/dashboard/settings',
          ...getUserStateContext(),
        })
      } else {
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        setOriginalProfile(profile)
        onProfileUpdated()

        const timeToSubmit = Math.floor((Date.now() - formStartTime) / 1000)

        trackEvent('User Successfully Updated Profile', {
          'Form Fields Changed': changedFields,
          'Form Fields Changed Count': changedFields.length,
          'First Name Updated': changedFields.includes('first_name'),
          'Last Name Updated': changedFields.includes('last_name'),
          'LinkedIn URL Updated': changedFields.includes('linkedin'),
          'Portfolio URL Updated': changedFields.includes('portfolio'),
          'Profile Completion Before': fieldsFilledBefore,
          'Profile Completion After': fieldsFilledAfter,
          'Profile Now Complete': fieldsFilledAfter === 4,
          'Time to Submit': timeToSubmit,
          'Active Tab': 'profile',
          'Page Route': '/dashboard/settings',
          ...getUserStateContext(),
        })
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      setMessage({ type: 'error', text: 'Failed to update profile' })
      
      trackEvent('User Failed to Update Profile', {
        'Error Type': 'network_error',
        'Error Message': 'Failed to update profile',
        'Form Fields Changed': changedFields,
        'Form Fields Changed Count': changedFields.length,
        'Active Tab': 'profile',
        'Page Route': '/dashboard/settings',
        ...getUserStateContext(),
      })
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

  const changedFields = [
    profile.first_name !== originalProfile.first_name ? 'first_name' : null,
    profile.last_name !== originalProfile.last_name ? 'last_name' : null,
    profile.linkedin !== originalProfile.linkedin ? 'linkedin' : null,
    profile.portfolio !== originalProfile.portfolio ? 'portfolio' : null,
  ].filter(Boolean) as string[]

  const hasValidationErrors = () => {
    return validateField('linkedin', profile.linkedin) !== null ||
           validateField('portfolio', profile.portfolio) !== null
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
              onFocus={handleFieldFocus('first_name', 'First Name')}
              onBlur={handleFieldBlur('first_name', 'First Name')}
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
              onFocus={handleFieldFocus('last_name', 'Last Name')}
              onBlur={handleFieldBlur('last_name', 'Last Name')}
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
            onFocus={handleFieldFocus('linkedin', 'LinkedIn Profile URL')}
            onBlur={handleFieldBlur('linkedin', 'LinkedIn Profile URL')}
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
            onFocus={handleFieldFocus('portfolio', 'Portfolio Website URL')}
            onBlur={handleFieldBlur('portfolio', 'Portfolio Website URL')}
            className="w-full px-4 py-3 rounded-[1rem] border-2 border-gray-300 focus:border-purple-500 focus:outline-none font-semibold"
            placeholder="https://yourportfolio.com"
          />
        </div>

        <TrackedButton
          type="submit"
          disabled={saving}
          className="px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_6px_0_0_rgba(147,51,234,0.6)]"
          eventName="User Clicked Save Profile Changes Button"
          buttonId="settings-profile-save-button"
          eventProperties={{
            'Button Section': 'Profile Information Section',
            'Button Position': 'Bottom of Profile Form',
            'Button Text': saving ? 'Saving...' : 'Save Changes',
            'Button Type': 'Primary Form Submit',
            'Button Context': 'Below all profile input fields',
            'Form Fields Changed Count': changedFields.length,
            'Form Has Validation Errors': hasValidationErrors(),
            'Active Tab': 'profile',
            'Page Route': '/dashboard/settings',
            ...getUserStateContext(),
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </TrackedButton>
      </form>
    </div>
  )
}
