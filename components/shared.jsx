/* Shared UI components + data */

/* ========== DATA ========== */
const APPS = [
  { id: 'rev-ops', name: 'Revenue Pulse', desc: 'Daily revenue breakdown by region, channel and product line', status: 'live', owner: 'data-team', updated: '2h ago', views: 1284, version: 'v4.2', icon: 'RP', preview: 'dashboard' },
  { id: 'supply', name: 'Supply Chain Risk', desc: 'Upstream supplier health with lead time anomalies flagged by Kai', status: 'live', owner: 'ops', updated: '6h ago', views: 842, version: 'v2.1', icon: 'SC', preview: 'chart' },
  { id: 'cohort', name: 'Cohort Explorer', desc: 'Retention waterfall with interactive segment picker and funnel', status: 'created', owner: 'me', updated: 'just now', views: 0, version: 'v0.1', icon: 'CE', preview: 'table' },
  { id: 'churn', name: 'Churn Simulator', desc: 'What-if model on pricing, tenure and support contacts', status: 'live', unbound: true, owner: 'growth', updated: '2d ago', views: 12, version: 'v1.0', icon: 'CS', preview: 'form' },
  { id: 'mkt-attr', name: 'Marketing Mix', desc: 'Multi-touch attribution with spend reallocation suggestions', status: 'live', owner: 'marketing', updated: '1d ago', views: 2104, version: 'v3.7', icon: 'MM', preview: 'mixed' },
  { id: 'invent', name: 'Inventory Heatmap', desc: 'Stock position across 142 SKUs × 38 warehouses', status: 'stopped', owner: 'ops', updated: '14m ago', views: 0, version: 'v1.3', icon: 'IH', preview: 'heat' },
  { id: 'ai-notes', name: 'Call Insights', desc: 'Summarize sales calls and surface objections', status: 'live', owner: 'sales', updated: '3d ago', views: 318, version: 'v1.5', icon: 'CI', preview: 'chat' },
  { id: 'fin-cov', name: 'Financial Covenants', desc: 'Track debt covenant ratios against thresholds', status: 'created', unbound: true, owner: 'finance', updated: '5d ago', views: 4, version: 'v0.4', icon: 'FC', preview: 'kpi' },
];

const DATA_SOURCES = [
  { id: 'snowflake.prod.orders', rows: '12.4M', updated: '12m ago', cols: 18 },
  { id: 'snowflake.prod.customers', rows: '842K', updated: '1h ago', cols: 24 },
  { id: 'bigquery.events.pageview', rows: '1.2B', updated: 'streaming', cols: 11 },
  { id: 'postgres.billing.invoices', rows: '324K', updated: '6h ago', cols: 14 },
  { id: 'salesforce.opportunities', rows: '28K', updated: '24m ago', cols: 41 },
];

/* ========== PRIMITIVES ========== */
const Badge = ({ status, children }) => {
  const map = {
    live: { cls: 'badge-live', label: 'Live' },
    created: { cls: 'badge-created', label: 'Created' },
    stopped: { cls: 'badge-stopped', label: 'Stopped' },
    draft: { cls: 'badge-draft', label: 'Draft' },
    unbound: { cls: 'badge-unbound', label: 'Unbound' },
    error: { cls: 'badge-error', label: 'Error' },
  };
  const s = map[status] || { cls: 'badge-draft', label: status };
  return <span className={`badge ${s.cls}`}><span className="dot" />{children || s.label}</span>;
};

const Avatar = ({ name, size = 24, color = 'oklch(0.75 0.08 55)' }) => {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="sb-user-avatar" style={{ width: size, height: size, fontSize: Math.round(size * 0.42), background: color }}>
      {initials}
    </div>
  );
};

const Sparkline = ({ seed = 1, color = 'var(--text-4)' }) => {
  // deterministic pseudo-random sparkline
  const vals = Array.from({ length: 14 }, (_, i) => {
    const x = Math.sin(seed * 9.1 + i * 1.3) * 0.5 + 0.5;
    return 4 + x * 12;
  });
  return (
    <div className="sparkline" aria-hidden>
      {vals.map((v, i) => <span key={i} style={{ height: v, background: color }} />)}
    </div>
  );
};

