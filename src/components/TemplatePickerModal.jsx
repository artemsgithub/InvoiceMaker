import './TemplatePickerModal.css'

export default function TemplatePickerModal({ templates, onSelectTemplate, onStartBlank, onClose }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal template-picker-modal" onClick={e => e.stopPropagation()}>
        <h3>New Invoice</h3>
        <button className="btn-primary template-blank-btn" onClick={onStartBlank}>
          Start Blank
        </button>

        {templates.length > 0 && (
          <>
            <div className="template-divider">
              <span>or choose a template</span>
            </div>
            <div className="template-list">
              {templates.map(t => (
                <button
                  key={t.id}
                  className="template-card"
                  onClick={() => onSelectTemplate(t)}
                >
                  <div className="template-card-name">{t.name}</div>
                  <div className="template-card-meta">
                    {t.clientName && <span>{t.clientName}</span>}
                    <span>{(t.lineItems || []).length} item{(t.lineItems || []).length !== 1 ? 's' : ''}</span>
                    {t.createdAt && <span>{formatDate(t.createdAt)}</span>}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
