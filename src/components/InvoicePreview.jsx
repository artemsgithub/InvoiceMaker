import './InvoicePreview.css'

export default function InvoicePreview({
  invoice,
  logo,
  subtotal,
  taxAmount,
  total,
}) {
  const formatCurrency = (val) => {
    return '$' + Number(val).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="preview-wrapper">
      <div className="invoice-preview" id="invoice-preview-content">
        {/* Header */}
        <div className="preview-header">
          <div className="preview-company">
            {logo && <img src={logo} alt="Logo" className="preview-logo" />}
            {invoice.companyName && (
              <h2 className="company-name">{invoice.companyName}</h2>
            )}
            {invoice.companyAddress && (
              <p className="company-detail">{invoice.companyAddress}</p>
            )}
            {invoice.companyPhone && (
              <p className="company-detail">{invoice.companyPhone}</p>
            )}
            {invoice.companyEmail && (
              <p className="company-detail">{invoice.companyEmail}</p>
            )}
          </div>
          <div className="preview-invoice-info">
            <h1 className="invoice-title">INVOICE</h1>
            {invoice.invoiceNumber && (
              <p>
                <span className="info-label">Invoice #</span>{' '}
                {invoice.invoiceNumber}
              </p>
            )}
            {invoice.invoiceDate && (
              <p>
                <span className="info-label">Date</span>{' '}
                {formatDate(invoice.invoiceDate)}
              </p>
            )}
            {invoice.dueDate && (
              <p>
                <span className="info-label">Due</span>{' '}
                {formatDate(invoice.dueDate)}
              </p>
            )}
          </div>
        </div>

        {/* Bill To */}
        {(invoice.clientName || invoice.clientAddress) && (
          <div className="preview-billto">
            <h4>Bill To</h4>
            {invoice.clientName && <p className="client-name">{invoice.clientName}</p>}
            {invoice.clientAddress && (
              <p className="client-address">{invoice.clientAddress}</p>
            )}
          </div>
        )}

        {/* Line Items Table */}
        <table className="preview-table">
          <thead>
            <tr>
              <th className="col-item">Item</th>
              <th className="col-desc">Description</th>
              <th className="col-qty">Qty</th>
              <th className="col-rate">Rate</th>
              <th className="col-total">Total</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const hasCategories = invoice.lineItems.some(li => li.category)
              if (!hasCategories) {
                return invoice.lineItems.map((li) => (
                  <tr key={li.id}>
                    <td className="col-item">{li.item}</td>
                    <td className="col-desc">{li.description}</td>
                    <td className="col-qty">{li.qty}</td>
                    <td className="col-rate">{formatCurrency(li.rate)}</td>
                    <td className="col-total">
                      {formatCurrency((Number(li.qty) || 0) * (Number(li.rate) || 0))}
                    </td>
                  </tr>
                ))
              }
              // Group by category
              const grouped = {}
              const categoryOrder = []
              const uncategorized = []
              for (const li of invoice.lineItems) {
                if (li.category) {
                  if (!categoryOrder.includes(li.category)) categoryOrder.push(li.category)
                  if (!grouped[li.category]) grouped[li.category] = []
                  grouped[li.category].push(li)
                } else {
                  uncategorized.push(li)
                }
              }
              const rows = []
              for (const cat of categoryOrder) {
                rows.push(
                  <tr key={`cat-${cat}`} className="category-row">
                    <td colSpan={5}>{cat}</td>
                  </tr>
                )
                for (const li of grouped[cat]) {
                  rows.push(
                    <tr key={li.id}>
                      <td className="col-item">{li.item}</td>
                      <td className="col-desc">{li.description}</td>
                      <td className="col-qty">{li.qty}</td>
                      <td className="col-rate">{formatCurrency(li.rate)}</td>
                      <td className="col-total">
                        {formatCurrency((Number(li.qty) || 0) * (Number(li.rate) || 0))}
                      </td>
                    </tr>
                  )
                }
              }
              if (uncategorized.length > 0) {
                for (const li of uncategorized) {
                  rows.push(
                    <tr key={li.id}>
                      <td className="col-item">{li.item}</td>
                      <td className="col-desc">{li.description}</td>
                      <td className="col-qty">{li.qty}</td>
                      <td className="col-rate">{formatCurrency(li.rate)}</td>
                      <td className="col-total">
                        {formatCurrency((Number(li.qty) || 0) * (Number(li.rate) || 0))}
                      </td>
                    </tr>
                  )
                }
              }
              return rows
            })()}
          </tbody>
        </table>

        {/* Totals */}
        <div className="preview-totals">
          <div className="totals-row">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {Number(invoice.taxRate) > 0 && (
            <div className="totals-row">
              <span>Tax ({invoice.taxRate}%)</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
          )}
          <div className="totals-row total-final">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="preview-notes">
            <h4>Notes</h4>
            <p>{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
