import { useState } from 'react'
import './SettingsModal.css'

export default function SettingsModal({ categories, onSave, templates, onDeleteTemplate, onRenameTemplate, onClose }) {
  const [items, setItems] = useState([...categories])
  const [newCat, setNewCat] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

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

  const startRename = (t) => {
    setEditingId(t.id)
    setEditingName(t.name)
  }

  const finishRename = () => {
    if (editingId && editingName.trim()) {
      onRenameTemplate(editingId, editingName.trim())
    }
    setEditingId(null)
    setEditingName('')
  }

  const handleRenameKeyDown = (e) => {
    if (e.key === 'Enter') finishRename()
    if (e.key === 'Escape') {
      setEditingId(null)
      setEditingName('')
    }
  }

  const handleDeleteTemplate = (id) => {
    onDeleteTemplate(id)
    setConfirmDeleteId(null)
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

        {templates && (
          <div className="settings-section">
            <h4>Templates</h4>
            <p className="settings-hint">
              Manage your saved invoice templates.
            </p>

            {templates.length === 0 ? (
              <p className="settings-hint" style={{ fontStyle: 'italic' }}>No templates saved yet.</p>
            ) : (
              <div className="template-mgmt-list">
                {templates.map(t => (
                  <div key={t.id} className="template-mgmt-row">
                    {editingId === t.id ? (
                      <input
                        className="template-rename-input"
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onBlur={finishRename}
                        onKeyDown={handleRenameKeyDown}
                        autoFocus
                      />
                    ) : (
                      <span
                        className="template-mgmt-name"
                        onClick={() => startRename(t)}
                        title="Click to rename"
                      >
                        {t.name}
                      </span>
                    )}
                    <div className="template-mgmt-actions">
                      {confirmDeleteId === t.id ? (
                        <>
                          <span className="confirm-text">Delete?</span>
                          <button className="btn-small btn-danger" onClick={() => handleDeleteTemplate(t.id)}>Yes</button>
                          <button className="btn-small btn-secondary" onClick={() => setConfirmDeleteId(null)}>No</button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn-icon-small"
                            onClick={() => startRename(t)}
                            title="Rename"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button
                            className="btn-icon-small btn-icon-danger"
                            onClick={() => setConfirmDeleteId(t.id)}
                            title="Delete"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}
