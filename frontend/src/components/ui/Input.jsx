import { forwardRef } from 'react'

const Input = forwardRef(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`input-field ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 ml-1 text-sm text-red-500 font-medium">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
