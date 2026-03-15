import { useEffect, useState } from 'react'
import './Toast.css'

export default function Toast({ message, type = 'success', onDone }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true))

    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 300) // Wait for exit animation
    }, 2500)

    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div className={`toast toast-${type} ${visible ? 'toast-visible' : ''}`}>
      <span className="toast-icon">
        {type === 'success' && '\u2713'}
        {type === 'info' && '\u2139'}
        {type === 'error' && '!'}
      </span>
      <span className="toast-message">{message}</span>
    </div>
  )
}
