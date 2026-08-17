import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface Props {
  to?: string
  label?: string
  fallbackTo?: string
}

/**
 * Reusable back navigation button.
 * Uses router navigation to avoid full page reloads.
 * If `to` is provided, navigates to that path.
 * Otherwise uses browser history (navigate(-1)) with fallback.
 */
export default function BackButton({ to, label = 'Back', fallbackTo = '/' }: Props) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (to) {
      navigate(to)
    } else if (window.history.length > 2) {
      navigate(-1)
    } else {
      navigate(fallbackTo)
    }
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-civic-700 font-medium transition-colors group mb-4"
      aria-label={label}
      title={label}
    >
      <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
      <span>{label}</span>
    </button>
  )
}
