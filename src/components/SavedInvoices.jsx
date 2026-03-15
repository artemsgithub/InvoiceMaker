import { useState, useEffect } from 'react'
import './SavedInvoices.css'

export default function SavedInvoices({ onLoad, onDelete }) {
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
              <td>{inv.invoiceNumber || '—'}</td>
              <td>{inv.clientName || '—'}</td>
              <td>{formatDate(inv.invoiceDate)}</td>
              <td>{getTotal(inv)}</td>
              <td>{formatDate(inv.savedAt)}</td>
              <td className="saved-actions">
                <button
                  className="btn-primary btn-small"
                  onClick={() => onLoad(inv)}
                >
                  Edit
                </button>
                <button
                  className="btn-danger btn-small"
                  onClick={() => handleDelete(inv.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
