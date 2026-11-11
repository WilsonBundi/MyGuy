'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faArrowRight, faEnvelope, faPhone, faCalendar, faGlobe, faLanguage, faHeart, faUserCircle } from '@fortawesome/free-solid-svg-icons'

interface OnboardingData {
  bio: string
  country: string
  language: string
  secondaryLanguages: string[]
  autoTranslate: boolean
  interests: string[]
  dateOfBirth: string
  phone: string
  phoneCountry: string
  verificationMethod: 'email' | 'phone'
}

export default function OnboardingFlow() {
  const { data: session } = useSession()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<OnboardingData>({
    bio: '',
    country: '',
    language: 'en',
    secondaryLanguages: [],
    autoTranslate: true,
    interests: [],
    dateOfBirth: '',
    phone: '',
    phoneCountry: '+254',
    verificationMethod: 'email'
  })
  const [submitting, setSubmitting] = useState(false)

  const interests = [
    'Technology', 'Music', 'Football', 'Business', 'AI', 'Gaming',
    'Travel', 'Education', 'Fashion', 'Photography', 'Politics',
    'Movies', 'Science', 'Fitness', 'Entrepreneurship', 'Art', 'News'
  ]

  const countries = [
    'Kenya', 'United States', 'United Kingdom', 'Nigeria', 'South Africa',
    'India', 'Brazil', 'Germany', 'Japan', 'France', 'Canada', 'Australia'
  ]

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'sw', name: 'Kiswahili' },
    { code: 'fr', name: 'French' },
    { code: 'es', name: 'Spanish' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ar', name: 'Arabic' },
    { code: 'de', name: 'German' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ja', name: 'Japanese' },
    { code: 'zh', name: 'Chinese' }
  ]

  const phoneCountries = [
    { code: '+254', flag: '🇰🇪', name: 'Kenya' },
    { code: '+1', flag: '🇺🇸', name: 'United States' },
    { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
    { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
    { code: '+27', flag: '🇿🇦', name: 'South Africa' },
    { code: '+91', flag: '🇮🇳', name: 'India' },
    { code: '+55', flag: '🇧🇷', name: 'Brazil' },
    { code: '+81', flag: '🇯🇵', name: 'Japan' }
  ]

  const toggleInterest = (interest: string) => {
    setData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }))
  }

  const toggleSecondaryLanguage = (langCode: string) => {
    setData(prev => ({
      ...prev,
      secondaryLanguages: prev.secondaryLanguages.includes(langCode)
        ? prev.secondaryLanguages.filter(l => l !== langCode)
        : [...prev.secondaryLanguages, langCode]
    }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          onboardingCompleted: true
        })
      })

      if (response.ok) {
        router.push('/home')
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const nextStep = () => {
    if (step < 6) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl p-8">
        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {Array.from({ length: 6 }, (_, i) => i + 1).map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                s <= step ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}>
                {s < step ? <FontAwesomeIcon icon={faCheck} className="w-4 h-4" /> : s}
              </div>
              {s < 6 && <div className={`flex-1 h-1 mx-1 ${s < step ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Verify */}
        {step === 1 && (
          <div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faEnvelope} className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verify your account</h2>
              <p className="text-gray-600 dark:text-gray-300">Choose how you want to verify</p>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => setData({ ...data, verificationMethod: 'email' })}
                className={`w-full p-4 rounded-lg border-2 transition ${
                  data.verificationMethod === 'email'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <FontAwesomeIcon icon={faEnvelope} className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900 dark:text-white">Email</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{session?.user?.email}</div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setData({ ...data, verificationMethod: 'phone' })}
                className={`w-full p-4 rounded-lg border-2 transition ${
                  data.verificationMethod === 'phone'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <FontAwesomeIcon icon={faPhone} className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900 dark:text-white">Phone</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">International format</div>
                  </div>
                </div>
              </button>
              {data.verificationMethod === 'phone' && (
                <div className="space-y-2">
                  <select
                    value={data.phoneCountry}
                    onChange={(e) => setData({ ...data, phoneCountry: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white"
                  >
                    {phoneCountries.map(country => (
                      <option key={country.code} value={country.code}>{country.flag} {country.code} ({country.name})</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={data.phone}
                    onChange={(e) => setData({ ...data, phone: e.target.value })}
                    placeholder="712 345 678"
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Date of Birth */}
        {step === 2 && (
          <div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faCalendar} className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">When were you born?</h2>
              <p className="text-gray-600 dark:text-gray-300">This helps us provide age-appropriate experiences</p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Day</label>
                  <select
                    value={data.dateOfBirth.split('-')[2] || ''}
                    onChange={(e) => {
                      const parts = data.dateOfBirth.split('-')
                      parts[2] = e.target.value
                      setData({ ...data, dateOfBirth: parts.filter(Boolean).join('-') })
                    }}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white"
                  >
                    <option value="">Day</option>
                    {Array.from({ length: 31 }, (_, i) => (
                      <option key={i + 1} value={String(i + 1).padStart(2, '0')}>{i + 1}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Month</label>
                  <select
                    value={data.dateOfBirth.split('-')[1] || ''}
                    onChange={(e) => {
                      const parts = data.dateOfBirth.split('-')
                      parts[1] = e.target.value
                      setData({ ...data, dateOfBirth: parts.filter(Boolean).join('-') })
                    }}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white"
                  >
                    <option value="">Month</option>
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                      <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Year</label>
                  <select
                    value={data.dateOfBirth.split('-')[0] || ''}
                    onChange={(e) => {
                      const parts = data.dateOfBirth.split('-')
                      parts[0] = e.target.value
                      setData({ ...data, dateOfBirth: parts.filter(Boolean).join('-') })
                    }}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white"
                  >
                    <option value="">Year</option>
                    {Array.from({ length: 100 }, (_, i) => (
                      <option key={i} value={String(new Date().getFullYear() - i)}>{new Date().getFullYear() - i}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Country/Region */}
        {step === 3 && (
          <div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faGlobe} className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Where are you based?</h2>
              <p className="text-gray-600 dark:text-gray-300">Select your country or region</p>
            </div>
            <div className="space-y-4">
              <div>
                <select
                  value={data.country}
                  onChange={(e) => setData({ ...data, country: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white"
                >
                  <option value="">Search countries...</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Languages */}
        {step === 4 && (
          <div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faLanguage} className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Choose your languages</h2>
              <p className="text-gray-600 dark:text-gray-300">MyGuy can translate conversations for you</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Primary language</label>
                <select
                  value={data.language}
                  onChange={(e) => setData({ ...data, language: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white"
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">I also understand</label>
                <div className="grid grid-cols-2 gap-2">
                  {languages.filter(l => l.code !== data.language).map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => toggleSecondaryLanguage(lang.code)}
                      className={`p-3 rounded-lg border-2 text-sm transition ${
                        data.secondaryLanguages.includes(lang.code)
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Automatically translate</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">MyGuy can translate conversations for you</div>
                </div>
                <button
                  onClick={() => setData({ ...data, autoTranslate: !data.autoTranslate })}
                  className={`w-12 h-6 rounded-full transition ${
                    data.autoTranslate ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition transform ${
                    data.autoTranslate ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Interests */}
        {step === 5 && (
          <div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faHeart} className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">What are you into?</h2>
              <p className="text-gray-600 dark:text-gray-300">Choose at least 3 interests</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {interests.map(interest => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`p-3 rounded-lg border-2 transition ${
                    data.interests.includes(interest)
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Profile */}
        {step === 6 && (
          <div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faUserCircle} className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Make your profile yours</h2>
              <p className="text-gray-600 dark:text-gray-300">Add a photo and tell people about yourself</p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">+ Add photo</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label>
                <textarea
                  value={data.bio}
                  onChange={(e) => setData({ ...data, bio: e.target.value })}
                  placeholder="Tell people a little about yourself..."
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white resize-none"
                  rows={3}
                  maxLength={160}
                />
                <div className="text-right text-sm text-gray-500 dark:text-gray-400 mt-1">{data.bio.length}/160</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
                <input
                  type="text"
                  value={data.country}
                  onChange={(e) => setData({ ...data, country: e.target.value })}
                  placeholder="e.g., Nairobi, Kenya"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Complete */}
        {step === 7 && (
          <div className="text-center">
            <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <FontAwesomeIcon icon={faCheck} className="w-10 h-10 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to MyGuy 🌍</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Your account is ready. Start connecting with people everywhere.
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-left mb-6 space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Account Type:</strong> Personal
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Country:</strong> {data.country || 'Not set'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Language:</strong> {languages.find(l => l.code === data.language)?.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Interests:</strong> {data.interests.join(', ') || 'None selected'}
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          {step > 1 && (
            <button
              onClick={prevStep}
              className="px-6 py-3 rounded-lg font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              Back
            </button>
          )}
          {step < 6 ? (
            <button
              onClick={nextStep}
              disabled={
                (step === 2 && !data.dateOfBirth) ||
                (step === 3 && !data.country) ||
                (step === 5 && data.interests.length < 3)
              }
              className="ml-auto px-6 py-3 rounded-lg font-semibold bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <span>Next</span>
              <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="ml-auto px-6 py-3 rounded-lg font-semibold bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Setting up...' : 'Finish Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
