import { useState, useCallback } from 'react'
import InvoiceForm from './components/InvoiceForm'
import InvoicePreview from './components/InvoicePreview'
import SavedInvoices from './components/SavedInvoices'
import SettingsModal from './components/SettingsModal'
import ChangelogModal from './components/ChangelogModal'
import Toast from './components/Toast'
import './App.css'

const APP_VERSION = '1.0.4'

const CHANGELOG = [
  {
    version: '1.0.4',
    date: '2026-03-15',
    changes: [
      'Compact mobile header with icon-only action buttons',
      'Preview button restyled with rounded top corners and bolder appearance',
      'Logo upload area redesigned: inline pill style, shows "Tap" on mobile',
      'Removed visual clutter from mobile top section',
    ],
  },
  {
    version: '1.0.3',
    date: '2026-03-15',
    changes: [
      'Soft-delete line items with Deleted Items recovery modal',
      'Mobile-responsive layout with full-screen preview modal',
      'Saved invoices actions replaced with icon buttons',
      'Download PDF button added to saved invoices list',
    ],
  },
  {
    version: '1.0.2',
    date: '2026-03-15',
    changes: [
      'Fixed PDF page breaks splitting table rows mid-content',
      'Added document type selector (Invoice / Estimate)',
      'PDF margins improved for cleaner multi-page output',
    ],
  },
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
  documentType: 'INVOICE',
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
  const [deletedItems, setDeletedItems] = useState([])
  const [showSettings, setShowSettings] = useState(false)
  const [showChangelog, setShowChangelog] = useState(false)
  const [showMobilePreview, setShowMobilePreview] = useState(false)
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
    const item = invoice.lineItems.find(li => li.id === id)
    if (item) {
      setDeletedItems(prev => [...prev, item])
    }
    setInvoice(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(li => li.id !== id),
    }))
  }

  const restoreLineItem = (id) => {
    const item = deletedItems.find(di => di.id === id)
    if (item) {
      setDeletedItems(prev => prev.filter(di => di.id !== id))
      setInvoice(prev => ({
        ...prev,
        lineItems: [...prev.lineItems, item],
      }))
      showToast('Item restored')
    }
  }

  const permanentlyDeleteItem = (id) => {
    setDeletedItems(prev => prev.filter(di => di.id !== id))
    showToast('Item permanently deleted', 'info')
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

  const exportPDFFromElement = async (element, inv) => {
    if (!element) return
    const html2pdf = (await import('html2pdf.js')).default
    const opt = {
      margin: [0.4, 0.4, 0.4, 0.4],
      filename: `${(inv.documentType || 'invoice').toLowerCase()}-${inv.invoiceNumber || 'draft'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css'] },
    }
    html2pdf().set(opt).from(element).save()
  }

  const handleExportPDF = async () => {
    const element = document.getElementById('invoice-preview-content')
    await exportPDFFromElement(element, invoice)
    showToast('PDF export started')
  }

  const handleDownloadSavedPDF = async (inv) => {
    // Temporarily render the invoice off-screen to generate PDF
    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.left = '-9999px'
    container.style.top = '0'
    container.style.width = '8.5in'
    document.body.appendChild(container)

    const { createRoot } = await import('react-dom/client')
    const root = createRoot(container)

    const invSubtotal = inv.lineItems.reduce(
      (sum, li) => sum + (Number(li.qty) || 0) * (Number(li.rate) || 0), 0
    )
    const invTax = invSubtotal * ((Number(inv.taxRate) || 0) / 100)
    const invTotal = invSubtotal + invTax

    await new Promise(resolve => {
      root.render(
        <InvoicePreview
          invoice={inv}
          logo={logo}
          subtotal={invSubtotal}
          taxAmount={invTax}
          total={invTotal}
        />
      )
      setTimeout(resolve, 100)
    })

    const element = container.querySelector('.invoice-preview')
    await exportPDFFromElement(element, inv)

    root.unmount()
    document.body.removeChild(container)
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
          onDownload={handleDownloadSavedPDF}
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
        <div className="header-actions desktop-only">
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
        <div className="header-actions mobile-only">
          <button className="btn-icon" onClick={() => setShowSettings(true)} title="Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
          <button className="btn-icon" onClick={newInvoice} title="New Invoice">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
          </button>
          <button className="btn-icon" onClick={() => setView('saved')} title="Saved Invoices">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          </button>
          <button className="btn-primary btn-small" onClick={saveInvoice}>Save</button>
        </div>
      </header>
      <div className="app-body">
        <div className="form-panel">
          <InvoiceForm
            invoice={invoice}
            logo={logo}
            categories={categories}
            deletedItems={deletedItems}
            onUpdateField={updateField}
            onUpdateLineItem={updateLineItem}
            onAddLineItem={addLineItem}
            onRemoveLineItem={removeLineItem}
            onRestoreItem={restoreLineItem}
            onPermanentDelete={permanentlyDeleteItem}
            onLogoUpload={handleLogoUpload}
            onRemoveLogo={removeLogo}
            onImportMarkdown={importMarkdownItems}
          />
        </div>
        <div className="preview-panel desktop-only">
          <InvoicePreview
            invoice={invoice}
            logo={logo}
            subtotal={subtotal}
            taxAmount={taxAmount}
            total={total}
          />
        </div>
      </div>

      {/* Mobile Preview Button */}
      <button
        className="mobile-preview-btn mobile-only"
        onClick={() => setShowMobilePreview(true)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        Preview &middot; ${total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
      </button>

      {/* Mobile Preview Modal */}
      {showMobilePreview && (
        <div className="mobile-preview-modal">
          <div className="mobile-preview-header">
            <button className="btn-secondary" onClick={() => setShowMobilePreview(false)}>
              Close
            </button>
            <span className="mobile-preview-title">Preview</span>
            <button className="btn-primary" onClick={() => { handleExportPDF(); setShowMobilePreview(false) }}>
              Export PDF
            </button>
          </div>
          <div className="mobile-preview-body">
            <InvoicePreview
              invoice={invoice}
              logo={logo}
              subtotal={subtotal}
              taxAmount={taxAmount}
              total={total}
            />
          </div>
        </div>
      )}
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
