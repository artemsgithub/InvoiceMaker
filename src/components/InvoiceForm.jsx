import { useState } from 'react'
import './InvoiceForm.css'

export default function InvoiceForm({
  invoice,
  logo,
  categories,
  deletedItems,
  onUpdateField,
  onUpdateLineItem,
  onAddLineItem,
  onRemoveLineItem,
  onRestoreItem,
  onPermanentDelete,
  onLogoUpload,
  onRemoveLogo,
  onImportMarkdown,
}) {
  const [showPasteModal, setShowPasteModal] = useState(false)
  const [showDeletedModal, setShowDeletedModal] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [pasteText, setPasteText] = useState('')

  const handlePasteImport = () => {
    const count = onImportMarkdown(pasteText)
    if (count > 0) {
      setPasteText('')
      setShowPasteModal(false)
    } else {
      alert('Could not parse any items from the pasted text.')
    }
  }

  return (
    <div className="invoice-form">
      {/* Logo Upload */}
      <section className="form-section">
        <h3>Company Logo</h3>
        <div className="logo-upload">
          {logo ? (
            <div className="logo-preview-wrap">
              <img src={logo} alt="Company logo" className="logo-thumb" />
              <button className="btn-danger btn-small" onClick={onRemoveLogo}>
                Remove
              </button>
            </div>
          ) : (
            <label className="logo-upload-label">
              <span>Click to upload logo</span>
              <input
                type="file"
                accept="image/*"
                onChange={onLogoUpload}
                hidden
              />
            </label>
          )}
        </div>
      </section>

      {/* Company Info */}
      <section className="form-section">
        <h3>Your Company</h3>
        <div className="form-grid">
          <input
            placeholder="Company name"
            value={invoice.companyName}
            onChange={e => onUpdateField('companyName', e.target.value)}
          />
          <input
            placeholder="Phone"
            value={invoice.companyPhone}
            onChange={e => onUpdateField('companyPhone', e.target.value)}
          />
          <input
            placeholder="Email"
            value={invoice.companyEmail}
            onChange={e => onUpdateField('companyEmail', e.target.value)}
          />
          <textarea
            placeholder="Address"
            rows={2}
            value={invoice.companyAddress}
            onChange={e => onUpdateField('companyAddress', e.target.value)}
          />
        </div>
      </section>

      {/* Client Info */}
      <section className="form-section">
        <h3>Bill To</h3>
        <div className="form-grid">
          <input
            placeholder="Client name"
            value={invoice.clientName}
            onChange={e => onUpdateField('clientName', e.target.value)}
          />
          <textarea
            placeholder="Client address"
            rows={2}
            value={invoice.clientAddress}
            onChange={e => onUpdateField('clientAddress', e.target.value)}
          />
        </div>
      </section>

      {/* Invoice Details */}
      <section className="form-section">
        <h3>Invoice Details</h3>
        <div className="form-grid four-col">
          <div className="form-field">
            <label>Document Type</label>
            <select
              value={invoice.documentType || 'INVOICE'}
              onChange={e => onUpdateField('documentType', e.target.value)}
            >
              <option value="INVOICE">Invoice</option>
              <option value="ESTIMATE">Estimate</option>
            </select>
          </div>
          <div className="form-field">
            <label>{invoice.documentType === 'ESTIMATE' ? 'Estimate #' : 'Invoice #'}</label>
            <input
              value={invoice.invoiceNumber}
              onChange={e => onUpdateField('invoiceNumber', e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Date</label>
            <input
              type="date"
              value={invoice.invoiceDate}
              onChange={e => onUpdateField('invoiceDate', e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Due Date</label>
            <input
              type="date"
              value={invoice.dueDate}
              onChange={e => onUpdateField('dueDate', e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Line Items */}
      <section className="form-section">
        <h3>Line Items</h3>
        <div className="line-items-list">
          {invoice.lineItems.map((li) => (
            <div key={li.id} className="line-item-card">
              <div className="line-item-top">
                <div className="line-item-fields">
                  <input
                    className="li-item"
                    placeholder="Item"
                    value={li.item}
                    onChange={e => onUpdateLineItem(li.id, 'item', e.target.value)}
                  />
                  <input
                    className="li-desc"
                    placeholder="Description"
                    value={li.description}
                    onChange={e => onUpdateLineItem(li.id, 'description', e.target.value)}
                  />
                  <input
                    className="li-qty"
                    type="number"
                    min="0"
                    placeholder="Qty"
                    value={li.qty}
                    onChange={e => onUpdateLineItem(li.id, 'qty', e.target.value)}
                  />
                  <input
                    className="li-rate"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Rate"
                    value={li.rate}
                    onChange={e => onUpdateLineItem(li.id, 'rate', e.target.value)}
                  />
                  <span className="li-total">
                    ${((Number(li.qty) || 0) * (Number(li.rate) || 0)).toFixed(2)}
                  </span>
                </div>
                {invoice.lineItems.length > 1 && (
                  <button
                    className="btn-remove"
                    onClick={() => onRemoveLineItem(li.id)}
                    title="Remove item"
                  >
                    &times;
                  </button>
                )}
              </div>
              <div className="line-item-bottom">
                <select
                  className="li-category"
                  value={li.category || ''}
                  onChange={e => onUpdateLineItem(li.id, 'category', e.target.value)}
                >
                  <option value="">No category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
        <div className="line-items-actions">
          <button className="btn-secondary btn-small" onClick={onAddLineItem}>
            + Add Item
          </button>
          <button
            className="btn-secondary btn-small"
            onClick={() => setShowPasteModal(true)}
          >
            Paste Markdown
          </button>
          {deletedItems.length > 0 && (
            <button
              className="btn-secondary btn-small btn-deleted"
              onClick={() => setShowDeletedModal(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              Deleted Items ({deletedItems.length})
            </button>
          )}
        </div>
      </section>

      {/* Deleted Items Modal */}
      {showDeletedModal && (
        <div className="modal-overlay" onClick={() => { setShowDeletedModal(false); setConfirmDeleteId(null) }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Deleted Items</h3>
            {deletedItems.length === 0 ? (
              <p className="modal-hint">No deleted items.</p>
            ) : (
              <div className="deleted-items-list">
                {deletedItems.map(item => (
                  <div key={item.id} className="deleted-item-row">
                    <div className="deleted-item-info">
                      <span className="deleted-item-name">{item.item || 'Untitled'}</span>
                      <span className="deleted-item-desc">{item.description}</span>
                    </div>
                    <div className="deleted-item-actions">
                      <button
                        className="btn-icon btn-small"
                        onClick={() => { onRestoreItem(item.id); if (deletedItems.length <= 1) setShowDeletedModal(false) }}
                        title="Restore item"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                      </button>
                      {confirmDeleteId === item.id ? (
                        <div className="confirm-delete-inline">
                          <span className="confirm-text">Sure?</span>
                          <button
                            className="btn-danger btn-small"
                            onClick={() => { onPermanentDelete(item.id); setConfirmDeleteId(null); if (deletedItems.length <= 1) setShowDeletedModal(false) }}
                          >
                            Yes
                          </button>
                          <button
                            className="btn-secondary btn-small"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn-icon btn-small btn-icon-danger"
                          onClick={() => setConfirmDeleteId(item.id)}
                          title="Permanently delete"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => { setShowDeletedModal(false); setConfirmDeleteId(null) }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paste Markdown Modal */}
      {showPasteModal && (
        <div className="modal-overlay" onClick={() => setShowPasteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Paste Markdown</h3>
            <p className="modal-hint">
              Paste a markdown table or a list of items. Supported formats:
            </p>
            <pre className="modal-example">{`| Item | Description |
|------|-------------|
| Surface prep | Sand, patch walls |

or:

- Surface prep: Sand, patch walls
- Paint walls: 2 coats, Sherwin-Williams`}</pre>
            <textarea
              className="modal-textarea"
              rows={8}
              placeholder="Paste your markdown here..."
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              autoFocus
            />
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => { setShowPasteModal(false); setPasteText('') }}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={handlePasteImport}>
                Import Items
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tax */}
      <section className="form-section">
        <h3>Tax</h3>
        <div className="form-field inline-field">
          <label>Tax Rate (%)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={invoice.taxRate}
            onChange={e => onUpdateField('taxRate', e.target.value)}
            style={{ width: 100 }}
          />
        </div>
      </section>

      {/* Notes */}
      <section className="form-section">
        <h3>Notes / Terms</h3>
        <textarea
          placeholder="Payment terms, thank you note, etc."
          rows={3}
          value={invoice.notes}
          onChange={e => onUpdateField('notes', e.target.value)}
          style={{ width: '100%' }}
        />
      </section>
    </div>
  )
}
