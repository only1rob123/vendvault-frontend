import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [form, setForm] = useState({ company_name: '', name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('Passwords do not match')
    if (form.password.length < 8) return setError('Password must be at least 8 characters')
    setLoading(true)
    try {
      await register(form.company_name, form.name, form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">VV</span>
          </div>
          <h1 className="text-2xl font-bold text-white">VendVault</h1>
          <p className="text-gray-400 text-sm mt-1">Vending management software</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Create your account</h2>
            <p className="text-xs text-gray-400 mt-0.5">Free 14-day trial — no credit card required</p>
          </div>

          <div>
            <label className="label">Company Name</label>
            <input
              type="text" className="input" placeholder="Acme Vending Co."
              value={form.company_name} onChange={e => set('company_name', e.target.value)}
              required autoFocus
            />
          </div>

          <div>
            <label className="label">Your Name</label>
            <input
              type="text" className="input" placeholder="Jane Smith"
              value={form.name} onChange={e => set('name', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Work Email</label>
            <input
              type="email" className="input" placeholder="jane@acmevending.com"
              value={form.email} onChange={e => set('email', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password" className="input" placeholder="Min. 8 characters"
              value={form.password} onChange={e => set('password', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Confirm Password</label>
            <input
              type="password" className="input"
              value={form.confirm} onChange={e => set('confirm', e.target.value)}
              required
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          <p className="text-center text-xs text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 hover:underline font-medium">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
