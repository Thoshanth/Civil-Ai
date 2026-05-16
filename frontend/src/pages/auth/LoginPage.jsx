import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { authAPI } from '../../lib/api'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import OtpInput from '../../components/ui/OtpInput'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [step, setStep] = useState(1) // 1 = credentials, 2 = OTP
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await authAPI.login(formData)
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (otp) => {
    setLoading(true)
    setError('')
    try {
      const response = await authAPI.verifyLoginOtp({ email: formData.email, otp })
      const { token, user } = response.data
      setAuth(token, user)
      navigate('/')
    } catch (err) {
      setError('Invalid or expired OTP.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-400/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary-400/20 blur-[100px] pointer-events-none" />

      <div className="max-w-md w-full z-10 animate-fade-in">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <h1 className="text-4xl font-heading font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
              CivilAI
            </h1>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {step === 1 ? 'Welcome back' : 'Two-step verification'}
          </h2>
          <p className="text-slate-500 mt-2 font-medium">
            {step === 1 ? 'Enter your credentials to access your account' : 'Enter the OTP sent to your email'}
          </p>
        </div>

        <div className="glass-panel p-8 sm:p-10 shadow-xl">
          {step === 1 && (
            <>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl text-red-600 text-sm font-medium flex items-center gap-3 animate-slide-up">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {error}
                  </div>
                )}

                <Input
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                />

                <Input
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                />

                <Button type="submit" loading={loading} className="w-full mt-2">
                  {loading ? 'Sending Verification...' : 'Sign In'}
                </Button>
              </form>

              <div className="flex items-center justify-between text-sm mt-8 pt-6 border-t border-slate-200/60">
                <Link to="/forgot-password" className="text-slate-500 hover:text-primary-600 font-medium transition-colors">
                  Forgot password?
                </Link>
                <Link to="/register" className="text-primary-600 hover:text-primary-700 font-bold transition-colors">
                  Create account
                </Link>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="animate-fade-in flex flex-col items-center">
              <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center w-full">
                <p className="text-slate-600 text-sm font-medium">
                  We sent a code to<br/>
                  <strong className="text-slate-900 text-base mt-1 block">{formData.email}</strong>
                </p>
              </div>

              {error && (
                <div className="w-full p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl text-red-600 text-sm font-medium flex items-center gap-3 mb-6 animate-slide-up">
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {error}
                </div>
              )}

              <OtpInput onComplete={handleVerifyOtp} />

              {loading && (
                <div className="flex items-center gap-2 text-primary-600 text-sm font-medium mt-6 animate-pulse">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying code...
                </div>
              )}

              <div className="mt-8 text-center w-full">
                <button
                  onClick={() => setStep(1)}
                  className="text-slate-500 hover:text-slate-900 text-sm font-semibold transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Back to login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
