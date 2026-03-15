import { useState } from 'react'
import './SettingsModal.css'

export default function SettingsModal({ categories, onSave, onClose }) {
  const [items, setItems] = useState([...categories])
  const [newCat, setNewCat] = useState('')

  const addCategory = () => {
    const trimmed = newCat.trim()
    if (!trimmed || items.includes(trimmed)) return
    setItems([...items, trimmed])
    setNewCat('')
  }

  const removeCategory = (idx) => {
    setItems(items.filter((_, i) => i !== idx))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCategory()
    }
  }

  const handleSave = () => {
    onSave(items)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal settings-modal" onClick={e => e.stopPropagation()}>
        <h3>Settings</h3>

        <div className="settings-section">
          <h4>Categories</h4>
          <p className="settings-hint">
            Manage the categories available for line items.
          </p>

          <div className="category-list">
            {items.map((cat, idx) => (
              <div key={idx} className="category-chip">
                <span>{cat}</span>
                <button
                  className="chip-remove"
                  onClick={() => removeCategory(idx)}
                  title="Remove"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          <div className="category-add">
            <input
              placeholder="New category name"
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="btn-secondary btn-small" onClick={addCategory}>
              Add
            </button>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}
