/* Directory (listing) page */

const Directory = ({ navigate }) => {
  const [view, setView] = React.useState('grid');
  const [query, setQuery] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState(null);
  const [filterUnboundOnly, setFilterUnboundOnly] = React.useState(false);
  const [selectedOwners, setSelectedOwners] = React.useState([]);
  const [selectedTags, setSelectedTags] = React.useState([]);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [sortOpen, setSortOpen] = React.useState(false);
  const [sortBy, setSortBy] = React.useState('updated_desc');
  const [showCreate, setShowCreate] = React.useState(false);
  const [showGitConnect, setShowGitConnect] = React.useState(false);
  const [showEmpty, setShowEmpty] = React.useState(false);

  const ownerOptions = React.useMemo(() => Array.from(new Set(APPS.map(a => a.owner))), []);
  const tagMap = {
    dashboard: 'Dashboard', chart: 'Dashboard', kpi: 'Dashboard', mixed: 'Dashboard',
    chat: 'AI tool', form: 'Form', heat: 'Simulator', table: 'Workflow',
  };
  const tagOptions = React.useMemo(() => Array.from(new Set(APPS.map(a => tagMap[a.preview] || 'Dashboard'))), []);

  const sortOptions = React.useMemo(() => ([
    { id: 'updated_desc', label: 'Recently updated' },
    { id: 'updated_asc', label: 'Least recently updated' },
    { id: 'name_asc', label: 'Name (A-Z)' },
    { id: 'name_desc', label: 'Name (Z-A)' },
    { id: 'views_desc', label: 'Most viewed' },
    { id: 'views_asc', label: 'Least viewed' },
  ]), []);

  const parseUpdatedToMinutes = React.useCallback((value) => {
    const text = (value || '').toLowerCase().trim();
    if (!text || text === 'just now') return 0;

    const m = text.match(/(\d+)\s*([mhd])/);
    if (!m) return Number.MAX_SAFE_INTEGER;

    const amount = Number(m[1]);
    const unit = m[2];
    if (unit === 'm') return amount;
    if (unit === 'h') return amount * 60;
    if (unit === 'd') return amount * 60 * 24;
    return Number.MAX_SAFE_INTEGER;
  }, []);

  const getAppSignals = React.useCallback((app) => {
    const isUnbound = !!app.unbound;
    const lifecycle = app.status;
    const previewStatus = isUnbound ? 'unbound' : (app.previewStatus || app.status);
    return { lifecycle, isUnbound, previewStatus };
  }, []);

  const lifecycleCounts = React.useMemo(() => {
    const counts = { live: 0, created: 0, stopped: 0 };
    APPS.forEach((app) => {
      const { lifecycle } = getAppSignals(app);
      if (counts[lifecycle] != null) counts[lifecycle] += 1;
    });
    return counts;
  }, [getAppSignals]);

  const unboundCount = React.useMemo(() => APPS.filter(a => getAppSignals(a).isUnbound).length, [getAppSignals]);

  const list = React.useMemo(() => {
    let xs = APPS;
    if (query) xs = xs.filter(a => a.name.toLowerCase().includes(query.toLowerCase()) || a.desc.toLowerCase().includes(query.toLowerCase()));
    if (filterStatus) xs = xs.filter(a => getAppSignals(a).lifecycle === filterStatus);
    if (filterUnboundOnly) xs = xs.filter(a => getAppSignals(a).isUnbound);
    if (selectedOwners.length > 0) xs = xs.filter(a => selectedOwners.includes(a.owner));
    if (selectedTags.length > 0) xs = xs.filter(a => selectedTags.includes(tagMap[a.preview] || 'Dashboard'));

    const sorted = [...xs];
    sorted.sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
      if (sortBy === 'views_desc') return b.views - a.views;
      if (sortBy === 'views_asc') return a.views - b.views;

      const aMinutes = parseUpdatedToMinutes(a.updated);
      const bMinutes = parseUpdatedToMinutes(b.updated);
      if (sortBy === 'updated_asc') return bMinutes - aMinutes;
      return aMinutes - bMinutes;
    });

    return sorted;
  }, [query, filterStatus, filterUnboundOnly, selectedOwners, selectedTags, sortBy, parseUpdatedToMinutes, getAppSignals]);

  const showEmptyList = showEmpty || list.length === 0;

  return (
    <>
      <div className="topbar">
        <div className="crumbs">
          <span>Workspace</span>
          <span className="c-sep">/</span>
          <span className="c-cur">Data Apps</span>
        </div>
      </div>

      <div className="content">
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>Data Apps</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-2)', fontSize: 13, maxWidth: 620 }}>
              Interactive apps built on top of your storage tables. Share a URL, embed in Notion, or deliver to stakeholders — no infrastructure to manage.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="primary" size="sm" icon={I.plus} onClick={() => setShowCreate(true)}>New Data App</Btn>
          </div>
        </div>

        <div className="dir-toolbar">
          <div className="input-group search">
            {I.search}
            <input placeholder="Search apps, owners, tables…" value={query} onChange={e => setQuery(e.target.value)} />
            <span className="kbd">⌘K</span>
          </div>
          <div style={{ width: 1, background: 'var(--border)', height: 20, margin: '0 4px' }} />
          <button className={`filter-chip ${filterStatus === 'live' ? 'active' : ''}`} onClick={() => setFilterStatus(filterStatus === 'live' ? null : 'live')}>
            <span className="dot" style={{ background: 'var(--live)', width: 6, height: 6, borderRadius: '50%' }} />
            Live <span className="mono" style={{ color: 'var(--text-3)' }}>{lifecycleCounts.live}</span>
          </button>
          <button className={`filter-chip ${filterStatus === 'created' ? 'active' : ''}`} onClick={() => setFilterStatus(filterStatus === 'created' ? null : 'created')}>
            <span className="dot" style={{ background: 'var(--accent)', width: 6, height: 6, borderRadius: '50%' }} />
            Created <span className="mono" style={{ color: 'var(--text-3)' }}>{lifecycleCounts.created}</span>
          </button>
          <button className={`filter-chip ${filterStatus === 'stopped' ? 'active' : ''}`} onClick={() => setFilterStatus(filterStatus === 'stopped' ? null : 'stopped')}>
            <span className="dot" style={{ background: 'var(--text-3)', width: 6, height: 6, borderRadius: '50%' }} />
            Stopped <span className="mono" style={{ color: 'var(--text-3)' }}>{lifecycleCounts.stopped}</span>
          </button>
          <div className="dir-filter-divider" />
          <button className={`filter-chip ${filterUnboundOnly ? 'active' : ''}`} onClick={() => setFilterUnboundOnly(v => !v)}>
            <span className="dot" style={{ background: 'var(--warn)', width: 6, height: 6, borderRadius: '50%' }} />
            Unbound <span className="mono" style={{ color: 'var(--text-3)' }}>{unboundCount}</span>
          </button>
          <div className="filter-dropdown-wrapper">
            <button
              className={`filter-chip ${filtersOpen ? 'active' : ''}`}
              onClick={() => {
                setFiltersOpen(open => !open);
                setSortOpen(false);
              }}
            >
              {I.filter} Filters <span style={{ marginLeft: 2 }}>{I.chevronDown}</span>
            </button>
            {filtersOpen && (
              <div className="toolbar-dropdown">
                <div className="toolbar-dropdown-section">
                  <div className="toolbar-dropdown-title">Owner</div>
                  {ownerOptions.map(owner => {
                    const active = selectedOwners.includes(owner);
                    return (
                      <button
                        key={owner}
                        className={`toolbar-dropdown-item ${active ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedOwners(prev => prev.includes(owner)
                            ? prev.filter(v => v !== owner)
                            : [...prev, owner]
                          );
                        }}
                      >
                        {owner}
                      </button>
                    );
                  })}
                </div>
                <div className="toolbar-dropdown-section">
                  <div className="toolbar-dropdown-title">Tag</div>
                  {tagOptions.map(tag => {
                    const active = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        className={`toolbar-dropdown-item ${active ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedTags(prev => prev.includes(tag)
                            ? prev.filter(v => v !== tag)
                            : [...prev, tag]
                          );
                        }}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="filter-dropdown-wrapper">
              <button
                className={`filter-chip ${sortOpen ? 'active' : ''}`}
                onClick={() => {
                  setSortOpen(open => !open);
                  setFiltersOpen(false);
                }}
              >
                Sort: {sortOptions.find(opt => opt.id === sortBy)?.label || 'Recently updated'} {I.chevronDown}
              </button>
              {sortOpen && (
                <div className="toolbar-dropdown">
                  <div className="toolbar-dropdown-title">Sort by</div>
                  {sortOptions.map(option => (
                    <button
                      key={option.id}
                      className={`toolbar-dropdown-item ${sortBy === option.id ? 'active' : ''}`}
                      onClick={() => {
                        setSortBy(option.id);
                        setSortOpen(false);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="view-toggle">
              <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')} title="Grid view">{I.grid}</button>
              <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')} title="List view">{I.list}</button>
            </div>
          </div>
        </div>

        {showEmptyList ? (
          <EmptyState onCreate={() => setShowCreate(true)} />
        ) : view === 'grid' ? (
          <div className="app-grid">
            {list.map(a => {
              const { lifecycle, isUnbound, previewStatus } = getAppSignals(a);
              return <AppCard key={a.id} app={a} lifecycle={lifecycle} isUnbound={isUnbound} previewStatus={previewStatus} onOpen={() => navigate('detail:' + a.id)} onEdit={() => navigate('builder:' + a.id)} />;
            })}
          </div>
        ) : (
          <AppList list={list} navigate={navigate} getAppSignals={getAppSignals} />
        )}

        <div style={{ marginTop: 30, display: 'flex', gap: 8 }}>
          <button className="filter-chip" onClick={() => setShowEmpty(!showEmpty)}>
            {showEmpty ? 'Show apps' : 'Preview empty state'}
          </button>
        </div>
      </div>

      {showCreate && (
        <CreateFlow
          onClose={() => setShowCreate(false)}
          onPick={(mode) => {
            setShowCreate(false);
            if (mode === 'scratch:git') {
              setShowGitConnect(true);
              return;
            }
            navigate('builder:new:' + mode);
          }}
        />
      )}
      {showGitConnect && (
        <ConnectGitModal
          onClose={() => setShowGitConnect(false)}
          onContinue={() => {
            setShowGitConnect(false);
            navigate('builder:new:scratch:git');
          }}
        />
      )}
    </>
  );
};

const AppCard = ({ app, lifecycle, isUnbound, previewStatus, onOpen, onEdit }) => (
  <div className="app-card" onClick={onOpen}>
    <div className="app-card-preview">
      <PreviewTile type={app.preview} status={previewStatus} />
      <div className="app-card-status-stack">
        <Badge status={lifecycle}>
          {lifecycle === 'created' ? 'Created' : lifecycle === 'stopped' ? 'Stopped' : 'Live'}
        </Badge>
        {isUnbound && <span className="app-card-condition">Unbound</span>}
      </div>
    </div>
    <div className="app-card-overlay" aria-hidden="true">
      <button
        className="btn btn-primary btn-sm app-card-open-btn"
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
      >
        Open
      </button>
    </div>
    <div className="app-card-body">
      <div className="app-card-title-row">
        <div>
          <div className="app-card-title">{app.name}</div>
        </div>
        <button className="btn-ghost" style={{ padding: 3, borderRadius: 4, color: 'var(--text-3)' }} onClick={e => { e.stopPropagation(); }}>
          {I.more}
        </button>
      </div>
      <div className="app-card-desc">{app.desc}</div>
      <div className="app-card-meta">
        <span>{app.version}</span>
        <span className="dot-sep" />
        <span>{app.updated}</span>
        <span className="dot-sep" />
        <span>{app.views.toLocaleString()} views</span>
        <Sparkline seed={app.id.length} color={lifecycle === 'live' ? 'var(--accent)' : 'var(--text-4)'} />
      </div>
    </div>
  </div>
);

const AppList = ({ list, navigate, getAppSignals }) => (
  <div className="app-list">
    <div className="app-row header">
      <div></div>
      <div>Name</div>
      <div>Status</div>
      <div>Primary source</div>
      <div>Owner</div>
      <div>Views · 7d</div>
      <div>Updated</div>
      <div></div>
    </div>
    {list.map(a => (
      <div key={a.id} className="app-row" onClick={() => navigate('detail:' + a.id)}>
        <div className="app-row-icon">{a.icon}</div>
        <div>
          <div className="app-row-name">{a.name}</div>
          <div className="app-row-desc">{a.desc}</div>
        </div>
        <div>
          <Badge status={getAppSignals(a).lifecycle}>
            {getAppSignals(a).lifecycle === 'created' ? 'Created' : getAppSignals(a).lifecycle === 'stopped' ? 'Stopped' : 'Live'}
          </Badge>
          {getAppSignals(a).isUnbound && <span className="app-list-condition">Unbound</span>}
        </div>
        <div className="mono" style={{ fontSize: 11.5, color: 'var(--text-2)' }}>
          {getAppSignals(a).isUnbound ? <span style={{ color: 'var(--warn)' }}>— not bound —</span> : ['snowflake.prod.orders','snowflake.prod.customers','bigquery.events','postgres.invoices','salesforce.opps'][a.id.length % 5]}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{a.owner}</div>
        <div className="mono" style={{ fontSize: 11.5 }}>{a.views.toLocaleString()}</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{a.updated}</div>
        <div><button className="btn-ghost" style={{ padding: 3, borderRadius: 4, color: 'var(--text-3)' }} onClick={e => e.stopPropagation()}>{I.more}</button></div>
      </div>
    ))}
  </div>
);

const EmptyState = ({ onCreate }) => (
  <div className="empty">
    <div className="empty-icon">{I.apps}</div>
    <div className="empty-title">No Data Apps here yet</div>
    <div className="empty-desc">
      Data Apps turn any storage table into something your team can actually click on — a dashboard, a simulator, a guided tool. Start by describing what you need to Kai.
    </div>
    <div className="empty-actions">
      <Btn variant="accent" icon={I.kai} onClick={onCreate}>Build with Kai</Btn>
      <Btn variant="outline" icon={I.template} onClick={onCreate}>Browse templates</Btn>
      <Btn variant="ghost" icon={I.blank} onClick={onCreate}>Start from scratch</Btn>
    </div>
  </div>
);

/* Create flow — 3 paths modal */
const CreateFlow = ({ onClose, onPick }) => {
  const [prompt, setPrompt] = React.useState('');
  const [stage, setStage] = React.useState('start');

  const templates = [
    { id: 'revenue-pulse', title: 'Revenue Pulse', desc: 'Weekly revenue insights with region and YoY analysis.' },
    { id: 'cohort-analysis', title: 'Cohort Analysis', desc: 'Track retention and growth by cohort over time.' },
    { id: 'support-ops', title: 'Support Ops', desc: 'Agent performance, ticket volume and SLA health.' },
  ];

  const chooseTemplate = (templateId) => {
    onPick(`template:${templateId}`);
  };

  const chooseScratch = (mode) => {
    onPick(`scratch:${mode}`);
  };

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" style={{ width: 720 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Create a Data App</div>
            <div className="modal-sub">Describe it, pick a template, or start blank.</div>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ padding: 4, borderRadius: 4 }}>{I.close}</button>
        </div>
        <div className="modal-body">
          {stage === 'start' ? (
            <>
              <div style={{ marginBottom: 18 }}>
                <div className="chat-box" style={{ borderColor: 'var(--accent-soft-border)' }}>
                  <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="Describe the app you need. e.g. “A weekly revenue dashboard with a region filter and a YoY chart, built on snowflake.prod.orders.”"
                    style={{ minHeight: 72 }}
                  />
                  <div className="chat-box-footer">
                    <button className="btn-ghost btn-sm" style={{ fontSize: 11 }}>{I.database} Attach table</button>
                    <button className="btn-ghost btn-sm" style={{ fontSize: 11 }}>{I.template} Reference app</button>
                    <div style={{ marginLeft: 'auto' }}>
                      <Btn variant="accent" size="sm" icon={I.arrow} onClick={() => onPick('ai')} disabled={!prompt.trim()}>
                        Build with Kai
                      </Btn>
                    </div>
                  </div>
                </div>
                <div className="chat-suggest">
                  <button className="chat-suggest-chip" onClick={() => setPrompt('Executive dashboard with weekly revenue, top 10 customers, and an anomaly feed.')}>Executive dashboard</button>
                  <button className="chat-suggest-chip" onClick={() => setPrompt('A what-if churn simulator driven by pricing, tenure, support contact, and MRR.')}>Simulator</button>
                  <button className="chat-suggest-chip" onClick={() => setPrompt('Internal tool that lets account managers reassign accounts and log the change.')}>Internal tool</button>
                  <button className="chat-suggest-chip" onClick={() => setPrompt('Sales call summarizer — paste a transcript, get objections and next steps.')}>AI app</button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>or start another way</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="create-path" onClick={() => setStage('templates')}>
                  <div className="path-icon">{I.template}</div>
                  <h4>From a template</h4>
                  <p>24 vetted starting points — cohort analysis, forecast, supplier scoring, internal review tools.</p>
                  <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                    {['Cohort', 'KPI tree', 'Forecast', '+21'].map((t, i) => (
                      <span key={i} className="badge badge-outline" style={{ fontSize: 10 }}>{t}</span>
                    ))}
                  </div>
                </div>
                <div className="create-path" onClick={() => setStage('scratch')}>
                  <div className="path-icon">{I.blank}</div>
                  <h4>From scratch</h4>
                  <p>Blank canvas with the page definition editor open. Best when you know exactly what you want and prefer to compose blocks by hand.</p>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                    Header · KPI Row · Chart · Table · Filter · Form · Markdown · Custom React
                  </div>
                </div>
              </div>

              <div className="reason-card" style={{ marginTop: 18 }}>
                <strong>Why three paths?</strong> Most people start with a rough idea, not a spec — so prompt-first is primary.
                Templates skip the cold start when a known shape fits. Scratch exists for power users editing the page definition directly.
                Same underlying format, different on-ramps.
              </div>
            </>
          ) : stage === 'templates' ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
                <button className="btn-ghost btn-sm" onClick={() => setStage('start')}>
                  {I.chevronLeft} Back
                </button>
                <div>
                  <div className="modal-title">Choose a template</div>
                  <div className="modal-sub">Pick the starting shape before the builder opens.</div>
                </div>
                <div style={{ width: 32 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {templates.map(t => (
                  <div key={t.id} className="create-path" onClick={() => chooseTemplate(t.id)}>
                    <div className="path-icon">{I.template}</div>
                    <h4>{t.title}</h4>
                    <p>{t.desc}</p>
                    <div style={{ marginTop: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span className="badge badge-outline">Preview</span>
                      <span className="badge badge-outline">Editable</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
                <button className="btn-ghost btn-sm" onClick={() => setStage('start')}>
                  {I.chevronLeft} Back
                </button>
                <div>
                  <div className="modal-title">Start from scratch</div>
                  <div className="modal-sub">Connect Git or open code view directly.</div>
                </div>
                <div style={{ width: 32 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="create-path" onClick={() => chooseScratch('git')}>
                  <div className="path-icon">{I.git}</div>
                  <h4>Connect Git</h4>
                  <p>Link a repository and start with a code-first workflow that can be committed and versioned.</p>
                </div>
                <div className="create-path" onClick={() => chooseScratch('code')}>
                  <div className="path-icon">{I.code}</div>
                  <h4>Write code from scratch</h4>
                  <p>Open the builder directly in code view and author the app definition manually.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ConnectGitModal = ({ onClose, onContinue }) => {
  const [provider, setProvider] = React.useState('GitHub');
  const [repo, setRepo] = React.useState('acme/dataapp-revenue-pulse');
  const [branch, setBranch] = React.useState('main');

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" style={{ width: 620 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Connect Git</div>
            <div className="modal-sub">Link a repository before opening the code builder.</div>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ padding: 4, borderRadius: 4 }}>{I.close}</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gap: 12 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Provider</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {['GitHub', 'GitLab', 'Bitbucket'].map(p => (
                  <button key={p} className={`filter-chip ${provider === p ? 'active' : ''}`} onClick={() => setProvider(p)}>{p}</button>
                ))}
              </div>
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Repository</span>
              <input className="input" value={repo} onChange={e => setRepo(e.target.value)} placeholder="owner/repository" />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Default branch</span>
              <input className="input" value={branch} onChange={e => setBranch(e.target.value)} placeholder="main" />
            </label>

            <div className="reason-card" style={{ marginTop: 6 }}>
              <strong>{provider}</strong> connection will be configured when builder opens.
              Your first commit can be created after editing the app definition.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
            <Btn variant="ghost" size="sm" onClick={onClose}>Cancel</Btn>
            <Btn variant="primary" size="sm" icon={I.git} onClick={onContinue} disabled={!repo.trim() || !branch.trim()}>
              Connect and open builder
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Directory, CreateFlow, ConnectGitModal });
