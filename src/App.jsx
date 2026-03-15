import { useState } from 'react'
import InvoiceForm from './components/InvoiceForm'
import InvoicePreview from './components/InvoicePreview'
import SavedInvoices from './components/SavedInvoices'
import './App.css'

const emptyLineItem = () => ({
  id: crypto.randomUUID(),
  item: '',
  description: '',
  qty: 1,
  rate: 0,
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
            onUpdateField={updateField}
            onUpdateLineItem={updateLineItem}
            onAddLineItem={addLineItem}
            onRemoveLineItem={removeLineItem}
            onLogoUpload={handleLogoUpload}
            onRemoveLogo={removeLogo}
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
    </div>
  )
}
