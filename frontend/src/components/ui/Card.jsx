export default function Card({ children, className = '', ...props }) {
  return (
    <div 
      className={`glass-panel overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-6 py-5 border-b border-white/20 bg-white/30 ${className}`}>
      {children}
    </div>
  )
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`px-6 py-5 ${className}`}>
      {children}
    </div>
  )
}
