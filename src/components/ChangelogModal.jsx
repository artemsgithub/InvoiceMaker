import './ChangelogModal.css'

export default function ChangelogModal({ changelog, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal changelog-modal" onClick={e => e.stopPropagation()}>
        <h3>Changelog</h3>

        <div className="changelog-list">
          {changelog.map((release) => (
            <div key={release.version} className="changelog-entry">
              <div className="changelog-header">
                <span className="changelog-version">v{release.version}</span>
                <span className="changelog-date">{release.date}</span>
              </div>
              <ul>
                {release.changes.map((change, i) => (
                  <li key={i}>{change}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
