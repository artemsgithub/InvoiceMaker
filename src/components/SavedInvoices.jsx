import { useState, useEffect } from 'react'
import './SavedInvoices.css'

export default function SavedInvoices({ onLoad, onDelete, onDownload }) {
  const [invoices, setInvoices] = useState([])

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedInvoices') || '[]')
    setInvoices(saved.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt)))
  }, [])

  const handleDelete = (id) => {
    if (!confirm('Delete this invoice?')) return
    onDelete(id)
    setInvoices(prev => prev.filter(inv => inv.id !== id))
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getTotal = (inv) => {
    const subtotal = inv.lineItems.reduce(
      (sum, li) => sum + (Number(li.qty) || 0) * (Number(li.rate) || 0),
      0
    )
    const tax = subtotal * ((Number(inv.taxRate) || 0) / 100)
    return '$' + (subtotal + tax).toFixed(2)
  }

  if (invoices.length === 0) {
    return (
      <div className="saved-empty">
        <p>No saved invoices yet.</p>
      </div>
    )
  }

  return (
    <div className="saved-invoices">
      <h2>Saved Invoices</h2>
      <table className="saved-table">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Client</th>
            <th>Date</th>
            <th>Total</th>
            <th>Saved</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id}>
              <td data-label="Invoice #">{inv.invoiceNumber || '—'}</td>
              <td data-label="Client">{inv.clientName || '—'}</td>
              <td data-label="Date">{formatDate(inv.invoiceDate)}</td>
              <td data-label="Total">{getTotal(inv)}</td>
              <td data-label="Saved">{formatDate(inv.savedAt)}</td>
              <td className="saved-actions">
                <button
                  className="btn-icon btn-small"
                  onClick={() => onLoad(inv)}
                  title="Edit"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button
                  className="btn-icon btn-small"
                  onClick={() => onDownload(inv)}
                  title="Download PDF"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </button>
                <button
                  className="btn-icon btn-small btn-icon-danger"
                  onClick={() => handleDelete(inv.id)}
                  title="Delete"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
