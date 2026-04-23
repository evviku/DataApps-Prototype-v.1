/* Detail page — post-creation */

const Detail = ({ navigate, appId, tab, setTab, openDataEditor }) => {
  const app = APPS.find(a => a.id === (appId || 'rev-ops')) || APPS[0];
  const [moreOpen, setMoreOpen] = React.useState(false);
  const gitConnectionByApp = {
    'rev-ops': 'revenue-pulse / main',
    supply: 'supply-chain-risk / main',
    'mkt-attr': 'marketing-mix / release',
    'ai-notes': 'call-insights / main',
  };
  const gitRef = gitConnectionByApp[app.id] || null;
  const gitBadgeLabel = gitRef ? `Git: ${gitRef}` : 'No Git connected';

  return (
    <>
      <div className="topbar">
        <div className="crumbs">
          <span onClick={() => navigate('directory')} style={{ cursor: 'pointer' }}>Data Apps</span>
          <span className="c-sep">/</span>
          <span className="c-cur">{app.name}</span>
        </div>
        <div className="topbar-actions">
          <Btn variant="ghost" size="sm" icon={I.external}>Open app</Btn>
          <Btn variant="outline" size="sm" icon={I.wand} onClick={() => navigate('builder:' + app.id)}>Edit</Btn>
          <div className="filter-dropdown-wrapper">
            <Btn variant="ghost" size="sm" icon={I.more} onClick={() => setMoreOpen(open => !open)} />
            {moreOpen && (
              <div className="toolbar-dropdown" style={{ right: 0, left: 'auto', minWidth: 170 }}>
                <button className="toolbar-dropdown-item" onClick={() => setMoreOpen(false)}>
                  <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: 8 }}>{I.share}</span>
                  Share
                </button>
                <button className="toolbar-dropdown-item" onClick={() => setMoreOpen(false)}>
                  <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: 8 }}>{I.copy}</span>
                  Clone
                </button>
                <button className="toolbar-dropdown-item" onClick={() => setMoreOpen(false)}>
                  <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: 8 }}>{I.git}</span>
                  Git settings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="content flush" style={{ overflow: 'auto' }}>
        <div className="detail-header">
          <div className="detail-icon">{app.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
              <div className="detail-title">{app.name}</div>
              <Badge status={app.status} />
              <span className="badge badge-outline mono">{app.version}</span>
              <span className="badge badge-outline mono" style={{ color: gitRef ? 'var(--live)' : 'var(--text-3)' }}>
                {gitBadgeLabel}
              </span>
            </div>
            <div className="detail-sub">{app.desc}</div>
            <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 12, color: 'var(--text-3)' }}>
              <span>{I.user && <span style={{ marginRight: 4, verticalAlign: 'middle' }}>{I.user}</span>} Owner <strong style={{ color: 'var(--text)' }}>{app.owner}</strong></span>
              <span>Updated <strong style={{ color: 'var(--text)' }}>{app.updated}</strong></span>
              <span className="mono">apps.keboola.io/{app.id}</span>
            </div>
          </div>
        </div>

        <div style={{ padding: '24px 28px 60px' }}>
          {tab === 'overview' && <OverviewTab app={app} />}
          {tab === 'analytics' && <AnalyticsTab />}
          {tab === 'deployments' && <DeploymentsTab />}
          {tab === 'data' && <DataTab appId={app.id} openDataEditor={openDataEditor} />}
          {tab === 'logs' && <LogsTab />}
          {tab === 'settings' && <SettingsTab />}
        </div>
      </div>
    </>
  );
};

