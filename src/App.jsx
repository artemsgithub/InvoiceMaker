import { useState, useCallback } from 'react'
import InvoiceForm from './components/InvoiceForm'
import InvoicePreview from './components/InvoicePreview'
import SavedInvoices from './components/SavedInvoices'
import SettingsModal from './components/SettingsModal'
import ChangelogModal from './components/ChangelogModal'
import Toast from './components/Toast'
import './App.css'

const APP_VERSION = '1.0.1'

const CHANGELOG = [
  {
    version: '1.0.1',
    date: '2026-03-15',
    changes: [
      'Export PDF button moved inline with header actions',
      'Settings modal with custom category management',
      'In-app toast notifications replace browser alerts',
      'Clickable version badge with changelog',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-03-15',
    changes: [
      'Initial release',
      'Invoice creation with live preview',
      'PDF export via html2pdf.js',
      'Logo upload saved to localStorage',
      'Save & load invoice drafts',
      'Markdown paste to populate line items',
      'Category assignment for line items',
      'Configurable tax rate',
    ],
  },
]

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
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('invoiceCategories')
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES
  })
  const [showSettings, setShowSettings] = useState(false)
  const [showChangelog, setShowChangelog] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
  }, [])

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
        let match = trimmed.match(/^(.+?):\s+(.+)$/)
        if (!match) {
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
    showToast('Invoice saved successfully')
  }

  const loadInvoice = (inv) => {
    setInvoice(inv)
    setView('editor')
    showToast('Invoice loaded')
  }

  const newInvoice = () => {
    setInvoice(defaultInvoice())
  }

  const deleteInvoice = (id) => {
    const saved = JSON.parse(localStorage.getItem('savedInvoices') || '[]')
    const filtered = saved.filter(s => s.id !== id)
    localStorage.setItem('savedInvoices', JSON.stringify(filtered))
    showToast('Invoice deleted', 'info')
  }

  const handleSaveCategories = (newCategories) => {
    setCategories(newCategories)
    localStorage.setItem('invoiceCategories', JSON.stringify(newCategories))
    showToast('Categories updated')
  }

  const handleExportPDF = async () => {
    const element = document.getElementById('invoice-preview-content')
    if (!element) return
    const html2pdf = (await import('html2pdf.js')).default
    const opt = {
      margin: 0,
      filename: `invoice-${invoice.invoiceNumber || 'draft'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    }
    html2pdf().set(opt).from(element).save()
    showToast('PDF export started')
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
            <button className="btn-icon" onClick={() => setShowSettings(true)} title="Settings">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
            <button className="btn-primary" onClick={() => setView('editor')}>
              Back to Editor
            </button>
          </div>
        </header>
        <SavedInvoices
          onLoad={loadInvoice}
          onDelete={deleteInvoice}
        />
        <footer className="app-footer">
          <button className="version-btn" onClick={() => setShowChangelog(true)}>
            v{APP_VERSION}
          </button>
        </footer>
        {showSettings && (
          <SettingsModal
            categories={categories}
            onSave={handleSaveCategories}
            onClose={() => setShowSettings(false)}
          />
        )}
        {showChangelog && (
          <ChangelogModal
            changelog={CHANGELOG}
            onClose={() => setShowChangelog(false)}
          />
        )}
        {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Invoice Maker</h1>
        <div className="header-actions">
          <button className="btn-icon" onClick={() => setShowSettings(true)} title="Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
          <button className="btn-secondary" onClick={newInvoice}>New Invoice</button>
          <button className="btn-secondary" onClick={() => setView('saved')}>
            Saved Invoices
          </button>
          <button className="btn-primary" onClick={saveInvoice}>Save</button>
          <button className="btn-primary" onClick={handleExportPDF}>Export PDF</button>
        </div>
      </header>
      <div className="app-body">
        <div className="form-panel">
          <InvoiceForm
            invoice={invoice}
            logo={logo}
            categories={categories}
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
      <footer className="app-footer">
        <button className="version-btn" onClick={() => setShowChangelog(true)}>
          v{APP_VERSION}
        </button>
      </footer>
      {showSettings && (
        <SettingsModal
          categories={categories}
          onSave={handleSaveCategories}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showChangelog && (
        <ChangelogModal
          changelog={CHANGELOG}
          onClose={() => setShowChangelog(false)}
        />
      )}
      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  )
}
