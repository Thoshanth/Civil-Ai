import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../../lib/api'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import OtpInput from '../../components/ui/OtpInput'
import { useAuthStore } from '../../store/authStore'

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [step, setStep] = useState(1) // 1 = form, 2 = OTP
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const response = await authAPI.register({
        fullName: formData.name,
        email: formData.email,
        password: formData.password,
      })
      console.log('Registration response:', response)
      setStep(2)
      startResendTimer()
    } catch (err) {
      console.error('Registration error:', err)
      const errorMessage = err.response?.data?.message || err.response?.data || err.message || 'Registration failed. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (otp) => {
    setLoading(true)
    setError('')
    try {
      const response = await authAPI.verifyOtp({ email: formData.email, otp })
      const { token, user } = response.data
      setAuth(token, user)
      navigate('/')
    } catch (err) {
      setError('Invalid or expired OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    try {
      await authAPI.resendOtp({ email: formData.email })
      startResendTimer()
    } catch (err) {
      setError('Failed to resend OTP. Please try again.')
    }
  }

  const startResendTimer = () => {
    setResendTimer(60)
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="CivilAI Logo" className="h-16" />
          </div>
          <p className="text-gray-600">
            {step === 1 ? 'Create your account' : 'Verify your email'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {step === 1 && (
            <>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <Input
                  label="Full Name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="John Doe"
                />

                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="you@example.com"
                />

                <Input
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                  placeholder="••••••••"
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  placeholder="••••••••"
                />

                <Button type="submit" loading={loading} className="w-full">
                  {loading ? 'Sending OTP...' : 'Continue'}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-gray-600">Already have an account? </span>
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign in
                </Link>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="mb-6">
                <p className="text-gray-600 text-sm text-center">
                  Enter the 6-digit OTP sent to <strong>{formData.email}</strong>
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-4">
                  {error}
                </div>
              )}

              <OtpInput onComplete={handleVerifyOtp} />

              {loading && (
                <p className="text-blue-600 text-sm text-center mt-4">Verifying...</p>
              )}

              <div className="text-center mt-6">
                {resendTimer > 0 ? (
                  <p className="text-gray-400 text-sm">Resend OTP in {resendTimer}s</p>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <div className="mt-6 text-center text-sm">
                <button
                  onClick={() => setStep(1)}
                  className="text-gray-600 hover:text-gray-700"
                >
                  ← Back to registration
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
