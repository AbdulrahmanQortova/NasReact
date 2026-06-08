// src/components/ui/Button.jsx
export default function Button({
  children,
  variant = 'primary',  // 'primary' | 'secondary' | 'ghost' | 'text'
  type = 'button',
  onClick,
  className = '',
  ...props
}) {
  const cls = {
    primary:   'primary-btn',
    secondary: 'secondary-btn',
    ghost:     'ghost-btn',
    text:      'text-btn',
  }[variant]

  return (
    <button
      type={type}
      className={`${cls} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}