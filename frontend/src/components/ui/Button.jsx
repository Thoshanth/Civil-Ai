export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  loading = false,
  className = '',
  ...props 
}) {
  
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 rounded-xl transition-colors shadow-sm',
    outline: 'border-2 border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-500 rounded-xl transition-colors',
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5',
    lg: 'px-8 py-4 text-lg font-bold',
  }

  const baseStyle = variants[variant] || variants.primary;
  const sizeStyle = variant === 'primary' || variant === 'secondary' ? '' : sizes[size]; // Primary/secondary have built in padding in index.css, but we can override

  return (
    <button
      className={`${baseStyle} ${variant !== 'primary' && variant !== 'secondary' ? sizeStyle : ''} ${className} flex items-center justify-center gap-2`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  )
}
