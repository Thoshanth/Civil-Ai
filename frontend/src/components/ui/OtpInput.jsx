import { useRef, useState } from 'react'

export default function OtpInput({ onComplete }) {
  const [values, setValues] = useState(Array(6).fill(''))
  const inputs = useRef([])

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return          // digits only
    const next = [...values]
    next[i] = val.slice(-1)                 // one digit per box
    setValues(next)
    if (val && i < 5) inputs.current[i + 1]?.focus()  // auto-advance
    if (next.every(Boolean)) onComplete(next.join('')) // all filled
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !values[i] && i > 0) {
      inputs.current[i - 1]?.focus()       // go back on delete
    }
  }

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = Array(6).fill('')
    text.split('').forEach((c, i) => (next[i] = c))
    setValues(next)
    if (text.length === 6) onComplete(text)
    inputs.current[Math.min(text.length, 5)]?.focus()
  }

  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
      {values.map((v, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={v}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-bold font-heading
                     bg-white/60 border border-slate-200 rounded-xl focus:bg-white
                     focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 
                     outline-none transition-all duration-200 shadow-sm"
        />
      ))}
    </div>
  )
}