const OverviewTab = ({ app }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Usage snapshot</div>
        <Btn variant="ghost" size="sm" icon={I.arrowUp}>Open Analytics</Btn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
        {[
          { label: 'Views · 14d', value: '2,862', trend: '+21.3%' },
          { label: 'Unique users', value: '142', trend: '+6.2%' },
          { label: 'Avg session', value: '4m 12s', trend: '+0.4m' },
          { label: 'Bounce', value: '12.4%', trend: '−2.1pp' },
        ].map(k => (
          <div key={k.label} className="ab-kpi" style={{ padding: 12 }}>
            <div className="ab-kpi-label">{k.label}</div>
            <div className="ab-kpi-value" style={{ fontSize: 21 }}>{k.value}</div>
            <div className={`ab-kpi-trend ${k.trend.includes('−') ? 'down' : 'up'}`}>{k.trend.includes('−') ? '↓' : '↑'} {k.trend}</div>
          </div>
        ))}
      </div>
      <div style={{ height: 160, border: '1px solid var(--border)', borderRadius: 8, padding: 8, background: 'var(--surface-2)' }}>
        <ChartFilled interactive />
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 16 }}>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Health</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'Uptime (30d)', value: '99.98%' },
            { label: 'p95 load', value: '1.2s' },
            { label: 'Last incident', value: '6d ago' },
            { label: 'Source lag', value: '12m' },
          ].map(s => (
            <div key={s.label} style={{ padding: 10, background: 'var(--surface-2)', borderRadius: 6 }}>
              <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
              <div style={{ fontSize: 16, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--live)' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Access</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 10 }}>
          <span>{I.lock}</span>
          <span>Role-based · <span className="mono">revenue-readers</span></span>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {['JN','AK','MP','LT','RN'].map((n, i) => (
            <div key={i} style={{ width: 22, height: 22, borderRadius: '50%', background: `oklch(0.72 0.12 ${i * 60})`, color: 'white', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 600, marginLeft: i > 0 ? -6 : 0, border: '2px solid var(--surface)' }}>{n}</div>
          ))}
          <div style={{ fontSize: 12, color: 'var(--text-3)', alignSelf: 'center', marginLeft: 8 }}>+ 23 others</div>
        </div>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Recent activity</div>
          <button className="filter-chip">View all</button>
        </div>
        {[
          { who: 'Kai', what: 'added anomaly feed', when: '2h ago', icon: I.kai, kai: true },
          { who: 'Jan Novak', what: 'deployed v4.2', when: '2h ago', icon: I.deploy },
          { who: 'Anna Kim', what: 'edited chart overlay', when: '1d ago', icon: I.wand },
          { who: 'Kai', what: 'auto-healed: changed amount → amount_cents', when: '3d ago', icon: I.kai, kai: true },
        ].map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
            <div style={{ color: a.kai ? 'var(--accent)' : 'var(--text-3)' }}>{a.icon}</div>
            <div style={{ flex: 1, fontSize: 12 }}>
              <strong>{a.who}</strong> <span style={{ color: 'var(--text-2)' }}>{a.what}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{a.when}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>About</div>
        <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-2)', margin: 0 }}>
          Built for the weekly revenue review. Pulls from <span className="mono">snowflake.prod.orders</span> and
          joins on <span className="mono">customers</span> for tier breakdown. Kai generated the initial layout from a
          prompt and has since added an anomaly feed. Refresh cadence: every 15 minutes.
        </p>
      </div>
    </div>

    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)' }}>Live preview</div>
        <Btn variant="ghost" size="sm" icon={I.external}>Open in full view</Btn>
      </div>
      <div style={{ height: 220, background: 'var(--surface-2)', padding: 14 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, height: '100%', padding: 12, overflow: 'hidden' }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{app.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 10 }}>{app.desc}</div>
          <div style={{ height: 140 }}><ChartFilled /></div>
        </div>
      </div>
    </div>
  </div>
);

const AnalyticsTab = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
      <button className="filter-chip active">Last 7 days</button>
      <button className="filter-chip">Last 30 days</button>
      <button className="filter-chip">All time</button>
      <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 2px' }} />
      <button className="filter-chip">Segment: All users {I.chevronDown}</button>
      <button className="filter-chip">Channel: All {I.chevronDown}</button>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Usage trend</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>daily granularity</div>
        </div>
        <div style={{ height: 260 }}><ChartFilled /></div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Conversion funnel</div>
        {[
          ['App opened', '1,284', '100%'],
          ['Filter changed', '642', '50%'],
          ['Table interaction', '418', '32.5%'],
          ['Export / share', '122', '9.5%'],
        ].map(([step, value, pct], idx) => (
          <div key={step} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span>{idx + 1}. {step}</span>
              <span className="mono" style={{ color: 'var(--text-2)' }}>{value} · {pct}</span>
            </div>
            <div className="progress"><div className="progress-bar" style={{ width: pct }} /></div>
          </div>
        ))}
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Top viewers</div>
        {[
          ['Anna Kim', 'revenue-readers', 48],
          ['Marek Pavel', 'revenue-readers', 32],
          ['Lucie Trubac', 'exec', 28],
          ['Robert Novak', 'revenue-readers', 21],
        ].map(([n, r, c]) => (
          <div key={n} style={{ display: 'flex', padding: '8px 0', alignItems: 'center', borderBottom: '1px solid var(--border)', gap: 10 }}>
            <Avatar name={n} size={22} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{n}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{r}</div>
            </div>
            <div className="mono" style={{ fontSize: 12 }}>{c}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Most-used filters</div>
        {[
          ['region = EMEA', '64%'],
          ['region = NA', '28%'],
          ['period = last quarter', '41%'],
          ['period = YTD', '22%'],
        ].map(([f, p]) => (
          <div key={f} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span className="mono">{f}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>{p}</span>
            </div>
            <div className="progress"><div className="progress-bar" style={{ width: p }} /></div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Entry sources</div>
        {[
          ['Shared link', '46%'],
          ['Workspace directory', '28%'],
          ['Embedded (Notion)', '19%'],
          ['Other', '7%'],
        ].map(([src, p]) => (
          <div key={src} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span>{src}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>{p}</span>
            </div>
            <div className="progress"><div className="progress-bar" style={{ width: p }} /></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const DeploymentsTab = () => (
  <div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Version history</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>12 versions · production currently running v4.2</div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <Btn variant="outline" size="sm" icon={I.git}>Connect git</Btn>
        <Btn variant="primary" size="sm" icon={I.deploy}>Deploy v4.3</Btn>
      </div>
    </div>

    <div className="card">
      {[
        { v: 'v4.2', cur: true, who: 'Jan Novak', when: '2h ago', msg: 'Added anomaly feed (Kai)', status: 'live' },
        { v: 'v4.1', who: 'Anna Kim', when: '2d ago', msg: 'Chart: YoY overlay', status: 'archived' },
        { v: 'v4.0', who: 'Kai', when: '5d ago', msg: 'Schema migration: amount → amount_cents', status: 'archived', kai: true },
        { v: 'v3.7', who: 'Jan Novak', when: '12d ago', msg: 'Rollback — stable', status: 'archived' },
        { v: 'v3.8', who: 'Marek Pavel', when: '10d ago', msg: 'Attempted refactor of filters', status: 'error' },
      ].map((d, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 1fr auto 90px 90px', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
          <div className="mono" style={{ fontWeight: 600, fontSize: 12 }}>{d.v}</div>
          <div>
            <div style={{ fontSize: 13 }}>{d.msg} {d.kai && <span className="badge badge-kai" style={{ marginLeft: 6 }}>{I.kai} Kai</span>}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>by {d.who} · {d.when}</div>
          </div>
          <div>
            {d.status === 'live' && <Badge status="live">Live</Badge>}
            {d.status === 'error' && <Badge status="error">Failed</Badge>}
            {d.status === 'archived' && <span className="badge badge-outline">Archived</span>}
          </div>
          <Btn variant="ghost" size="sm">View diff</Btn>
          {d.cur ? <span style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'right' }}>current</span> : <Btn variant="outline" size="sm">Rollback</Btn>}
        </div>
      ))}
    </div>
  </div>
);

const DataSourceCard = ({ s, i, onManageData }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef(null);
  React.useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);
  return (
    <div className="card data-source-card" style={{ padding: 16, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', color: 'var(--text-2)', flexShrink: 0 }}>{I.database}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="mono" style={{ fontSize: 13, fontWeight: 500 }}>{s.id}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
            {s.rows} rows · {s.cols} cols · {s.updated} · used by {['4 blocks', '2 blocks', '1 block'][i]}
          </div>
        </div>
        <Badge status="live">Fresh</Badge>
        <div className="data-source-card-actions">
          <Btn variant="ghost" size="sm" icon={I.external}>View in Storage</Btn>
          <div className="ds-more-wrapper" ref={menuRef}>
            <button className="btn btn-ghost btn-sm ds-more-btn" onClick={() => setMenuOpen(open => !open)} aria-label="More options">{I.more}</button>
            {menuOpen && (
              <div className="ds-more-menu">
                <button className="ds-more-item" onClick={() => setMenuOpen(false)}>
                  <span className="ds-more-item-icon">{I.external}</span> View in Storage
                </button>
                <button className="ds-more-item" onClick={() => setMenuOpen(false)}>
                  <span className="ds-more-item-icon">{I.flow}</span> View lineage
                </button>
                <button className="ds-more-item" onClick={() => { setMenuOpen(false); onManageData && onManageData(); }}>
                  <span className="ds-more-item-icon">{I.swap}</span> Replace source
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 20, fontSize: 11 }}>
        <div>
          <div style={{ color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Refresh</div>
          <div className="mono" style={{ fontSize: 12 }}>every 15 min</div>
        </div>
        <div>
          <div style={{ color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Fields used</div>
          <div className="mono" style={{ fontSize: 12 }}>{['amount, order_date, region, customer_id', 'customer_id, tier, name', 'event_id, user_id, ts'][i]}</div>
        </div>
        <div>
          <div style={{ color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Lineage</div>
          <div className="mono" style={{ fontSize: 12 }}>2 transformations upstream</div>
        </div>
      </div>
    </div>
  );
};

const DataTab = ({ appId, openDataEditor }) => (
  <div>
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>Data sources</div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 2 }}>Tables and views this app reads from. Changes in sources propagate automatically.</div>
      <div style={{ fontSize: 11, color: 'var(--text-4, var(--text-3))', opacity: 0.7 }}>Changes to data sources are managed in the builder.</div>
    </div>

    {DATA_SOURCES.slice(0, 3).map((s, i) => (
      <DataSourceCard key={s.id} s={s} i={i} onManageData={() => openDataEditor && openDataEditor(appId)} />
    ))}

    <button className="data-tab-add-source" onClick={() => openDataEditor && openDataEditor(appId)}>
      + Add data source
    </button>
  </div>
);

const LogsTab = () => (
  <div>
    <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
      <div className="input-group" style={{ flex: 1, maxWidth: 320 }}>
        {I.search}
        <input placeholder="Filter logs…" />
      </div>
      <button className="filter-chip active">All levels</button>
      <button className="filter-chip">Last hour {I.chevronDown}</button>
      <div style={{ marginLeft: 'auto' }}>
        <Btn variant="ghost" size="sm" icon={I.refresh}>Live</Btn>
      </div>
    </div>
    <div className="card" style={{ padding: 0 }}>
      {[
        { t: '14:02:11', l: 'info', m: 'Refresh complete · 12.4M rows scanned · 1.2s' },
        { t: '14:02:09', l: 'info', m: 'Source snowflake.prod.orders lag 12m' },
        { t: '13:47:11', l: 'info', m: 'Refresh complete · 12.4M rows scanned · 1.1s' },
        { t: '13:32:18', l: 'warn', m: 'Query plan fallback · used local aggregation · 3.8s' },
        { t: '13:32:10', l: 'info', m: 'Refresh started · invalidated by upstream flow finance-etl' },
        { t: '13:14:04', l: 'info', m: 'User anna@ viewed app · session 12m 42s' },
        { t: '12:58:31', l: 'error', m: 'Chart #b4: division by zero in rolling_forecast · returned nulls, Kai healed' },
        { t: '12:58:30', l: 'info', m: 'Kai auto-heal applied: wrapped divisor in NULLIF' },
      ].map((row, i) => (
        <div key={i} className="log-row">
          <span className="log-time">{row.t}</span>
          <span className={`log-level ${row.l}`}>{row.l.toUpperCase()}</span>
          <span className="log-msg">{row.m}</span>
        </div>
      ))}
    </div>
  </div>
);

const SettingsTab = () => (
  <div style={{ maxWidth: 720 }}>
    <SettingSection title="General" desc="Name, URL and description.">
      <Field label="Name" value="Revenue Pulse" />
      <Field label="URL slug" value="apps.keboola.io/revenue-pulse" mono />
      <Field label="Description" value="Weekly revenue with region breakdown" multi />
    </SettingSection>

    <SettingSection title="Runtime" desc="How the app is served.">
      <Field label="Refresh cadence" value="Every 15 min" />
      <Field label="Query cache" value="300 seconds" mono />
      <Field label="Max concurrent sessions" value="200" mono />
    </SettingSection>

    <SettingSection title="Access" desc="Who can view and edit.">
      <Field label="Visibility" value="Role-based" />
      <Field label="Viewer roles" value="revenue-readers, exec" mono />
      <Field label="Editor roles" value="data-team" mono />
    </SettingSection>

    <SettingSection title="Source control" desc="Connect a Git repository for versioned app definitions.">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Git repository</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Link your app to a Git repo for commits, branches, and history.</div>
        </div>
        <Btn variant="outline" size="sm" icon={I.git}>Connect git</Btn>
      </div>
    </SettingSection>

    <SettingSection title="Kai" desc="Autonomous behavior inside this app.">
      <ToggleRow label="Auto-heal schema changes" sub="Kai will silently update column references when sources rename." checked />
      <ToggleRow label="Anomaly detection" sub="Kai flags rows that deviate > 2σ from its rolling forecast." checked />
      <ToggleRow label="Suggest improvements" sub="Kai can propose layout changes you can accept or reject." checked />
    </SettingSection>

    <SettingSection title="Danger zone" danger>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Archive app</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Hidden from the directory. URL stops responding. Restorable within 30 days.</div>
        </div>
        <Btn variant="outline" size="sm">Archive</Btn>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--border)' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Delete app</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Removes all versions, views and logs. Sources are untouched.</div>
        </div>
        <Btn variant="danger" size="sm">Delete</Btn>
      </div>
    </SettingSection>
  </div>
);

const SettingSection = ({ title, desc, danger, children }) => (
  <div style={{ borderBottom: '1px solid var(--border)', padding: '24px 0' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 30 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: danger ? 'var(--err)' : 'var(--text)' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4, lineHeight: 1.45 }}>{desc}</div>
      </div>
      <div>{children}</div>
    </div>
  </div>
);

const Field = ({ label, value, mono, multi }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{label}</div>
    {multi ? (
      <textarea className="input" style={{ height: 60, padding: 8, resize: 'vertical' }} defaultValue={value} />
    ) : (
      <input className="input" style={{ fontFamily: mono ? 'var(--font-mono)' : 'inherit', fontSize: mono ? 12 : 13 }} defaultValue={value} />
    )}
  </div>
);

const ToggleRow = ({ label, sub, checked }) => {
  const [on, setOn] = React.useState(!!checked);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4 }}>{sub}</div>
      </div>
      <button
        onClick={() => setOn(!on)}
        style={{ width: 36, height: 20, borderRadius: 10, background: on ? 'var(--text)' : 'var(--surface-3)', position: 'relative', transition: 'background 0.15s' }}
      >
        <div style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.15s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
      </button>
    </div>
  );
};

Object.assign(window, { Detail });
