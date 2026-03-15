import { useState } from 'react'
import InvoiceForm from './components/InvoiceForm'
import InvoicePreview from './components/InvoicePreview'
import SavedInvoices from './components/SavedInvoices'
import './App.css'

const DEFAULT_CATEGORIES = ['Labor', 'Materials', 'Equipment', 'Travel', 'Other']

const emptyLineItem = () => ({
  id: crypto.randomUUID(),
  item: '',
  description: '',
  qty: 1,
  rate: 0,
  category: '',
})

const defaultInvoice = () => ({
  id: crypto.randomUUID(),
  companyName: '',
  companyAddress: '',
  companyPhone: '',
  companyEmail: '',
  clientName: '',
  clientAddress: '',
  invoiceNumber: '',
  invoiceDate: new Date().toISOString().split('T')[0],
  dueDate: '',
  taxRate: 0,
  notes: '',
  lineItems: [emptyLineItem()],
})

export default function App() {
  const [invoice, setInvoice] = useState(defaultInvoice)
  const [logo, setLogo] = useState(() => localStorage.getItem('invoiceLogo') || null)
  const [view, setView] = useState('editor') // 'editor' | 'saved'

  const updateField = (field, value) => {
    setInvoice(prev => ({ ...prev, [field]: value }))
  }

  const updateLineItem = (id, field, value) => {
    setInvoice(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(li =>
        li.id === id ? { ...li, [field]: value } : li
      ),
    }))
  }

  const addLineItem = () => {
    setInvoice(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, emptyLineItem()],
    }))
  }

  const removeLineItem = (id) => {
    setInvoice(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(li => li.id !== id),
    }))
  }

  const importMarkdownItems = (markdown) => {
    const lines = markdown.trim().split('\n')
    const newItems = []

    // Try parsing as markdown table
    const tableRows = lines.filter(line => line.includes('|') && !line.match(/^\s*\|?\s*[-:]+/))
    if (tableRows.length > 0) {
      for (const row of tableRows) {
        const cells = row.split('|').map(c => c.trim()).filter(Boolean)
        if (cells.length >= 2) {
          // Skip header row if it looks like one
          if (cells[0].toLowerCase() === 'item' && cells[1].toLowerCase() === 'description') continue
          newItems.push({
            id: crypto.randomUUID(),
            item: cells[0] || '',
            description: cells[1] || '',
            qty: Number(cells[2]) || 1,
            rate: Number(String(cells[3] || '').replace(/[$,]/g, '')) || 0,
            category: '',
          })
        }
      }
    }

    // Fallback: parse as "- Item: Description" or "Item - Description" lines
    if (newItems.length === 0) {
      for (const line of lines) {
        const trimmed = line.replace(/^[-*]\s*/, '').trim()
        if (!trimmed) continue
        // Try "Item: Description" format
        let match = trimmed.match(/^(.+?):\s+(.+)$/)
        if (!match) {
          // Try "Item - Description" format
          match = trimmed.match(/^(.+?)\s+[-\u2013\u2014]\s+(.+)$/)
        }
        if (match) {
          newItems.push({
            id: crypto.randomUUID(),
            item: match[1].trim(),
            description: match[2].trim(),
            qty: 1,
            rate: 0,
            category: '',
          })
        } else {
          newItems.push({
            id: crypto.randomUUID(),
            item: trimmed,
            description: '',
            qty: 1,
            rate: 0,
            category: '',
          })
        }
      }
    }

    if (newItems.length > 0) {
      setInvoice(prev => ({
        ...prev,
        lineItems: [
          ...prev.lineItems.filter(li => li.item || li.description),
          ...newItems,
        ],
      }))
    }
    return newItems.length
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target.result
      localStorage.setItem('invoiceLogo', dataUrl)
      setLogo(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = () => {
    localStorage.removeItem('invoiceLogo')
    setLogo(null)
  }

  const saveInvoice = () => {
    const saved = JSON.parse(localStorage.getItem('savedInvoices') || '[]')
    const existing = saved.findIndex(s => s.id === invoice.id)
    const toSave = { ...invoice, savedAt: new Date().toISOString() }
    if (existing >= 0) {
      saved[existing] = toSave
    } else {
      saved.push(toSave)
    }
    localStorage.setItem('savedInvoices', JSON.stringify(saved))
    alert('Invoice saved!')
  }

  const loadInvoice = (inv) => {
    setInvoice(inv)
    setView('editor')
  }

  const newInvoice = () => {
    setInvoice(defaultInvoice())
  }

  const deleteInvoice = (id) => {
    const saved = JSON.parse(localStorage.getItem('savedInvoices') || '[]')
    const filtered = saved.filter(s => s.id !== id)
    localStorage.setItem('savedInvoices', JSON.stringify(filtered))
  }

  const subtotal = invoice.lineItems.reduce(
    (sum, li) => sum + (Number(li.qty) || 0) * (Number(li.rate) || 0),
    0
  )
  const taxAmount = subtotal * ((Number(invoice.taxRate) || 0) / 100)
  const total = subtotal + taxAmount

  if (view === 'saved') {
    return (
      <div className="app">
        <header className="app-header">
          <h1>Invoice Maker</h1>
          <div className="header-actions">
            <button className="btn-primary" onClick={() => setView('editor')}>
              Back to Editor
            </button>
          </div>
        </header>
        <SavedInvoices
          onLoad={loadInvoice}
          onDelete={deleteInvoice}
        />
        <footer className="app-footer">v1.0</footer>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Invoice Maker</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={newInvoice}>New Invoice</button>
          <button className="btn-secondary" onClick={() => setView('saved')}>
            Saved Invoices
          </button>
          <button className="btn-primary" onClick={saveInvoice}>Save</button>
        </div>
      </header>
      <div className="app-body">
        <div className="form-panel">
          <InvoiceForm
            invoice={invoice}
            logo={logo}
            categories={DEFAULT_CATEGORIES}
            onUpdateField={updateField}
            onUpdateLineItem={updateLineItem}
            onAddLineItem={addLineItem}
            onRemoveLineItem={removeLineItem}
            onLogoUpload={handleLogoUpload}
            onRemoveLogo={removeLogo}
            onImportMarkdown={importMarkdownItems}
          />
        </div>
        <div className="preview-panel">
          <InvoicePreview
            invoice={invoice}
            logo={logo}
            subtotal={subtotal}
            taxAmount={taxAmount}
            total={total}
          />
        </div>
      </div>
      <footer className="app-footer">v1.0</footer>
    </div>
  )
}
