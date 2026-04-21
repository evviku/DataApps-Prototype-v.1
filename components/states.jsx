/* States & Edge Cases gallery + System Thinking notes */

const StatesPage = ({ navigate }) => {
  return (
    <>
      <div className="topbar">
        <button className="btn-ghost" onClick={() => navigate('directory')} style={{ padding: '4px 6px', borderRadius: 4 }}>{I.chevronLeft}</button>
        <div className="crumbs">
          <span onClick={() => navigate('directory')} style={{ cursor: 'pointer' }}>Data Apps</span>
          <span className="c-sep">/</span>
          <span className="c-cur">States & edge cases</span>
        </div>
      </div>
      <div className="content">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>States & edge cases</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-2)', fontSize: 13, maxWidth: 620 }}>
            Every app can be in exactly one of four states at a time. Runtime signals drive the transitions — no user can flip a flag manually.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { status: 'draft', title: 'Draft', sig: 'bound === all && !published', desc: 'Work in progress. Author-only visibility. The URL returns 404 for everyone else.', ui: 'Builder shows full controls. Directory card shows no view count.', next: 'Publish → Live' },
            { status: 'live', title: 'Live', sig: 'bound === all && published && last_run.ok', desc: 'Publicly addressable (inside the workspace). Refreshes on source change.', ui: 'Directory shows green dot + sparkline of view traffic.', next: 'Source breaks → Error · Source unbound → Unbound' },
            { status: 'unbound', title: 'Unbound', sig: 'bound < all', desc: 'Some block needs a table. Preview still renders with striped placeholders so you can scan layout.', ui: 'Warn pill in directory; inline “Bind data” CTAs on each unbound block.', next: 'Bind all → Live (if published)' },
            { status: 'error', title: 'Error', sig: 'last_run.failed OR schema_broken', desc: 'A deployment failed or a source column disappeared and Kai couldn\'t auto-heal.', ui: 'Red pulsing pill. Prev version keeps serving; error shown in Logs.', next: 'Rollback → Live · Fix → Live' },
          ].map(s => (
            <div key={s.status} className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Badge status={s.status}>{s.title}</Badge>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.sig}</span>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text-2)', marginBottom: 8 }}>{s.desc}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 10 }}>
                <div style={{ marginBottom: 4 }}><strong style={{ color: 'var(--text)' }}>UI signal:</strong> {s.ui}</div>
                <div><strong style={{ color: 'var(--text)' }}>Transitions out:</strong> {s.next}</div>
              </div>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Edge cases</h2>
        <div className="card" style={{ padding: 0 }}>
          {[
            ['Missing column', 'Source renamed `amount` → `amount_cents`', 'Kai auto-heals if column match > 0.9 confidence. Else logs error, app keeps serving last good build.'],
            ['Zero rows in filter', 'User filters to a region with no data', 'Chart shows empty-state plot with axes and a message; KPI cards show “—” instead of 0.'],
            ['Slow query', 'Refresh > 8s', 'Preview stays on last result; badge “Serving cached · refreshing…” appears in the chrome.'],
            ['No usage', 'Live app with 0 views in 30d', 'Directory sparkline goes flat-gray; weekly digest suggests archiving.'],
            ['Failed deployment', 'Build step errored', 'New version rejected, prev stays live. Error visible in Deployments tab; rollback is a 1-click.'],
            ['Source deleted', 'Table dropped upstream', 'App flips to Unbound with a specific message; Kai offers to re-bind to the closest schema match.'],
          ].map(([t, trigger, handling]) => (
            <div key={t} style={{ display: 'grid', gridTemplateColumns: '160px 260px 1fr', gap: 20, padding: '14px 18px', borderBottom: '1px solid var(--border)', alignItems: 'start' }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{t}</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{trigger}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55 }}>{handling}</div>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 16, fontWeight: 600, margin: '32px 0 10px' }}>System thinking</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <SystemCard title="Directory" problem="Teams accumulate dashboards they can't find or trust." why="Surface the 3 signals that predict usefulness: status, freshness, and who's using it. Everything else is progressive disclosure." fit="Entry point for every data consumer. Reading is the dominant action — cards optimize for scanning." />
          <SystemCard title="Create flow" problem="Cold-start paralysis: people stare at a blank canvas." why="Prompt-first mirrors how people actually describe what they want. Templates are the shortcut for known shapes. Scratch exists for experts." fit="One decision point that routes to the same underlying page definition." />
          <SystemCard title="AI Builder" problem="Chat-as-decoration (chat that only explains) and WYSIWYG-only (no intent capture) both fail at scale." why="Chat drives structured operations — each message produces an action chip with a reversible diff. The preview is always real, never a storyboard." fit="Every change — from Kai or from direct edits — is a mutation on the same page definition tree." />
          <SystemCard title="Data binding" problem="Users bolt a UI to data they don't understand, then are surprised when it breaks." why="Binding is an explicit 3-step gesture, not a dropdown. Confidence scores and sample rows force understanding before commit." fit="Separating structure from data means you can prototype a layout before the table exists — and retarget when it does." />
          <SystemCard title="Detail page" problem="Governance signals (health, access, lineage) are buried in a settings tab nobody reads." why="Overview tab puts health, access, and a live preview next to each other. Builders go edit; viewers don't need the inspector at all." fit="The detail page is the artifact; the builder is the workshop. Keeping them separate prevents read/write mode confusion." />
          <SystemCard title="States" problem="Status fields drift away from reality when users can manually set them." why="All 4 states are derived from two runtime signals: binding completeness and last run health. This makes them trustworthy." fit="Badges, filters, and the “bind all” affordance all consume the same state machine." />
        </div>

        <h2 style={{ fontSize: 16, fontWeight: 600, margin: '32px 0 10px' }}>Kai — global integration</h2>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 16 }}>
            Kai is the same assistant across the platform; Data Apps is one context. These are the touch points:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              ['In the directory', 'Ask Kai opens a context-scoped chat. “Which app covers EMEA revenue?” returns an app card, not a paragraph.'],
              ['In the builder', 'Primary author. Every edit routes through the action-chip protocol so changes are reviewable and reversible.'],
              ['On the detail page', 'Shows up in the Activity feed as an actor (auto-heals, suggestions). Viewers can ask questions of the app itself: “why did revenue drop in week 42?”'],
              ['Globally', 'Cross-context recall: Kai remembers the tables, transformations, and flows you work on daily. Suggests binding targets before you ask.'],
            ].map(([h, d]) => (
              <div key={h} style={{ padding: 12, background: 'var(--accent-soft)', border: '1px solid var(--accent-soft-border)', borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-2)', marginBottom: 4 }}>{h}</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>

        <h2 style={{ fontSize: 16, fontWeight: 600, margin: '32px 0 10px' }}>pageDefinition · the shape under the UI</h2>
        <div className="card" style={{ padding: 16, background: '#0a0a0a', color: '#fafafa' }}>
          <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6, overflow: 'auto' }}>
{`{
  "id": "revenue-pulse",
  "version": "4.2",
  "access": { "roles": ["revenue-readers", "exec"] },
  "blocks": [
    { "id": "b1", "type": "header", "props": { "title": "Revenue Pulse" } },
    { "id": "b2", "type": "filters", "props": {
        "items": [
          { "key": "region", "source": "$.orders.region", "type": "enum" },
          { "key": "period", "default": "last_13_weeks" }
        ]
    }},
    { "id": "b3", "type": "kpis", "source": "snowflake.prod.orders",
      "props": { "items": [
        { "label": "Gross revenue", "expr": "sum(amount)" },
        { "label": "Orders",        "expr": "count(*)" }
      ]}
    },
    { "id": "b4", "type": "chart", "source": "snowflake.prod.orders",
      "props": {
        "x": "week(order_date)", "y": "sum(amount)",
        "split_by": "region", "overlay": ["prior_year"]
      }
    }
  ]
}`}
          </pre>
        </div>

        <div className="reason-card" style={{ marginTop: 16 }}>
          <strong>Why a definition, not code?</strong> Everything downstream — Kai's edits, the inspector, the URL router, the permission check, the diff viewer — reads and writes the same JSON. It's the contract that lets AI author UI without generating brittle React.
        </div>

        <h2 style={{ fontSize: 16, fontWeight: 600, margin: '32px 0 10px' }}>Open questions & risks</h2>
        <div className="card" style={{ padding: 0 }}>
          {[
            ['Custom React blocks', 'How much escape-hatch is too much? If users write raw React, Kai can\'t edit those blocks with confidence.', 'risk'],
            ['Multi-tenant isolation', 'Apps serve from one process today. A slow source on app A shouldn\'t affect app B.', 'risk'],
            ['Semantic layer vs raw SQL', 'Binding to a table is easy; binding to a metric that already exists in dbt/semantic layer is better.', 'question'],
            ['Mobile authoring', 'Builder is desktop-only for now. Directory + viewing work on mobile.', 'question'],
            ['Version diff ergonomics', 'Diffing two pageDefinitions visually is harder than diffing code. Needs its own view.', 'risk'],
          ].map(([t, d, k]) => (
            <div key={t} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '80px 200px 1fr', gap: 14, alignItems: 'center' }}>
              <span className={`badge ${k === 'risk' ? 'badge-error' : 'badge-outline'}`}><span className="dot" />{k}</span>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{t}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

const SystemCard = ({ title, problem, why, fit }) => (
  <div className="card" style={{ padding: 16 }}>
    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{title}</div>
    <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55 }}>
      <div style={{ marginBottom: 8 }}><span style={{ color: 'var(--text-3)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Problem</span><br />{problem}</div>
      <div style={{ marginBottom: 8 }}><span style={{ color: 'var(--text-3)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Why it exists</span><br />{why}</div>
      <div><span style={{ color: 'var(--text-3)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>System fit</span><br />{fit}</div>
    </div>
  </div>
);

Object.assign(window, { StatesPage });