/* Mini previews shown on top of app cards */
const PreviewTile = ({ type, status }) => {
  // Unified muted mini-chart styles
  if (status === 'error') {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'var(--err-soft)', color: 'var(--err)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
        deployment failed
      </div>
    );
  }
  const shell = {
    position: 'absolute',
    inset: 12,
    border: '1px solid var(--border)',
    borderRadius: 8,
    background: 'var(--surface)',
    padding: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    overflow: 'hidden',
  };
  const bar = (w, h = 6) => ({ width: w, height: h, borderRadius: 3, background: 'var(--surface-3)' });
  const withUnboundOverlay = (content) => {
    if (status !== 'unbound') return content;
    return (
      <>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.5, filter: 'saturate(0.7)' }}>
          {content}
        </div>
        <div className="preview-stripe" style={{ opacity: 0.65 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'color-mix(in oklch, var(--warn-soft) 30%, transparent)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--warn)', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
          no data bound
        </div>
      </>
    );
  };

  if (type === 'dashboard' || type === 'kpi' || type === 'mixed' || type === 'chart') {
    return withUnboundOverlay(
      <div style={shell}>
        <div style={{ ...bar('40%', 7) }} />
        <div style={{ ...bar('62%', 5) }} />
        <div style={{ display: 'flex', gap: 5, marginTop: 2 }}>
          <div style={{ flex: 1, height: 16, borderRadius: 4, background: 'var(--surface-2)', border: '1px solid var(--border)' }} />
          <div style={{ flex: 1, height: 16, borderRadius: 4, background: 'var(--surface-2)', border: '1px solid var(--border)' }} />
          <div style={{ flex: 1, height: 16, borderRadius: 4, background: 'var(--surface-2)', border: '1px solid var(--border)' }} />
        </div>
        <div style={{ flex: 1, borderRadius: 6, border: '1px dashed var(--border-strong)', background: 'var(--surface-2)', display: 'flex', alignItems: 'flex-end', gap: 3, padding: '6px 6px 4px' }}>
          {[16, 26, 20, 30, 24, 34, 28, 36, 29].map((h, i) => (
            <div key={i} style={{ flex: 1, height: h, borderRadius: '2px 2px 0 0', background: 'var(--surface-3)' }} />
          ))}
        </div>
      </div>
    );
  }

  if (type === 'table') {
    return withUnboundOverlay(
      <div style={shell}>
        <div style={{ ...bar('34%', 7) }} />
        <div style={{ ...bar('56%', 5) }} />
        <div style={{ marginTop: 2, borderRadius: 6, border: '1px solid var(--border)', overflow: 'hidden' }}>
          {[0, 1, 2, 3].map((row) => (
            <div key={row} style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 0.6fr', gap: 4, padding: '4px 6px', borderBottom: row < 3 ? '1px solid var(--border)' : 'none', background: row === 0 ? 'var(--surface-2)' : 'var(--surface)' }}>
              <div style={{ ...bar('80%', 5) }} />
              <div style={{ ...bar('72%', 5) }} />
              <div style={{ ...bar('60%', 5) }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'form') {
    return withUnboundOverlay(
      <div style={shell}>
        <div style={{ ...bar('36%', 7) }} />
        <div style={{ ...bar('58%', 5) }} />
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ marginTop: i === 0 ? 2 : 0 }}>
            <div style={{ ...bar('24%', 5), marginBottom: 3 }} />
            <div style={{ height: 14, borderRadius: 4, border: '1px solid var(--border)', background: 'var(--surface-2)' }} />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'heat') {
    return withUnboundOverlay(
      <div style={shell}>
        <div style={{ ...bar('42%', 7) }} />
        <div style={{ ...bar('54%', 5) }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 2, marginTop: 2 }}>
          {Array.from({ length: 32 }).map((_, i) => (
            <div key={i} style={{ height: 8, borderRadius: 2, background: i % 5 === 0 ? 'var(--surface-3)' : 'var(--surface-2)', border: '1px solid var(--border)' }} />
          ))}
        </div>
      </div>
    );
  }

  if (type === 'chat') {
    return withUnboundOverlay(
      <div style={shell}>
        <div style={{ ...bar('32%', 7) }} />
        <div style={{ ...bar('50%', 5) }} />
        <div style={{ marginTop: 2, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ width: '66%', height: 11, borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--border)' }} />
          <div style={{ width: '56%', height: 11, borderRadius: 6, background: 'var(--surface-3)', marginLeft: 'auto', border: '1px solid var(--border)' }} />
          <div style={{ width: '74%', height: 14, borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--border)' }} />
          <div style={{ width: '48%', height: 11, borderRadius: 6, background: 'var(--surface-3)', marginLeft: 'auto', border: '1px solid var(--border)' }} />
        </div>
      </div>
    );
  }

  return withUnboundOverlay(<div className="preview-stripe" />);
};

/* Main sidebar */
const Sidebar = ({ route, navigate, detailTab, setDetailTab, app }) => {
  const [flowsOpen, setFlowsOpen] = React.useState(false);

  if (route.startsWith('detail') || route.startsWith('builder')) {
    return (
      <aside className="sidebar">
        <div className="builder-context">
          <button className="builder-back-link" onClick={() => navigate('directory')}>
            {I.chevronLeft}
            <span>Back to Data Apps</span>
          </button>
          {app && (
            <div className="builder-app-row">
              <div className="builder-app-icon">{app.icon}</div>
              <div style={{ minWidth: 0 }}>
                <div className="builder-app-name">{app.name}</div>
                <div className="builder-app-desc">{app.desc}</div>
              </div>
            </div>
          )}
        </div>
        <div className="sb-section">
          {[
            { id: 'overview', label: 'Overview', icon: I.eye },
            { id: 'analytics', label: 'Analytics', count: '1.2K' },
            { id: 'deployments', label: 'Deployments', count: 12 },
            { id: 'data', label: 'Data', count: 3 },
            { id: 'logs', label: 'Logs' },
            { id: 'settings', label: 'Settings' },
          ].map(t => (
            <div key={t.id} className={`sb-item ${detailTab === t.id ? 'active' : ''}`} onClick={() => setDetailTab(t.id)}>
              <span>{t.icon}</span>{t.label}
              {t.count && <span className="sb-count">{t.count}</span>}
            </div>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      <div className="sb-nav">
        <div className="sb-item"><span>{I.home}</span>Dashboard</div>
        <div className={`sb-item sb-item-expand ${flowsOpen ? 'expanded' : ''}`} onClick={() => setFlowsOpen(o => !o)}>
          <span>{I.flow}</span>Flows
          <span className="sb-expand-icon">{I.chevronRight}</span>
        </div>
        {flowsOpen && (
          <div className="sb-sub-items">
            <div className="sb-sub-item">Flows</div>
            <div className="sb-sub-item">Conditional Flows</div>
          </div>
        )}
        <div className="sb-item"><span>{I.database}</span>Storage</div>
        <div className={`sb-item ${route.startsWith('directory') || route.startsWith('builder') || route.startsWith('detail') ? 'active' : ''}`}
             onClick={() => navigate('directory')}>
          <span>{I.apps}</span>Data Apps
        </div>
        <div className="sb-item"><span>{I.components}</span>Components</div>
        <div className="sb-item"><span>{I.workspaces}</span>Workspaces</div>
        <div className="sb-item"><span>{I.code}</span>Transformations</div>
        <div className="sb-item"><span>{I.catalog}</span>Data Catalog</div>
        <div className="sb-item"><span>{I.clock}</span>Jobs</div>
        <div className="sb-item">
          <span>{I.lineage}</span>Lineage
          <span className="sb-badge-beta">Beta</span>
        </div>
        <div className="sb-item"><span>{I.vault}</span>Vault</div>
        <div className="sb-item"><span>{I.trash}</span>Trash</div>
      </div>
      <div className="sb-bottom">
        <div className="sb-item sb-support"><span>{I.heartComment}</span>Support &amp; Feedback</div>
        <button className="sb-collapse-btn" title="Collapse sidebar">{I.sidebarCollapse}</button>
      </div>
    </aside>
  );
};

const ChatPanel = ({ onClose }) => (
  <div className="chat-panel">
    <div className="chat-panel-header">
      <div>
        <div className="chat-panel-title">Kai</div>
        <div className="chat-panel-sub">Ask Kai anything about your apps.</div>
      </div>
      <button className="btn btn-ghost btn-sm" onClick={onClose}>{I.close}</button>
    </div>
    <div className="chat-panel-content">
      <div className="chat-message kai">
        <div className="chat-message-avatar">K</div>
        <div>
          <div className="chat-message-title">Kai</div>
          <div className="chat-message-text">I can help you find apps, analyze filters, or suggest the next dashboard component.</div>
        </div>
      </div>
      <div className="chat-message user">
        <div className="chat-message-avatar user">JN</div>
        <div>
          <div className="chat-message-title">You</div>
          <div className="chat-message-text">Show me apps owned by growth with live status.</div>
        </div>
      </div>
    </div>
    <div className="chat-panel-input">
      <input placeholder="Ask Kai…" />
      <button className="btn btn-accent btn-sm">Send</button>
    </div>
  </div>
);

const Navbar = ({ view, isKaiOpen, onKaiToggle }) => {
  const [openMenu, setOpenMenu] = React.useState(null);
  const [organization, setOrganization] = React.useState('Active Organization');
  const [project, setProject] = React.useState('Active Project');
  const [environment, setEnvironment] = React.useState('Production');

  const menuData = {
    organization: ['Active Organization', 'Keboola Labs', 'Keboola Studio'],
    project: ['Active Project', 'Reporting Suite', 'Ops Workspace'],
    environment: ['Production', 'Staging', 'Sandbox'],
  };

  const handleToggle = (menuKey) => {
    setOpenMenu(openMenu === menuKey ? null : menuKey);
  };

  const handleSelect = (menuKey, value) => {
    if (menuKey === 'organization') setOrganization(value);
    if (menuKey === 'project') setProject(value);
    if (menuKey === 'environment') setEnvironment(value);
    setOpenMenu(null);
  };

  return (
    <div className="navbar">
      <div className="navbar-left">
        {/* Keboola Logo */}
        <div className="navbar-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill="#1E2235"/>
            <circle cx="14" cy="10" r="3.5" fill="#6B3FFB"/>
            <path d="M7 20c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="#6B3FFB" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="8" cy="16" r="1.5" fill="#4ECDC4"/>
            <circle cx="20" cy="16" r="1.5" fill="#4ECDC4"/>
            <circle cx="14" cy="21" r="1.5" fill="#4ECDC4"/>
          </svg>
        </div>

        <div className="navbar-context-row">
          {/* Organization */}
          <div className="navbar-context-item">
            <button className="navbar-context-pill" onClick={() => handleToggle('organization')}>
              <span className="navbar-pill-icon navbar-pill-icon--org">{I.building}</span>
              <span className="navbar-pill-text">{organization}</span>
              <span className="navbar-pill-chevron">{I.chevronDown}</span>
            </button>
            {openMenu === 'organization' && (
              <div className="navbar-dropdown">
                {menuData.organization.map(item => (
                  <button key={item} className="navbar-dropdown-item" onClick={() => handleSelect('organization', item)}>{item}</button>
                ))}
              </div>
            )}
          </div>

          <span className="navbar-ctx-sep">/</span>

          {/* Project */}
          <div className="navbar-context-item">
            <button className="navbar-context-pill" onClick={() => handleToggle('project')}>
              <span className="navbar-pill-icon navbar-pill-icon--project">{I.diamond}</span>
              <span className="navbar-pill-text">{project}</span>
              <span className="navbar-pill-chevron">{I.chevronDown}</span>
            </button>
            {openMenu === 'project' && (
              <div className="navbar-dropdown">
                {menuData.project.map(item => (
                  <button key={item} className="navbar-dropdown-item" onClick={() => handleSelect('project', item)}>{item}</button>
                ))}
              </div>
            )}
          </div>

          <span className="navbar-ctx-sep">/</span>

          {/* Environment */}
          <div className="navbar-context-item">
            <button className="navbar-context-pill" onClick={() => handleToggle('environment')}>
              <span className="navbar-pill-icon navbar-pill-icon--env">{I.sphere}</span>
              <span className="navbar-pill-text">{environment}</span>
              <span className="navbar-pill-chevron">{I.chevronDown}</span>
            </button>
            {openMenu === 'environment' && (
              <div className="navbar-dropdown">
                {menuData.environment.map(item => (
                  <button key={item} className="navbar-dropdown-item" onClick={() => handleSelect('environment', item)}>{item}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="navbar-actions">
        {/* Search */}
        <button className="btn btn-ghost btn-icon btn-sm navbar-icon-btn">{I.search}</button>

        {/* Notifications */}
        <button className="btn btn-ghost btn-icon btn-sm navbar-icon-btn navbar-notif">
          {I.bell}
          <span className="navbar-notif-badge">8</span>
        </button>

        {/* Kai Assistant */}
        {view !== 'builder' && (
          <button className={`btn btn-kai-nav btn-sm ${isKaiOpen ? 'active' : ''}`} onClick={onKaiToggle}>
            <span style={{ display: 'flex' }}>{I.sparkle}</span>
            Kai Assistant
            <span className="badge-beta-pill">Beta</span>
          </button>
        )}

        {/* User avatar */}
        <button className="navbar-avatar-btn">
          <div className="navbar-user-avatar">JN</div>
        </button>
      </div>
    </div>
  );
};

/* Small button */
const Btn = ({ variant = 'outline', size, icon, iconRight, children, ...rest }) => (
  <button className={`btn btn-${variant}${size ? ` btn-${size}` : ''}${!children ? ' btn-icon' : ''}`} {...rest}>
    {icon && <span style={{ display: 'flex' }}>{icon}</span>}
    {children}
    {iconRight && <span style={{ display: 'flex' }}>{iconRight}</span>}
  </button>
);

Object.assign(window, { APPS, DATA_SOURCES, Badge, Avatar, Sparkline, PreviewTile, Sidebar, Navbar, Btn });
