import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authAPI } from '../../lib/api'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import OtpInput from '../../components/ui/OtpInput'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1 = email, 2 = OTP, 3 = new password
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authAPI.forgotPassword({ email })
      setStep(2)
    } catch (err) {
      setError('Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpComplete = (code) => {
    setOtp(code)
    setStep(3)
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await authAPI.resetPassword({ email, otp, newPassword })
      toast.success('Password reset successful! Please login with your new password.')
      navigate('/login')
    } catch (err) {
      setError('Invalid OTP or request expired. Please start again.')
      setStep(1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="CivilAI Logo" className="h-16" />
          </div>
          <p className="text-gray-600">
            {step === 1 && 'Reset your password'}
            {step === 2 && 'Verify OTP'}
            {step === 3 && 'Set new password'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {step === 1 && (
            <>
              <form onSubmit={handleSendOtp} className="space-y-6">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <p className="text-gray-600 text-sm mb-4">
                    Enter your email address and we'll send you an OTP to reset your password.
                  </p>
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                  />
                </div>

                <Button type="submit" loading={loading} className="w-full">
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  ← Back to login
                </Link>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="mb-6">
                <p className="text-gray-600 text-sm text-center">
                  Enter the 6-digit OTP sent to <strong>{email}</strong>
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-4">
                  {error}
                </div>
              )}

              <OtpInput onComplete={handleOtpComplete} />

              <div className="mt-6 text-center text-sm">
                <button
                  onClick={() => setStep(1)}
                  className="text-gray-600 hover:text-gray-700"
                >
                  ← Back
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <form onSubmit={handleResetPassword} className="space-y-6">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <Input
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />

                <Button type="submit" loading={loading} className="w-full">
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <button
                  onClick={() => setStep(2)}
                  className="text-gray-600 hover:text-gray-700"
                >
                  ← Back
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
