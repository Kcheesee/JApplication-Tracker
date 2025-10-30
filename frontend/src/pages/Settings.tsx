import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import apiClient from '../api/client'

interface LLMProvider {
  name: string
  models: string[]
  default_model: string
  description: string
}

export default function Settings() {
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [providers, setProviders] = useState<Record<string, LLMProvider>>({})
  const [formData, setFormData] = useState({
    llm_provider: 'anthropic',
    llm_model: '',
    anthropic_api_key: '',
    openai_api_key: '',
    google_api_key: '',
    openrouter_api_key: '',
    gmail_enabled: true,
    gmail_search_days: 7,
    email_notifications: true,
  })

  useEffect(() => {
    fetchSettings()
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      const response = await apiClient.get('/api/llm/providers')
      if (response.data.success) {
        setProviders(response.data.providers)
      }
    } catch (error) {
      console.error('Failed to load LLM providers:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await apiClient.get('/api/settings')
      setSettings(response.data)
      setFormData({
        llm_provider: response.data.llm_provider || 'anthropic',
        llm_model: response.data.llm_model || '',
        anthropic_api_key: '',
        openai_api_key: '',
        google_api_key: '',
        openrouter_api_key: '',
        gmail_enabled: response.data.gmail_enabled,
        gmail_search_days: response.data.gmail_search_days,
        email_notifications: response.data.email_notifications,
      })
    } catch (error) {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value,
    })
  }

  const handleConnectGoogle = async () => {
    setConnecting(true)
    try {
      const response = await apiClient.get('/api/oauth/google/authorize')
      if (response.data.authorization_url) {
        // Redirect to Google OAuth authorization page
        window.location.href = response.data.authorization_url
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to connect Google account')
      setConnecting(false)
    }
  }

  const handleDisconnectGoogle = async () => {
    if (!confirm('Are you sure you want to disconnect your Google account? This will disable Gmail sync.')) {
      return
    }

    try {
      await apiClient.post('/api/oauth/google/disconnect')
      toast.success('Google account disconnected')
      fetchSettings()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to disconnect Google account')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload: any = {
        llm_provider: formData.llm_provider,
        llm_model: formData.llm_model || null,
        gmail_enabled: formData.gmail_enabled,
        gmail_search_days: formData.gmail_search_days,
        email_notifications: formData.email_notifications,
      }

      // Only send API keys if they were entered
      if (formData.anthropic_api_key) {
        payload.anthropic_api_key = formData.anthropic_api_key
      }
      if (formData.openai_api_key) {
        payload.openai_api_key = formData.openai_api_key
      }
      if (formData.google_api_key) {
        payload.google_api_key = formData.google_api_key
      }
      if (formData.openrouter_api_key) {
        payload.openrouter_api_key = formData.openrouter_api_key
      }

      await apiClient.put('/api/settings', payload)
      toast.success('Settings saved!')
      fetchSettings()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Settings
          </h2>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* LLM Provider Section */}
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">AI Provider Settings</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LLM Provider
                  </label>
                  <select
                    name="llm_provider"
                    value={formData.llm_provider}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    {Object.entries(providers).map(([key, provider]) => (
                      <option key={key} value={key}>
                        {provider.name} - {provider.description}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Choose which AI provider to use for parsing job application emails
                  </p>
                </div>

                {formData.llm_provider && providers[formData.llm_provider] && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Model (Optional)
                    </label>
                    <select
                      name="llm_model"
                      value={formData.llm_model}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="">Default ({providers[formData.llm_provider].default_model})</option>
                      {providers[formData.llm_provider].models.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Leave as default unless you need a specific model
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* API Keys Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">API Keys</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Anthropic API Key
                    {settings?.has_anthropic_key && <span className="ml-2 text-green-600 text-xs">✓ Configured</span>}
                  </label>
                  <input
                    type="password"
                    name="anthropic_api_key"
                    value={formData.anthropic_api_key}
                    onChange={handleChange}
                    placeholder={settings?.has_anthropic_key ? "Enter new key to update" : "sk-ant-..."}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Get one at{' '}
                    <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500">
                      console.anthropic.com
                    </a>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    OpenAI API Key
                    {settings?.has_openai_key && <span className="ml-2 text-green-600 text-xs">✓ Configured</span>}
                  </label>
                  <input
                    type="password"
                    name="openai_api_key"
                    value={formData.openai_api_key}
                    onChange={handleChange}
                    placeholder={settings?.has_openai_key ? "Enter new key to update" : "sk-..."}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Get one at{' '}
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500">
                      platform.openai.com
                    </a>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Google AI API Key
                    {settings?.has_google_key && <span className="ml-2 text-green-600 text-xs">✓ Configured</span>}
                  </label>
                  <input
                    type="password"
                    name="google_api_key"
                    value={formData.google_api_key}
                    onChange={handleChange}
                    placeholder={settings?.has_google_key ? "Enter new key to update" : "AIza..."}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Get one at{' '}
                    <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500">
                      Google AI Studio
                    </a>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    OpenRouter API Key
                    {settings?.has_openrouter_key && <span className="ml-2 text-green-600 text-xs">✓ Configured</span>}
                  </label>
                  <input
                    type="password"
                    name="openrouter_api_key"
                    value={formData.openrouter_api_key}
                    onChange={handleChange}
                    placeholder={settings?.has_openrouter_key ? "Enter new key to update" : "sk-or-..."}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Get one at{' '}
                    <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500">
                      openrouter.ai
                    </a>
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Account (Gmail Sync)
                    {settings?.has_google_credentials && <span className="ml-2 text-green-600 text-xs">✓ Connected</span>}
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Connect your Google account to enable automatic syncing of job application emails from Gmail.
                  </p>
                  {settings?.has_google_credentials ? (
                    <button
                      type="button"
                      onClick={handleDisconnectGoogle}
                      className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Disconnect Google Account
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleConnectGoogle}
                        disabled={connecting}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {connecting ? 'Connecting...' : 'Connect Google Account'}
                      </button>
                      <p className="mt-2 text-xs text-amber-600">
                        Note: First-time setup requires Google OAuth credentials. See <strong>GOOGLE_OAUTH_SETUP.md</strong> in the project root for instructions.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Gmail Sync</h3>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      name="gmail_enabled"
                      checked={formData.gmail_enabled}
                      onChange={handleChange}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label className="font-medium text-gray-700">Enable Gmail Sync</label>
                    <p className="text-gray-500">Automatically scan Gmail for job application emails</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Search Days Back
                  </label>
                  <input
                    type="number"
                    name="gmail_search_days"
                    value={formData.gmail_search_days}
                    onChange={handleChange}
                    min="1"
                    max="90"
                    className="mt-1 block w-full sm:w-32 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Number of days to search for new emails (1-90)
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Notifications</h3>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    name="email_notifications"
                    checked={formData.email_notifications}
                    onChange={handleChange}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label className="font-medium text-gray-700">Email Notifications</label>
                  <p className="text-gray-500">Receive email updates about your applications</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
