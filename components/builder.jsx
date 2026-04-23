/* AI Builder — Kai chat + live preview + inspector */

const INITIAL_DEF = {
  title: 'Revenue Pulse',
  subtitle: 'Weekly revenue with region breakdown',
  blocks: [
    { id: 'b1', type: 'header', bound: true, props: { title: 'Revenue Pulse', subtitle: 'Weekly revenue with region breakdown' } },
    { id: 'b2', type: 'filters', bound: false, props: { items: [{ label: 'Region', value: 'All regions' }, { label: 'Period', value: 'Last 13 weeks' }] } },
    { id: 'b3', type: 'kpis', bound: false, props: { items: [
      { label: 'Gross revenue', value: null, trend: null },
      { label: 'Orders', value: null, trend: null },
      { label: 'AOV', value: null, trend: null },
      { label: 'Refund rate', value: null, trend: null },
    ] } },
    { id: 'b4', type: 'chart', bound: false, props: { title: 'Revenue by week', sub: 'Last 13 weeks · stacked by region' } },
    { id: 'b5', type: 'table', bound: false, props: { title: 'Top customers', sub: 'By revenue this period' } },
  ],
};

const TEMPLATE_DEF = {
  ...INITIAL_DEF,
  blocks: INITIAL_DEF.blocks.map((b) => ({ ...b, bound: false, source: undefined })),
};

const BLANK_DEF = {
  title: 'Untitled App',
  subtitle: 'Start from code or ask Kai to scaffold the first version.',
  blocks: [],
};

const DRAFT_PROMPT = 'Build a weekly revenue dashboard with a region filter and a YoY comparison chart. Use snowflake.prod.orders.';
const DRAFT_DEF = {
  title: 'Drafting your page…',
  subtitle: 'Kai is composing the layout.',
  blocks: [],
};
const DRAFT_STEPS = [
  {
    block: { id: 'b1', type: 'header', bound: true, props: { title: 'Revenue Pulse', subtitle: 'Weekly revenue with region breakdown' } },
    message: 'Starting with the hero title and subtitle.',
  },
  {
    block: { id: 'b2', type: 'filters', bound: false, props: { items: [{ label: 'Region', value: 'All regions' }, { label: 'Period', value: 'Last 13 weeks' }] } },
    message: 'Added the filter bar for region and period.',
  },
  {
    block: { id: 'b3', type: 'kpis', bound: false, props: { items: [
      { label: 'Gross revenue', value: null, trend: null },
      { label: 'Orders', value: null, trend: null },
      { label: 'AOV', value: null, trend: null },
      { label: 'Refund rate', value: null, trend: null },
    ] } },
    message: 'Building the KPI row to surface key metrics.',
  },
  {
    block: { id: 'b4', type: 'chart', bound: false, props: { title: 'Revenue by week', sub: 'Last 13 weeks · stacked by region' } },
    message: 'Drafted the main revenue trend chart.',
  },
  {
    block: { id: 'b5', type: 'table', bound: false, props: { title: 'Top customers', sub: 'By revenue this period' } },
    message: 'Adding the top customers table to round out the page.',
  },
];

const SOURCE_OPTIONS = [
  { id: 'snowflake.prod.orders', label: 'snowflake.prod.orders', desc: 'Order-level revenue and transactions.' },
  { id: 'events.prod.pageviews', label: 'events.prod.pageviews', desc: 'User engagement and session behavior.' },
  { id: 'sales.prod.invoices', label: 'sales.prod.invoices', desc: 'Invoice lines and customer performance.' },
];

const PROJECT_SLUG = 'active-project';
const TAKEN_URL_SLUGS = new Set(['revenue-pulse', 'marketing-mix', 'supply-chain-risk']);

const ENTRY_TEMPLATES = [
  { id: 'executive-dashboard', label: 'Executive dashboard', desc: 'Headline KPIs, trends, and summary narrative for leadership reviews.', prompt: 'Build an executive dashboard with key KPIs, trends, and a short performance summary.', preview: 'dashboard', category: 'Dashboard' },
  { id: 'internal-tool', label: 'Internal tool', desc: 'Operational table views with actions, filters, and task-focused workflows.', prompt: 'Create an internal operations tool with filters, table actions, and a review workflow.', preview: 'table', category: 'Operations' },
  { id: 'simulator', label: 'Simulator', desc: 'Scenario inputs and projected outcomes for what-if analysis.', prompt: 'Build a simulator with adjustable inputs, scenario comparisons, and projected outcomes.', preview: 'simulator', category: 'Analysis' },
  { id: 'kpi-board', label: 'KPI board', desc: 'Dense scorecard layout for business metrics and performance checks.', prompt: 'Create a KPI board with headline metrics, trend charts, and exception callouts.', preview: 'kpi', category: 'Dashboard' },
  { id: 'approval-flow', label: 'Approval flow', desc: 'Requests, status tracking, and reviewer actions in one guided app.', prompt: 'Build an approval flow app with request details, status tracking, and reviewer actions.', preview: 'approval', category: 'Operations' },
  { id: 'ai-app', label: 'AI app', desc: 'Prompt-centric experience with generated insights and suggested next steps.', prompt: 'Create an AI-powered app that summarizes records, flags anomalies, and recommends next steps.', preview: 'ai', category: 'AI' },
];

const createBuildProgress = () => ({
  current: 0,
  total: DRAFT_STEPS.length,
  steps: DRAFT_STEPS.map((step, index) => ({
    label: step.message,
    status: index === 0 ? 'active' : 'pending',
  })),
});

const initialMessages = [
  { role: 'user', text: 'Build a weekly revenue dashboard with a region filter and a YoY comparison chart. Use snowflake.prod.orders.' },
  { role: 'kai', text: 'Drafted a 5-block page. Chart is unbound — I can wire it to orders.amount × week(order_date) once you confirm.', action: { title: 'Created page', diff: [{ op: 'add', path: 'header' }, { op: 'add', path: 'filters' }, { op: 'add', path: 'kpis[4]' }, { op: 'add', path: 'chart' }, { op: 'add', path: 'table' }] } },
];

const CODE_EXPLORER_FILES = [
  { id: 'app-definition.json', label: 'app-definition.json', section: 'root' },
  { id: 'package.json', label: 'package.json', section: 'root' },
  { id: 'src/index.ts', label: 'index.ts', section: 'src' },
  { id: 'src/components/chart.tsx', label: 'chart.tsx', section: 'src/components' },
  { id: 'src/components/table.tsx', label: 'table.tsx', section: 'src/components' },
  { id: 'src/components/filters.tsx', label: 'filters.tsx', section: 'src/components' },
];

const CODE_FILE_SNIPPETS = {
  'package.json': '{\n  "name": "data-app",\n  "private": true,\n  "scripts": { "start": "keboola-app dev" }\n}',
  'src/index.ts': 'import { mountApp } from "./app";\n\nmountApp();\n',
  'src/components/chart.tsx': 'export const RevenueChart = () => {\n  return null;\n};\n',
  'src/components/table.tsx': 'export const TopCustomersTable = () => {\n  return null;\n};\n',
  'src/components/filters.tsx': 'export const FiltersBar = () => {\n  return null;\n};\n',
};

const Builder = ({ navigate, appId }) => {
  const [rawAppId, builderQuery = ''] = String(appId || '').split('?');
  const requestedInspectTab = React.useMemo(() => {
    const params = new URLSearchParams(builderQuery);
    return params.get('inspect') === 'data' ? 'data' : 'tree';
  }, [builderQuery]);
  const [selected, setSelected] = React.useState('b4');
  const [device, setDevice] = React.useState('desktop');
  const isNewEntry = rawAppId === 'new' || rawAppId === 'new:entry';
  const isScratch = rawAppId && rawAppId.startsWith('new:scratch');
  const isNewAi = rawAppId && rawAppId.startsWith('new:ai');
  const isTemplate = rawAppId && rawAppId.startsWith('new:template');
  const [builderStage, setBuilderStage] = React.useState(isNewEntry ? 'entry' : 'standard');
  const [view, setView] = React.useState(isScratch ? 'code' : 'preview');
  const [codePreviewCollapsed, setCodePreviewCollapsed] = React.useState(false);
  const [activeCodeFile, setActiveCodeFile] = React.useState('app-definition.json');
  const [explorerOpen, setExplorerOpen] = React.useState({ root: true, src: true, components: true });
  const [tab, setTab] = React.useState(requestedInspectTab);
  const [treePageOpen, setTreePageOpen] = React.useState(true);
  const [treeBlocksOpen, setTreeBlocksOpen] = React.useState(true);
  const initialDef = isNewEntry ? BLANK_DEF : (isScratch ? BLANK_DEF : (isNewAi ? DRAFT_DEF : (isTemplate ? TEMPLATE_DEF : INITIAL_DEF)));
  const [def, setDef] = React.useState(initialDef);
  const [messages, setMessages] = React.useState(isNewAi ? [
    { role: 'user', text: DRAFT_PROMPT },
    { role: 'kai', text: 'Which data source should I use? Pick one to start the app.', action: null },
  ] : (isScratch
    ? [{ role: 'kai', text: 'Blank code editor ready. Ask Kai to scaffold the first blocks, or author the app definition manually.', action: { title: 'Opened blank editor', diff: [{ op: 'add', path: 'app definition = empty' }] } }]
    : (isTemplate
      ? [{ role: 'kai', text: 'Template loaded. You can customize the layout, connect data, or switch to code view.', action: { title: 'Loaded template', diff: [{ op: 'add', path: 'template blocks' }] } }]
      : (isNewEntry ? [] : initialMessages))));
  const [input, setInput] = React.useState('');
  const [selectedSources, setSelectedSources] = React.useState((isNewAi || isTemplate || isNewEntry) ? [] : ['snowflake.prod.orders']);
  const [selectionStage, setSelectionStage] = React.useState(isNewAi ? 'source' : 'ready');
  const [buildStepsOpen, setBuildStepsOpen] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [genBlockId, setGenBlockId] = React.useState(null);
  const [showBinding, setShowBinding] = React.useState(false);
  const [bindingTarget, setBindingTarget] = React.useState(null);
  const [showAppSettings, setShowAppSettings] = React.useState(false);
  const [showGitConnectModal, setShowGitConnectModal] = React.useState(false);
  const [gitConnectError, setGitConnectError] = React.useState('');
  const [gitConnectDraft, setGitConnectDraft] = React.useState({
    repositoryUrl: '',
    branch: 'main',
    provider: 'GitHub',
  });
  const [settingsErrors, setSettingsErrors] = React.useState({});
  const [publishHint, setPublishHint] = React.useState('');
  const [appSettings, setAppSettings] = React.useState({
    name: '',
    urlSlug: '',
    visibility: 'Private',
    description: '',
    isPublished: false,
  });
  const [codeViewHeight, setCodeViewHeight] = React.useState(null);
  const [entryPrompt, setEntryPrompt] = React.useState('');
  const [entrySelectedSourceIds, setEntrySelectedSourceIds] = React.useState([]);
  const [isPromoting, setIsPromoting] = React.useState(false);
  const [transitionNote, setTransitionNote] = React.useState('');
  const [templateFilterCategory, setTemplateFilterCategory] = React.useState(null);
  const draftTimers = React.useRef([]);
  const promoteTimerRef = React.useRef(null);
  const streamRef = React.useRef(null);
  const codeEditorRef = React.useRef(null);
  const codeModeLayoutRef = React.useRef(null);
  const codeViewRef = React.useRef(null);
  const resizeStateRef = React.useRef(null);
  const MIN_CODE_HEIGHT = 200;
  const MIN_PREVIEW_HEIGHT = 180;
  const LAYOUT_GAP_AND_SPLITTER = 22;
  const [codeText, setCodeText] = React.useState(() => JSON.stringify(initialDef, null, 2));
  const isEditingAppDefinition = activeCodeFile === 'app-definition.json';
  const activeCodeFileText = isEditingAppDefinition ? codeText : (CODE_FILE_SNIPPETS[activeCodeFile] || '');

  React.useEffect(() => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [messages, generating]);

  React.useEffect(() => {
    setTab(requestedInspectTab);
  }, [requestedInspectTab, rawAppId]);

  React.useEffect(() => {
    setCodeText(JSON.stringify(def, null, 2));
  }, [def]);

  React.useEffect(() => {
    if (view !== 'code' || !selected || !codeEditorRef.current) return;
    const marker = `"id": "${selected}"`;
    const idx = codeText.indexOf(marker);
    if (idx === -1) return;
    codeEditorRef.current.focus();
    codeEditorRef.current.setSelectionRange(idx, idx + marker.length);
  }, [selected, view, codeText]);

  React.useEffect(() => {
    return () => {
      draftTimers.current.forEach(clearTimeout);
      if (promoteTimerRef.current) clearTimeout(promoteTimerRef.current);
    };
  }, []);

  React.useEffect(() => {
    return () => {
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
    };
  }, []);

  const onCodeResizeMove = React.useCallback((e) => {
    const resizeState = resizeStateRef.current;
    if (!resizeState) return;
    const layoutEl = codeModeLayoutRef.current;
    if (!layoutEl) return;

    const minCodeHeight = MIN_CODE_HEIGHT;
    const minPreviewHeight = codePreviewCollapsed ? 0 : MIN_PREVIEW_HEIGHT;
    const maxCodeHeight = Math.max(minCodeHeight, layoutEl.clientHeight - minPreviewHeight - LAYOUT_GAP_AND_SPLITTER);
    const delta = resizeState.startY - e.clientY;
    const nextHeight = Math.min(maxCodeHeight, Math.max(minCodeHeight, resizeState.startHeight + delta));

    setCodeViewHeight(nextHeight);
  }, [codePreviewCollapsed, LAYOUT_GAP_AND_SPLITTER, MIN_CODE_HEIGHT, MIN_PREVIEW_HEIGHT]);

  React.useEffect(() => {
    if (view !== 'code' || codePreviewCollapsed || codeViewHeight == null) return;
    const layoutEl = codeModeLayoutRef.current;
    if (!layoutEl) return;

    const maxCodeHeight = Math.max(MIN_CODE_HEIGHT, layoutEl.clientHeight - MIN_PREVIEW_HEIGHT - LAYOUT_GAP_AND_SPLITTER);
    if (codeViewHeight > maxCodeHeight) setCodeViewHeight(maxCodeHeight);
  }, [codePreviewCollapsed, codeViewHeight, view, LAYOUT_GAP_AND_SPLITTER, MIN_CODE_HEIGHT, MIN_PREVIEW_HEIGHT]);

  const stopCodeResize = React.useCallback(() => {
    resizeStateRef.current = null;
    window.removeEventListener('mousemove', onCodeResizeMove);
    window.removeEventListener('mouseup', stopCodeResize);
    document.body.style.removeProperty('cursor');
    document.body.style.removeProperty('user-select');
  }, [onCodeResizeMove]);

  const startCodeResize = React.useCallback((e) => {
    if (codePreviewCollapsed) return;
    if (!codeViewRef.current) return;
    e.preventDefault();

    resizeStateRef.current = {
      startY: e.clientY,
      startHeight: codeViewRef.current.offsetHeight,
    };

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onCodeResizeMove);
    window.addEventListener('mouseup', stopCodeResize);
  }, [codePreviewCollapsed, onCodeResizeMove, stopCodeResize]);

  const updateLatestBuildMessage = (updater) => {
    setMessages(prev => {
      const next = [...prev];
      for (let i = next.length - 1; i >= 0; i -= 1) {
        if (next[i].buildProgress) {
          next[i] = updater(next[i]);
          break;
        }
      }
      return next;
    });
  };

  const startDraftBuild = (sourceId) => {
    draftTimers.current.forEach(clearTimeout);
    draftTimers.current = [];

    setDef(DRAFT_DEF);
    setSelected(null);
    setGenerating(true);

    const selectedSource = sourceId || selectedSources[0] || 'snowflake.prod.orders';

    DRAFT_STEPS.forEach((step, index) => {
      draftTimers.current.push(setTimeout(() => {
        const boundStepBlock = { ...step.block, bound: true, source: selectedSource };
        setDef(d => ({ ...d, blocks: [...d.blocks, boundStepBlock] }));
        updateLatestBuildMessage((msg) => ({
          ...msg,
          text: `Building page... ${index + 1}/${DRAFT_STEPS.length}`,
          buildProgress: {
            ...msg.buildProgress,
            current: index + 1,
            steps: msg.buildProgress.steps.map((s, sIdx) => ({
              ...s,
              status: sIdx < index + 1 ? 'done' : sIdx === index + 1 ? 'active' : 'pending',
            })),
          },
        }));

        if (index === DRAFT_STEPS.length - 1) {
          draftTimers.current.push(setTimeout(() => {
            setDef(d => ({
              ...d,
              title: 'Revenue Pulse',
              subtitle: 'Weekly revenue with region breakdown',
            }));
            setSelected('b1');
            updateLatestBuildMessage((msg) => ({
              ...msg,
              text: 'Draft complete. The page is ready to review in preview mode.',
              action: {
                title: 'Drafted page',
                diff: DRAFT_STEPS.map((s, i) => ({ op: 'add', path: `blocks[${i}] = ${s.block.type}` })),
              },
              buildProgress: {
                ...msg.buildProgress,
                current: DRAFT_STEPS.length,
                steps: msg.buildProgress.steps.map((s) => ({ ...s, status: 'done' })),
              },
            }));
            setGenerating(false);
          }, 900));
        }
      }, 900 + index * 900));
    });
  };

  const chooseSource = (source) => {
    setSelectedSources([source.id]);
    setSelectionStage('ready');
    setBuildStepsOpen(true);
    setMessages(m => [
      ...m,
      { role: 'user', text: `Use ${source.label}` },
      {
        role: 'kai',
        text: `Using ${source.label}. Building your page now...`,
        action: null,
        buildProgress: createBuildProgress(),
      },
    ]);
    startDraftBuild(source.id);
  };

  const promoteToStandard = ({ note } = {}) => {
    if (promoteTimerRef.current) clearTimeout(promoteTimerRef.current);
    setTransitionNote(note || 'Kai is setting up your workspace...');
    setIsPromoting(true);
    setBuilderStage('transition');
    promoteTimerRef.current = setTimeout(() => {
      setBuilderStage('standard');
      setIsPromoting(false);
      setTransitionNote('');
    }, 320);
  };

  const openPromptBuild = (prompt, sourceIds = []) => {
    const trimmedPrompt = (prompt || '').trim();
    if (!trimmedPrompt) return;

    const resolvedSourceIds = Array.isArray(sourceIds) ? sourceIds : (sourceIds ? [sourceIds] : []);
    completePromptBuild(trimmedPrompt, resolvedSourceIds);
  };

  const completePromptBuild = (prompt, sourceIds) => {
    const primarySourceId = sourceIds[0] || null;
    promoteToStandard({ note: 'Kai is turning your prompt into a first draft...' });
    setView('preview');
    setSelectionStage('ready');
    setBuildStepsOpen(true);
    setSelectedSources(sourceIds);
    setEntryPrompt(prompt);
    setInput('');
    setMessages(m => [
      ...m,
      { role: 'user', text: sourceIds.length > 1 ? `Use ${sourceIds.join(', ')}.` : sourceIds.length === 1 ? `Use ${sourceIds[0]}.` : 'Skip data for now.' },
      {
        role: 'kai',
        text: sourceIds.length > 0 ? `Using ${sourceIds.join(', ')}. Building your page now...` : 'Drafting your page now without data.',
        action: null,
        buildProgress: createBuildProgress(),
      },
    ]);
    startDraftBuild(primarySourceId);
  };

  const openTemplateBuild = (template) => {
    completeTemplateBuild(template, entrySelectedSourceIds);
  };

  const completeTemplateBuild = (template, sourceIds) => {
    const nextDef = {
      ...TEMPLATE_DEF,
      title: template.label,
      subtitle: template.prompt,
    };

    promoteToStandard({ note: `Kai is loading the ${template.label} template...` });
    setView('preview');
    setSelectionStage('ready');
    setSelected('b1');
    setDef(nextDef);
    setSelectedSources(sourceIds);
    setMessages(m => [
      ...m,
      { role: 'user', text: sourceIds.length > 1 ? `Use ${sourceIds.join(', ')}.` : sourceIds.length === 1 ? `Use ${sourceIds[0]}.` : 'Load template as is.' },
      {
        role: 'kai',
        text: `Loaded the ${template.label} template${sourceIds.length > 0 ? ` with ${sourceIds.length === 1 ? sourceIds[0] : sourceIds.length + ' sources'} selected` : ''}. You can refine the blocks, bind data, or edit in code view.`,
        action: { title: 'Loaded template', diff: [{ op: 'add', path: `${template.id} template` }] },
      },
    ]);
  };

  const openScratchBuild = (mode, gitConfig = null) => {
    promoteToStandard({ note: mode === 'git' ? 'Kai is opening your repository workspace...' : 'Kai is opening a blank builder workspace...' });
    setView('code');
    setSelectionStage('ready');
    setSelected(null);
    setDef(BLANK_DEF);
    setSelectedSources(entrySelectedSourceIds);
    setMessages([
      {
        role: 'kai',
        text: mode === 'git'
          ? `Git repository connected${gitConfig?.repositoryUrl ? ` (${gitConfig.repositoryUrl}${gitConfig.branch ? `#${gitConfig.branch}` : ''})` : ''}. The blank app definition is ready in code view.`
          : 'Blank code editor ready. Start from the app definition or ask Kai to scaffold the first version.',
        action: {
          title: mode === 'git' ? 'Connected Git repository' : 'Opened blank code editor',
          diff: [{ op: 'add', path: 'app definition = empty' }],
        },
      },
    ]);
  };

  const openGitConnectModal = () => {
    setGitConnectError('');
    setShowGitConnectModal(true);
  };

  const connectGitRepository = (nextDraft) => {
    const repositoryUrl = (nextDraft.repositoryUrl || '').trim();
    const branch = (nextDraft.branch || '').trim() || 'main';
    const normalized = { ...nextDraft, repositoryUrl, branch };

    if (!repositoryUrl) {
      setGitConnectError('Repository URL is required.');
      return;
    }

    if (!/^https?:\/\/.+\/.+/.test(repositoryUrl)) {
      setGitConnectError('Enter a valid repository URL, for example https://github.com/org/repo.');
      return;
    }

    setGitConnectError('');
    setGitConnectDraft(normalized);
    setShowGitConnectModal(false);
    openScratchBuild('git', normalized);
  };

  const selectedBlock = def.blocks.find(b => b.id === selected);
  const entrySelectedSources = SOURCE_OPTIONS.filter(source => entrySelectedSourceIds.includes(source.id));
  const entrySelectedSource = entrySelectedSources[0] || null;

  const toggleEntrySource = (sourceId) => {
    setEntrySelectedSourceIds(prev => (
      prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    ));
  };

  const appendEntryPromptToken = (token) => {
    setEntryPrompt(prev => (prev ? `${prev} ${token}` : token));
  };

  const submitEntryPrompt = () => {
    openPromptBuild(entryPrompt, entrySelectedSourceIds);
  };

  const sendPrompt = (text) => {
    if (selectionStage === 'source') return;
    if (!text.trim()) return;
    const userMsg = { role: 'user', text };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setGenerating(true);

    setTimeout(() => {
      const t = text.toLowerCase();
      if (t.includes('anomaly') || t.includes('alert')) {
        const newBlock = { id: 'b6', type: 'alert', bound: true, props: { title: 'Anomaly feed', rows: [
          { t: 'Revenue − 18% vs forecast', sub: 'Week 42 · North region', sev: 'warn' },
          { t: 'Orders spike + 312%', sub: 'Week 43 · bot traffic suspected', sev: 'info' },
        ] } };
        setGenBlockId('b6');
        setDef(d => ({ ...d, blocks: [...d.blocks, newBlock] }));
        setMessages(m => [...m, { role: 'kai', text: 'Added an anomaly feed below the table. It\'s bound to the same source — I flagged rows where weekly revenue deviates > 2σ from a rolling forecast.', action: { title: 'Added anomaly feed', diff: [{ op: 'add', path: 'blocks[5] = alert' }] } }]);
        setTimeout(() => setGenBlockId(null), 1400);
      } else if (t.includes('yoy') || t.includes('year')) {
        setMessages(m => [...m, { role: 'kai', text: 'Updated the revenue chart to overlay the same week last year as a dashed line.', action: { title: 'Updated chart · YoY overlay', diff: [{ op: 'mod', path: 'chart.series[+prior_year]' }] } }]);
      } else if (t.includes('remove') || t.includes('delete') || t.includes('drop')) {
        setDef(d => ({ ...d, blocks: d.blocks.filter(b => b.id !== 'b5') }));
        setMessages(m => [...m, { role: 'kai', text: 'Removed the top customers table. You can undo from the chip.', action: { title: 'Removed block', diff: [{ op: 'rm', path: 'blocks[4] = table' }] } }]);
      } else {
        setMessages(m => [...m, { role: 'kai', text: 'I can do that. Which region column should I use — orders.region_code or customers.country?', action: null }]);
      }
      setGenerating(false);
    }, 900);
  };

  const bindBlock = (blockId) => {
    setBindingTarget(blockId);
    setShowBinding(true);
  };

  const completeBinding = (blockId, source) => {
    setDef(d => ({ ...d, blocks: d.blocks.map(b => b.id === blockId ? { ...b, bound: true, source } : b) }));
    setShowBinding(false);
    setMessages(m => [...m, { role: 'kai', text: `Bound ${blockId === 'b3' ? 'the KPI row' : blockId === 'b4' ? 'the chart' : 'the block'} to ${source}. Preview is live.`, action: { title: 'Data bound', diff: [{ op: 'mod', path: `${blockId}.source = ${source}` }] } }]);
  };

  const bindAll = () => {
    const source = selectedSources[0] || 'snowflake.prod.orders';
    setDef(d => ({ ...d, blocks: d.blocks.map(b => ({ ...b, bound: true, source: b.source || source })) }));
    setMessages(m => [...m, { role: 'kai', text: `Bound all blocks to ${source}. Preview reflects the latest data.`, action: { title: 'Bound all blocks', diff: [{ op: 'mod', path: `all blocks.source = ${source}` }] } }]);
  };

  const reorderBlocks = React.useCallback((draggedId, targetId = null) => {
    if (!draggedId) return;
    if (targetId !== null && draggedId === targetId) return;

    setDef(d => {
      const fromIndex = d.blocks.findIndex(b => b.id === draggedId);
      if (fromIndex === -1) return d;

      const nextBlocks = [...d.blocks];
      const [movedBlock] = nextBlocks.splice(fromIndex, 1);

      if (targetId === null) {
        nextBlocks.push(movedBlock);
      } else {
        const toIndex = nextBlocks.findIndex(b => b.id === targetId);
        if (toIndex === -1) return d;
        nextBlocks.splice(toIndex, 0, movedBlock);
      }

      return { ...d, blocks: nextBlocks };
    });
  }, []);

  const unboundCount = def.blocks.filter(b => !b.bound).length;
  const backTarget = rawAppId && !rawAppId.startsWith('new') ? `detail:${rawAppId}` : 'directory';
  const activeApp = APPS.find(a => a.id === rawAppId);
  const builderAppName = appSettings.name || activeApp?.name || (builderStage !== 'standard' ? 'New app' : (isScratch ? 'New app (Scratch)' : isTemplate ? 'New app (Template)' : isNewAi ? 'New app (Kai draft)' : def.title));
  const builderAppDesc = activeApp?.desc || (isScratch ? 'Blank app in code mode.' : isTemplate ? 'Template selected, ready to customize.' : isNewAi ? 'Kai-generated app in progress.' : 'Builder session');
  const builderAppIcon = activeApp?.icon || 'DA';

  const syncSelectionFromCursor = (value, cursorPos) => {
    const beforeCursor = value.slice(0, cursorPos);
    const idPattern = /"id"\s*:\s*"([^"]+)"/g;
    let match;
    let lastId = null;
    while ((match = idPattern.exec(beforeCursor)) !== null) {
      lastId = match[1];
    }
    if (lastId && def.blocks.some(b => b.id === lastId)) {
      setSelected(lastId);
    }
  };

  const handleCodeChange = (value, cursorPos) => {
    setCodeText(value);
    syncSelectionFromCursor(value, cursorPos);
    try {
      const parsed = JSON.parse(value);
      if (!parsed || !Array.isArray(parsed.blocks)) return;
      setDef(parsed);
    } catch {
      // Keep editing experience fluid while JSON is temporarily invalid.
    }
  };

  React.useEffect(() => {
    const fallbackName = activeApp?.name || (builderStage !== 'standard' ? 'New app' : (def.title || 'New app'));
    setAppSettings(prev => ({
      ...prev,
      name: prev.name || fallbackName,
      urlSlug: prev.urlSlug || fallbackName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    }));
  }, [activeApp, builderStage, def.title]);

  const validateSettings = React.useCallback((settings) => {
    const errors = {};
    const name = (settings.name || '').trim();
    const slug = (settings.urlSlug || '').trim();

    if (!name) errors.name = 'App name is required.';
    if (!slug) {
      errors.urlSlug = 'URL slug is required.';
    } else {
      if (slug !== slug.toLowerCase()) errors.urlSlug = 'URL slug must be lowercase.';
      else if (slug.includes(' ')) errors.urlSlug = 'URL slug cannot contain spaces.';
      else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        errors.urlSlug = 'Use lowercase letters, numbers, and hyphens only.';
      } else if (!appSettings.isPublished && TAKEN_URL_SLUGS.has(slug)) {
        errors.urlSlug = 'This URL is already in use. Choose another slug.';
      }
    }

    return errors;
  }, [appSettings.isPublished]);

  const appUrl = `apps.keboola.io/${PROJECT_SLUG}/${appSettings.urlSlug || 'new-app'}`;

  const saveAppSettings = (nextSettings) => {
    const nextErrors = validateSettings(nextSettings);
    setSettingsErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setAppSettings(nextSettings);
    if (nextSettings.name && builderStage === 'standard') {
      setDef(d => ({ ...d, title: nextSettings.name }));
    }
    setPublishHint('');
    setShowAppSettings(false);
  };

  const handlePublish = () => {
    if (builderStage !== 'standard') return;

    const nextErrors = validateSettings(appSettings);
    setSettingsErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setPublishHint('Fix App Settings before publishing.');
      setShowAppSettings(true);
      return;
    }

    setAppSettings(prev => ({ ...prev, isPublished: true }));
    setPublishHint('Published successfully. URL is now locked.');
    setMessages(m => [...m, { role: 'kai', text: `Published ${appSettings.name || 'app'} at ${appUrl}.`, action: { title: 'Published app', diff: [{ op: 'mod', path: 'app.status = published' }] } }]);
  };

  return (
    <>
      <div className="content flush builder-shell">
        <div className="builder-layout">
          <div className="topbar builder-topbar">
            <div className="crumbs">
              <button className="builder-back-link topbar-back-link" onClick={() => navigate(backTarget)}>
                {I.chevronLeft}
              </button>
              <span className="c-sep">/</span>
              <span onClick={() => navigate('directory')} style={{ cursor: 'pointer' }}>Data Apps</span>
              <span className="c-sep">/</span>
              <span className="c-cur">{builderAppName}</span>
              {builderStage === 'standard' && (
                <Badge status={unboundCount > 0 ? 'unbound' : 'draft'}>
                  {unboundCount > 0 ? `${unboundCount} unbound` : 'Draft'}
                </Badge>
              )}
            </div>
            <div className="topbar-actions">
              <Btn variant="ghost" size="sm" icon={I.undo} disabled={builderStage !== 'standard'}>Undo</Btn>
              <Btn variant="ghost" size="sm" icon={I.redo} disabled={builderStage !== 'standard'}>Redo</Btn>
              <>
                <div style={{ width: 1, background: 'var(--border)', height: 20, margin: '0 4px' }} />
                <Btn variant="outline" size="sm" icon={I.settings} onClick={() => setShowAppSettings(true)}>App Settings</Btn>
                <Btn variant="outline" size="sm" icon={I.eye} disabled={builderStage !== 'standard'}>Preview</Btn>
                <Btn variant="primary" size="sm" icon={I.deploy} disabled={builderStage !== 'standard'} onClick={handlePublish}>Publish</Btn>
              </>
            </div>
          </div>

          {publishHint && (
            <div className={`builder-publish-hint ${publishHint.includes('Fix') ? 'error' : 'ok'}`}>
              {publishHint}
            </div>
          )}

          <div className={`builder ${builderStage === 'entry' ? 'builder-entry-mode' : ''}${builderStage === 'transition' ? ' builder-transitioning' : ''}${isPromoting ? ' promoting' : ''}`}>
          {builderStage !== 'entry' && (
          <div className="b-chat">
            <div className="b-chat-header">
              <div className="kai-avatar">K</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="kai-name">Kai</div>
                <div className="kai-state">{builderStage === 'transition' ? 'preparing workspace...' : (selectionStage === 'source' ? 'waiting for source' : generating ? 'drafting changes…' : 'ready')}</div>
              </div>
              <button className="btn-ghost" style={{ padding: 4, borderRadius: 4, color: 'var(--text-3)' }}>{I.more}</button>
            </div>

            {builderStage === 'transition' ? (
              <div className="chat-stream chat-transitioning">
                <div className="msg">
                  <div className="msg-avatar kai">K</div>
                  <div className="msg-body">
                    <div className="msg-author">Kai</div>
                    <div className="msg-text">{transitionNote || 'Setting up your builder session...'}</div>
                    <div className="kai-streaming"><span /><span /><span /></div>
                  </div>
                </div>
              </div>
            ) : (
            <div className="chat-stream" ref={streamRef}>
              {messages.map((m, i) => (
                <div key={i} className="msg">
                  <div className={`msg-avatar ${m.role}`}>{m.role === 'kai' ? 'K' : 'JN'}</div>
                  <div className="msg-body">
                    <div className="msg-author">
                      {m.role === 'kai' ? 'Kai' : 'You'}
                      <span className="time">{i === 0 ? '14:02' : i === 1 ? '14:02' : 'just now'}</span>
                    </div>
                    <div className="msg-text">{m.text}</div>
                    {m.buildProgress && (
                      <div style={{ marginTop: 8, padding: 10, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface-2)' }}>
                        <button
                          className="btn-ghost btn-sm"
                          style={{ fontSize: 11, padding: 0, marginBottom: buildStepsOpen ? 8 : 0 }}
                          onClick={() => setBuildStepsOpen(open => !open)}
                        >
                          {buildStepsOpen ? 'Hide steps' : 'Show steps'} · {m.buildProgress.current}/{m.buildProgress.total}
                        </button>
                        {buildStepsOpen && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {m.buildProgress.steps.map((step, stepIdx) => (
                              <div key={stepIdx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: step.status === 'pending' ? 'var(--text-3)' : 'var(--text-2)' }}>
                                <span style={{ width: 14, textAlign: 'center', color: step.status === 'done' ? 'var(--live)' : 'var(--text-3)' }}>
                                  {step.status === 'done' ? '✓' : step.status === 'active' ? '…' : '○'}
                                </span>
                                <span>{step.label}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {m.action && (
                      <div className="action-chip">
                        <div className="action-chip-main">
                          <div className="action-chip-title">{I.sparkle} {m.action.title}</div>
                          <div className="action-chip-diff">
                            {m.action.diff.map((d, j) => (
                              <span key={j} className={d.op === 'rm' ? 'rm' : 'add'}>
                                {d.op === 'rm' ? '−' : '+'} {d.path}{j < m.action.diff.length - 1 ? ' · ' : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="action-chip-actions">
                          <button title="Show diff">{I.code}</button>
                          <button title="Undo">{I.undo}</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {generating && (
                <div className="msg">
                  <div className="msg-avatar kai">K</div>
                  <div className="msg-body">
                    <div className="msg-author">Kai</div>
                    <div className="kai-streaming"><span /><span /><span /></div>
                  </div>
                </div>
              )}
            </div>
            )}

            {builderStage !== 'transition' && (
            <div className="chat-composer">
              {selectionStage === 'source' && (
                <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: 14, background: 'var(--surface-2)', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Pick a data source</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                    {SOURCE_OPTIONS.map(source => (
                      <button key={source.id} className="create-path" style={{ padding: 12, textAlign: 'left' }} onClick={() => chooseSource(source)}>
                        <div className="mono" style={{ fontSize: 11 }}>{source.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>{source.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="chat-suggest" style={{ paddingTop: 0, paddingBottom: 8 }}>
                <button className="chat-suggest-chip" onClick={() => sendPrompt('Add an anomaly feed under the table')}>+ Anomaly feed</button>
                <button className="chat-suggest-chip" onClick={() => sendPrompt('Make the chart show YoY comparison')}>YoY overlay</button>
                <button className="chat-suggest-chip" onClick={() => sendPrompt('Remove the top customers table')}>Remove table</button>
              </div>

              <div className="chat-box">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendPrompt(input); } }}
                  placeholder={selectionStage === 'source' ? 'Select a data source from above to begin.' : 'Ask Kai to modify the app…'}
                  disabled={selectionStage === 'source'}
                />
                <div className="chat-box-footer">
                  <button className="btn-ghost btn-sm" style={{ fontSize: 11 }}>{I.database} @table</button>
                  <button className="btn-ghost btn-sm" style={{ fontSize: 11 }}>{I.code} /block</button>
                  <div style={{ marginLeft: 'auto' }}>
                    <Btn variant="accent" size="sm" icon={I.arrow} onClick={() => sendPrompt(input)} disabled={selectionStage === 'source' || !input.trim() || generating} />
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>
          )}

          <div className={`b-preview ${builderStage === 'transition' ? 'is-revealing' : ''}`}>
            {builderStage === 'entry' ? (
              <div className="builder-entry-main-surface">
                <div className="builder-entry-hero">
                  <h1>What do you want to build?</h1>
                  <p>Describe the app, start from a template, or begin from scratch.</p>
                  <div className="builder-entry-composer">
                    <textarea
                      value={entryPrompt}
                      onChange={(e) => setEntryPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          submitEntryPrompt();
                        }
                      }}
                      placeholder={entrySelectedSource ? `Describe the app you want to build using ${entrySelectedSource.label}...` : 'Describe the app you want to build...'}
                    />
                    <div className="builder-entry-composer-footer">
                      <div className="builder-entry-input-actions">
                        <button className="btn-ghost btn-sm" onClick={() => appendEntryPromptToken(entrySelectedSource ? `@table:${entrySelectedSource.label}` : '@table')}>
                          {I.database} Attach table
                        </button>
                        <button className="btn-ghost btn-sm" onClick={() => appendEntryPromptToken('@app:Revenue Pulse')}>
                          {I.copy} Reference app
                        </button>
                      </div>
                      <Btn variant="accent" size="sm" icon={I.arrow} onClick={submitEntryPrompt} disabled={!entryPrompt.trim()}>
                        Build with Kai
                      </Btn>
                    </div>
                  </div>
                      {entrySelectedSources.length > 0 && (
                    <div className="builder-entry-context">Using <span className="mono">{entrySelectedSources.map(source => source.label).join(', ')}</span> as optional context.</div>
                  )}

                  <div className="builder-entry-scratch">
                    <div>
                      <div className="builder-entry-scratch-title">Start from scratch</div>
                      <div className="builder-entry-scratch-copy">For users who want full control.</div>
                    </div>
                    <div className="builder-entry-scratch-actions">
                      <Btn variant="outline" size="sm" icon={I.git} onClick={openGitConnectModal}>Connect Git repository</Btn>
                      <Btn variant="outline" size="sm" icon={I.code} onClick={() => openScratchBuild('code')}>Open blank code editor</Btn>
                    </div>
                  </div>

                  <div className="builder-entry-template-divider" aria-hidden="true" />

                  <div className="builder-entry-section">
                    <div className="builder-entry-section-title">Template suggestions</div>
                    {(() => {
                      const categories = ['All', ...Array.from(new Set(ENTRY_TEMPLATES.map(t => t.category)))];
                      const selectedCategory = templateFilterCategory || 'All';
                      const filteredTemplates = selectedCategory === 'All' ? ENTRY_TEMPLATES : ENTRY_TEMPLATES.filter(t => t.category === selectedCategory);
                      return (
                        <>
                          <div className="builder-entry-template-filters">
                            {categories.map(cat => (
                              <button
                                key={cat}
                                className={`builder-entry-filter-tab ${selectedCategory === cat ? 'active' : ''}`}
                                onClick={() => setTemplateFilterCategory(cat === 'All' ? null : cat)}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                          <div className="builder-entry-template-grid">
                            {filteredTemplates.map((template) => (
                              <button
                                key={template.id}
                                className="builder-entry-template-card"
                                onClick={() => openTemplateBuild(template)}
                              >
                                <div className={`builder-entry-template-preview preview-${template.preview}`} aria-hidden="true">
                                  <span className="template-preview-pill" />
                                  <span className="template-preview-line short" />
                                  <span className="template-preview-line mid" />
                                  <span className="template-preview-line long" />
                                  <span className="template-preview-block a" />
                                  <span className="template-preview-block b" />
                                  <span className="template-preview-block c" />
                                </div>
                                <div className="builder-entry-template-meta">
                                  <div className="builder-entry-template-name">{template.label}</div>
                                  <div className="builder-entry-template-desc">{template.desc}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="preview-chrome">
                  <div className="preview-url">{I.globe}<span>apps.keboola.io/jan/revenue-pulse</span></div>
                  {unboundCount > 0 && <Btn variant="outline" size="sm" icon={I.link} onClick={bindAll}>Bind {unboundCount} blocks</Btn>}
                  <div className="device-toggle">
                    <button className={device === 'desktop' ? 'active' : ''} onClick={() => setDevice('desktop')}>{I.monitor}</button>
                    <button className={device === 'tablet' ? 'active' : ''} onClick={() => setDevice('tablet')}>{I.tablet}</button>
                    <button className={device === 'mobile' ? 'active' : ''} onClick={() => setDevice('mobile')}>{I.smartphone}</button>
                  </div>
                  <div className="view-toggle">
                    <button className={view === 'preview' ? 'active' : ''} onClick={() => setView('preview')}>Preview</button>
                    <button className={view === 'code' ? 'active' : ''} onClick={() => setView('code')}>Code</button>
                  </div>
                  <Btn variant="ghost" size="sm" icon={I.refresh} />
                </div>
                {view === 'preview' && (
                  <div className="preview-canvas">
                    <div className={`preview-frame ${device}`}>
                      <div className="app-canvas">
                        {def.blocks.map(b => (
                          <AppBlock key={b.id} block={b} selected={selected === b.id} generating={genBlockId === b.id} onSelect={() => setSelected(b.id)} onBind={() => bindBlock(b.id)} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {view === 'code' && (
                  <div className="code-mode-layout" ref={codeModeLayoutRef}>
                    <div className={`code-preview-panel ${codePreviewCollapsed ? 'collapsed' : ''}`}>
                      <div className="code-preview-header">
                        <span>Live preview</span>
                        <button className="btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => setCodePreviewCollapsed(c => !c)}>
                          {codePreviewCollapsed ? 'Show' : 'Hide'}
                        </button>
                      </div>
                      <div className={`code-preview-canvas-wrap ${codePreviewCollapsed ? 'collapsed' : ''}`} aria-hidden={codePreviewCollapsed}>
                        <div className="code-preview-canvas">
                          <div className={`preview-frame ${device}`}>
                            <div className="app-canvas">
                              {def.blocks.map(b => (
                                <AppBlock key={b.id} block={b} selected={selected === b.id} generating={genBlockId === b.id} onSelect={() => setSelected(b.id)} onBind={() => bindBlock(b.id)} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`code-resizer ${codePreviewCollapsed ? 'collapsed' : ''}`}
                      role="separator"
                      aria-orientation="horizontal"
                      aria-label="Resize code editor"
                      onMouseDown={startCodeResize}
                    />
                    <div
                      ref={codeViewRef}
                      className={`code-view ${codeViewHeight && !codePreviewCollapsed ? 'resized' : ''}`}
                      style={codeViewHeight && !codePreviewCollapsed
                        ? { minHeight: MIN_CODE_HEIGHT, height: codeViewHeight, flex: '0 0 auto' }
                        : { minHeight: MIN_CODE_HEIGHT }}
                    >
                      <div className="code-editor-layout">
                        <aside className="code-file-sidebar" aria-label="Code explorer">
                          <div className="code-file-sidebar-header">Explorer</div>
                          <div className="code-file-tree">
                            <button className="code-file-folder-row" onClick={() => setExplorerOpen(prev => ({ ...prev, root: !prev.root }))}>
                              {explorerOpen.root ? I.chevronDown : I.chevronRight}
                              <span>root</span>
                            </button>
                            {explorerOpen.root && CODE_EXPLORER_FILES.filter(file => file.section === 'root').map(file => (
                              <button
                                key={file.id}
                                className={`code-file-item ${activeCodeFile === file.id ? 'active' : ''}`}
                                onClick={() => setActiveCodeFile(file.id)}
                              >
                                <span className="code-file-icon">{I.blank}</span>
                                <span>{file.label}</span>
                              </button>
                            ))}

                            <button className="code-file-folder-row nested" onClick={() => setExplorerOpen(prev => ({ ...prev, src: !prev.src }))}>
                              {explorerOpen.src ? I.chevronDown : I.chevronRight}
                              <span>src</span>
                            </button>
                            {explorerOpen.src && (
                              <>
                                {CODE_EXPLORER_FILES.filter(file => file.section === 'src').map(file => (
                              <button
                                key={file.id}
                                className={`code-file-item nested-file-src ${activeCodeFile === file.id ? 'active' : ''}`}
                                onClick={() => setActiveCodeFile(file.id)}
                              >
                                <span className="code-file-icon">{I.code}</span>
                                <span>{file.label}</span>
                              </button>
                                ))}
                                <button className="code-file-folder-row nested deeper" onClick={() => setExplorerOpen(prev => ({ ...prev, components: !prev.components }))}>
                                  {explorerOpen.components ? I.chevronDown : I.chevronRight}
                                  <span>components</span>
                                </button>
                              </>
                            )}
                            {explorerOpen.src && explorerOpen.components && CODE_EXPLORER_FILES.filter(file => file.section === 'src/components').map(file => (
                              <button
                                key={file.id}
                                className={`code-file-item nested-file ${activeCodeFile === file.id ? 'active' : ''}`}
                                onClick={() => setActiveCodeFile(file.id)}
                              >
                                <span className="code-file-icon">{I.code}</span>
                                <span>{file.label}</span>
                              </button>
                            ))}
                          </div>
                        </aside>

                        <div className="code-editor-pane">
                          <div className="code-editor-tabbar">
                            <div className="code-editor-tab active">{CODE_EXPLORER_FILES.find(file => file.id === activeCodeFile)?.label || 'app-definition.json'}</div>
                          </div>
                          <textarea
                            ref={codeEditorRef}
                            value={activeCodeFileText}
                            onChange={(e) => {
                              if (!isEditingAppDefinition) return;
                              handleCodeChange(e.target.value, e.target.selectionStart);
                            }}
                            onClick={(e) => {
                              if (!isEditingAppDefinition) return;
                              syncSelectionFromCursor(e.currentTarget.value, e.currentTarget.selectionStart);
                            }}
                            onKeyUp={(e) => {
                              if (!isEditingAppDefinition) return;
                              syncSelectionFromCursor(e.currentTarget.value, e.currentTarget.selectionStart);
                            }}
                            readOnly={!isEditingAppDefinition}
                            spellCheck={false}
                            style={{ width: '100%', height: '100%', fontFamily: 'var(--font-mono)', fontSize: 12, padding: 16, border: 'none', outline: 'none', background: 'var(--surface)', color: 'var(--text)' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {builderStage !== 'entry' && (
          <div className="b-inspect">
            <div className="inspect-tabs">
              <button
                className={`inspect-tab ${tab === 'tree' ? 'active' : ''}`}
                onClick={() => setTab('tree')}
              >
                Structure
              </button>
              <button
                className={`inspect-tab ${tab === 'data' ? 'active' : ''}`}
                onClick={() => setTab('data')}
              >
                Data
              </button>
            </div>
            <div className="inspect-body">
              {tab === 'tree' && (
                <div>
                  <BlockTree def={def} selected={selected} onSelect={setSelected} pageOpen={treePageOpen} blocksOpen={treeBlocksOpen} toggleOpen={section => {
                    if (section === 'page') setTreePageOpen(open => !open);
                    if (section === 'blocks') setTreeBlocksOpen(open => !open);
                  }} onReorderBlocks={reorderBlocks} />
                  <div style={{ marginTop: 20 }}>
                    <Inspector block={selectedBlock} onBind={() => bindBlock(selected)} />
                  </div>
                </div>
              )}
              {tab === 'data' && (
                <DataSources
                  selectedSources={selectedSources}
                  onToggleSource={(id) => setSelectedSources(prev =>
                    prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
                  )}
                />
              )}
            </div>
          </div>
          )}
        </div>
      </div>
      </div>

      {showBinding && <BindingSheet blockId={bindingTarget} onClose={() => setShowBinding(false)} onComplete={completeBinding} />}
      {showAppSettings && (
        <AppSettingsModal
          settings={appSettings}
          errors={settingsErrors}
          projectSlug={PROJECT_SLUG}
          onClose={() => setShowAppSettings(false)}
          onSave={saveAppSettings}
        />
      )}
      {showGitConnectModal && (
        <ConnectGitModal
          draft={gitConnectDraft}
          error={gitConnectError}
          onClose={() => {
            setGitConnectError('');
            setShowGitConnectModal(false);
          }}
          onConnect={connectGitRepository}
        />
      )}
    </>
  );
};

/* ==== APP BLOCK RENDERERS ==== */
const AppBlock = ({ block, selected, generating, onSelect, onBind }) => {
  const labelMap = { header: 'Header', filters: 'Filter bar', kpis: 'KPI row', chart: 'Chart', table: 'Table', alert: 'Alert feed' };
  return (
    <div
      className={`app-block editable ${selected ? 'selected' : ''} ${generating ? 'generating' : ''}`}
      data-label={labelMap[block.type]}
      onClick={e => { e.stopPropagation(); onSelect(); }}
    >
      {!block.bound && block.type !== 'header' && block.type !== 'filters' && (
        <div className="block-unbound-flag">
          <button className="badge badge-unbound" style={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); onBind(); }}>
            <span className="dot" /> Unbound · Bind data
          </button>
        </div>
      )}
      <div className="app-block-inner">
        {block.type === 'header' && <BlockHeader {...block.props} />}
        {block.type === 'filters' && <BlockFilters {...block.props} />}
        {block.type === 'kpis' && <BlockKPIs {...block.props} bound={block.bound} />}
        {block.type === 'chart' && <BlockChart {...block.props} bound={block.bound} />}
        {block.type === 'table' && <BlockTable {...block.props} bound={block.bound} />}
        {block.type === 'alert' && <BlockAlert {...block.props} />}
      </div>
    </div>
  );
};

const BlockHeader = ({ title, subtitle }) => (
  <div className="ab-header">
    <h1>{title}</h1>
    <p>{subtitle}</p>
  </div>
);

const BlockFilters = ({ items }) => (
  <div className="ab-filters">
    {items.map((f, i) => (
      <div key={i} className="ab-select">
        <span style={{ color: 'var(--text-3)', fontSize: 11 }}>{f.label}:</span>
        <span>{f.value}</span>
        <span style={{ color: 'var(--text-3)' }}>{I.chevronDown}</span>
      </div>
    ))}
  </div>
);

const Placeholder = ({ w = 60 }) => <span className="placeholder-value placeholder-inline" style={{ width: w }}>—</span>;

const BlockKPIs = ({ items, bound }) => {
  // deterministic values if bound
  const resolved = bound ? [
    { label: 'Gross revenue', value: '$4.28M', trend: { dir: 'up', amt: '+12.4%' } },
    { label: 'Orders', value: '18,442', trend: { dir: 'up', amt: '+8.1%' } },
    { label: 'AOV', value: '$232.10', trend: { dir: 'up', amt: '+3.9%' } },
    { label: 'Refund rate', value: '2.14%', trend: { dir: 'down', amt: '−0.4pp' } },
  ] : items;
  return (
    <div className="ab-kpi-row">
      {resolved.map((k, i) => (
        <div key={i} className="ab-kpi">
          <div className="ab-kpi-label">{k.label}</div>
          <div className="ab-kpi-value">{bound ? k.value : <Placeholder w={84} />}</div>
          {bound && k.trend ? (
            <div className={`ab-kpi-trend ${k.trend.dir}`}>
              {k.trend.dir === 'up' ? '↑' : '↓'} {k.trend.amt} <span style={{ color: 'var(--text-3)' }}>vs prev</span>
            </div>
          ) : (
            <div className="ab-kpi-trend" style={{ color: 'var(--text-4)' }}>
              <Placeholder w={60} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const BlockChart = ({ title, sub, bound }) => (
  <div className="ab-chart">
    <div className="ab-chart-head">
      <div>
        <div className="ab-chart-title">{title}</div>
        <div className="ab-chart-sub">{sub}</div>
      </div>
      <button className="filter-chip" style={{ height: 26, fontSize: 11 }}>Weekly {I.chevronDown}</button>
    </div>
    <div className="ab-chart-body">
      {bound ? <ChartFilled /> : <ChartPlaceholder />}
    </div>
  </div>
);

const ChartFilled = ({ interactive = false, labels }) => {
  const data = [112, 126, 136, 118, 142, 154, 145, 161, 172, 168, 182, 194, 206, 220];
  const prior = [96, 108, 116, 120, 126, 131, 138, 142, 149, 153, 158, 162, 168, 174];
  const dayLabels = labels && labels.length === data.length
    ? labels
    : ['Apr 8', 'Apr 9', 'Apr 10', 'Apr 11', 'Apr 12', 'Apr 13', 'Apr 14', 'Apr 15', 'Apr 16', 'Apr 17', 'Apr 18', 'Apr 19', 'Apr 20', 'Apr 21'];
  const max = 250;
  const w = 2400, h = 170;
  const [activeIndex, setActiveIndex] = React.useState(data.length - 1);
  const [hoverPos, setHoverPos] = React.useState({ x: 0, y: 0 });
  const containerRef = React.useRef(null);
  const activeValue = data[activeIndex];
  const activePrior = prior[activeIndex];
  const delta = activeValue - activePrior;
  const deltaSign = delta >= 0 ? '+' : '−';
  const deltaClass = delta >= 0 ? 'up' : 'down';
  const activeX = (activeIndex / (data.length - 1)) * w;
  const activeY = h - (activeValue / max) * h;
  const path = (arr) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i / (arr.length - 1)) * w} ${h - (v / max) * h}`).join(' ');
  const updateHoverFromEvent = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const relY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    const ratio = rect.width > 0 ? relX / rect.width : 0;
    const idx = Math.max(0, Math.min(data.length - 1, Math.round(ratio * (data.length - 1))));
    setActiveIndex(idx);
    setHoverPos({ x: relX, y: relY });
  };
  const chartSvg = (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      {[0.25, 0.5, 0.75].map(f => <line key={f} x1="0" x2={w} y1={h * f} y2={h * f} stroke="var(--border)" strokeDasharray="2 4" />)}
      <path d={`${path(data)} L ${w} ${h} L 0 ${h} Z`} fill="var(--accent-soft)" opacity="0.5" />
      <path d={path(data)} stroke="var(--accent)" strokeWidth="2" fill="none" />
      <path d={path(prior)} stroke="var(--text-3)" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />
      {data.map((v, i) => (
        <circle
          key={i}
          cx={(i / (data.length - 1)) * w}
          cy={h - (v / max) * h}
          r={interactive && i === activeIndex ? '4' : '2.5'}
          fill="var(--accent)"
        />
      ))}
      {interactive && (
        <>
          <line x1={activeX} x2={activeX} y1="0" y2={h} stroke="var(--accent)" strokeDasharray="2 4" opacity="0.55" />
          <circle cx={activeX} cy={activeY} r="5.5" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2" />
          <rect x="0" y="0" width={w} height={h} fill="transparent" style={{ cursor: 'crosshair' }} onMouseMove={updateHoverFromEvent} onMouseEnter={updateHoverFromEvent} />
        </>
      )}
    </svg>
  );

  if (!interactive) return chartSvg;

  const tooltipLeft = Math.max(8, Math.min(hoverPos.x + 14, (containerRef.current?.clientWidth || 0) - 146));
  const tooltipTop = Math.max(8, Math.min(hoverPos.y - 18, (containerRef.current?.clientHeight || 0) - 82));

  return (
    <div ref={containerRef} style={{ position: 'relative', height: '100%' }} onMouseLeave={() => setActiveIndex(data.length - 1)}>
      {chartSvg}
      <div style={{ position: 'absolute', top: tooltipTop, left: tooltipLeft, pointerEvents: 'none', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 9px', boxShadow: 'var(--shadow-sm)', minWidth: 132 }}>
        <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{dayLabels[activeIndex]}</div>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{activeValue} views</div>
        <div style={{ fontSize: 11, marginTop: 1 }}>
          <span style={{ color: 'var(--text-3)' }}>vs previous: </span>
          <span className={`ab-kpi-trend ${deltaClass}`} style={{ fontSize: 11 }}>
            {deltaSign}{Math.abs(delta)}
          </span>
        </div>
      </div>
    </div>
  );
};

const ChartPlaceholder = () => (
  <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--text-3)' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'inline-block', width: 28, height: 28, borderRadius: 6, background: 'var(--surface-2)', border: '1px dashed var(--border-strong)', display: 'grid', placeItems: 'center', marginBottom: 8 }}>
        {I.chart}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Chart will render once bound to a table</div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>expects: date × number series</div>
    </div>
  </div>
);

const BlockTable = ({ title, sub, bound }) => {
  const rows = bound ? [
    ['Acme Corp', 'Enterprise', '$284,102', '142', '↑ 12%'],
    ['Northwind', 'Mid-market', '$198,420', '98', '↑ 4%'],
    ['Globex', 'Enterprise', '$172,004', '76', '↓ 2%'],
    ['Initech', 'SMB', '$142,930', '210', '↑ 28%'],
    ['Soylent', 'Mid-market', '$118,204', '64', '→ 0%'],
  ] : Array(5).fill(['', '', '', '', '']);
  return (
    <div className="ab-table">
      <div className="ab-table-head">
        <div>
          <h3>{title}</h3>
          <p>{sub}</p>
        </div>
        <button className="filter-chip" style={{ height: 26, fontSize: 11 }}>Top 10 {I.chevronDown}</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Customer</th><th>Tier</th><th>Revenue</th><th>Orders</th><th>Δ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (
                <td key={j} className={j >= 2 ? 'mono' : ''}>
                  {bound ? cell : <Placeholder w={j === 0 ? 120 : 60} />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const BlockAlert = ({ title, rows }) => (
  <div className="ab-chart">
    <div className="ab-chart-head">
      <div>
        <div className="ab-chart-title">{title}</div>
        <div className="ab-chart-sub">Detected by Kai · last 7 days</div>
      </div>
      <span className="badge badge-kai">{I.kai} Kai</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ padding: '10px 12px', background: r.sev === 'warn' ? 'var(--warn-soft)' : 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: r.sev === 'warn' ? 'var(--warn)' : 'var(--text-2)' }}>{r.sev === 'warn' ? I.alert : I.info}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{r.t}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{r.sub}</div>
          </div>
          <Btn variant="outline" size="xs">Investigate</Btn>
        </div>
      ))}
    </div>
  </div>
);

/* ==== INSPECTOR PANELS ==== */
const BlockTree = ({ def, selected, onSelect, pageOpen, blocksOpen, toggleOpen, onReorderBlocks }) => {
  const selectedBlock = def.blocks.find(b => b.id === selected);
  const showPage = pageOpen || selected === 'page';
  const showBlocks = blocksOpen || !!selectedBlock;
  const [draggedBlockId, setDraggedBlockId] = React.useState(null);
  const [dropTargetBlockId, setDropTargetBlockId] = React.useState(null);

  const beginDrag = (e, blockId) => {
    setDraggedBlockId(blockId);
    setDropTargetBlockId(null);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', blockId);
  };

  const handleDrop = (e, targetId = null) => {
    e.preventDefault();
    const draggedId = draggedBlockId || e.dataTransfer.getData('text/plain');
    if (draggedId) onReorderBlocks(draggedId, targetId);
    setDraggedBlockId(null);
    setDropTargetBlockId(null);
  };

  const handleDragEnd = () => {
    setDraggedBlockId(null);
    setDropTargetBlockId(null);
  };

  return (
    <div>
      <div className="inspect-group-header" onClick={() => toggleOpen('page')}>
        <div className="inspect-group-label">Page</div>
        <div className={`collapse-icon ${pageOpen ? 'open' : ''}`}>{I.chevronDown}</div>
      </div>
      {showPage && (
        <div className={`tree-node ${selected === 'page' ? 'selected' : ''}`}>{I.folder} {def.title}</div>
      )}
      <div className="inspect-group-header" onClick={() => toggleOpen('blocks')} style={{ marginTop: 16 }}>
        <div className="inspect-group-label">Blocks</div>
        <div className={`collapse-icon ${blocksOpen ? 'open' : ''}`}>{I.chevronDown}</div>
      </div>
      {showBlocks && (
        <>
          {blocksOpen ? def.blocks.map(b => (
            <div
              key={b.id}
              className={`tree-node indent-1 draggable ${selected === b.id ? 'selected' : ''} ${draggedBlockId === b.id ? 'dragging' : ''} ${dropTargetBlockId === b.id ? 'drop-target' : ''}`}
              draggable
              onDragStart={(e) => beginDrag(e, b.id)}
              onDragOver={(e) => {
                e.preventDefault();
                if (draggedBlockId && draggedBlockId !== b.id) setDropTargetBlockId(b.id);
              }}
              onDrop={(e) => handleDrop(e, b.id)}
              onDragEnd={handleDragEnd}
              onClick={() => onSelect(b.id)}
            >
              <span className="tree-drag-handle" title="Drag to reorder" aria-hidden="true">{I.more}</span>
              {b.type === 'header' && I.text}
              {b.type === 'filters' && I.filter}
              {b.type === 'kpis' && I.trend}
              {b.type === 'chart' && I.chart}
              {b.type === 'table' && I.table}
              {b.type === 'alert' && I.alert}
              <span>{b.type} <span style={{ color: 'var(--text-3)' }}>#{b.id}</span></span>
              {!b.bound && b.type !== 'header' && b.type !== 'filters' && (
                <span className="tree-status" style={{ color: 'var(--warn)' }}>⚠</span>
              )}
              {b.bound && b.source && (
                <span className="tree-status" style={{ color: 'var(--live)' }}>●</span>
              )}
            </div>
          )) : (
            selectedBlock && (
              <div
                className={`tree-node indent-1 selected`}
                onClick={() => onSelect(selectedBlock.id)}
              >
                {selectedBlock.type === 'header' && I.text}
                {selectedBlock.type === 'filters' && I.filter}
                {selectedBlock.type === 'kpis' && I.trend}
                {selectedBlock.type === 'chart' && I.chart}
                {selectedBlock.type === 'table' && I.table}
                {selectedBlock.type === 'alert' && I.alert}
                <span>{selectedBlock.type} <span style={{ color: 'var(--text-3)' }}>#{selectedBlock.id}</span></span>
                {!selectedBlock.bound && selectedBlock.type !== 'header' && selectedBlock.type !== 'filters' && (
                  <span className="tree-status" style={{ color: 'var(--warn)' }}>⚠</span>
                )}
                {selectedBlock.bound && selectedBlock.source && (
                  <span className="tree-status" style={{ color: 'var(--live)' }}>●</span>
                )}
              </div>
            )
          )}
          {blocksOpen && (
            <div
              className={`tree-drop-zone ${dropTargetBlockId === '__end' ? 'active' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                if (draggedBlockId) setDropTargetBlockId('__end');
              }}
              onDrop={(e) => handleDrop(e, null)}
            >
              Drag blocks to reorder
            </div>
          )}
        </>
      )}
    </div>
  );
};

const Inspector = ({ block, onBind }) => {
  if (!block) return <div style={{ color: 'var(--text-3)', fontSize: 12 }}>Select a block</div>;
  return (
    <>
      <div className="inspect-group">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{block.type}</div>
          <span className="badge badge-outline mono">#{block.id}</span>
        </div>
      </div>

      <div className="inspect-group">
        <div className="inspect-group-label">Data binding</div>
        <button className={`data-pill ${block.bound ? 'bound' : 'unbound'}`} onClick={onBind}>
          <span className="pill-icon">{block.bound ? I.link : I.unlink}</span>
          <span style={{ flex: 1, textAlign: 'left' }}>
            {block.bound ? (block.source || 'snowflake.prod.orders') : 'No source bound'}
          </span>
          <span>{I.chevronRight}</span>
        </button>
        {!block.bound && (
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, lineHeight: 1.4 }}>
            This block needs a table to render real data. Values render as placeholders until bound.
          </div>
        )}
      </div>

      {block.type === 'chart' && (
        <>
          <div className="inspect-group">
            <div className="inspect-group-label">Axes</div>
            <div className="inspect-field">
              <div className="inspect-field-label">X — dimension</div>
              <div className="ab-select" style={{ width: '100%', justifyContent: 'space-between' }}>
                <span className="mono">week(order_date)</span><span style={{ color: 'var(--text-3)' }}>{I.chevronDown}</span>
              </div>
            </div>
            <div className="inspect-field">
              <div className="inspect-field-label">Y — measure</div>
              <div className="ab-select" style={{ width: '100%', justifyContent: 'space-between' }}>
                <span className="mono">sum(amount)</span><span style={{ color: 'var(--text-3)' }}>{I.chevronDown}</span>
              </div>
            </div>
            <div className="inspect-field">
              <div className="inspect-field-label">Split by</div>
              <div className="ab-select" style={{ width: '100%', justifyContent: 'space-between' }}>
                <span className="mono">region</span><span style={{ color: 'var(--text-3)' }}>{I.chevronDown}</span>
              </div>
            </div>
          </div>
          <div className="inspect-group">
            <div className="inspect-group-label">Style</div>
            <div className="inspect-field">
              <div className="inspect-field-label">Chart type</div>
              <div className="tweaks-row">
                {['Line', 'Area', 'Bar', 'Stack'].map((t, i) => (
                  <button key={t} className={`tweaks-btn ${i === 1 ? 'active' : ''}`}>{t}</button>
                ))}
              </div>
            </div>
            <div className="inspect-field">
              <div className="inspect-field-label">Overlay</div>
              <label style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center', color: 'var(--text-2)' }}>
                <input type="checkbox" defaultChecked />
                Year-over-year (dashed)
              </label>
            </div>
          </div>
        </>
      )}

      {block.type === 'kpis' && (
        <div className="inspect-group">
          <div className="inspect-group-label">KPI list · 4 items</div>
          {['Gross revenue','Orders','AOV','Refund rate'].map((k, i) => (
            <div key={k} className="ab-select" style={{ width: '100%', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12 }}>{k}</span>
              <span className="mono" style={{ color: 'var(--text-3)', fontSize: 10 }}>sum(amount)</span>
            </div>
          ))}
          <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'flex-start' }}>{I.plus} Add KPI</button>
        </div>
      )}

      <div className="inspect-group">
        <div className="inspect-group-label">Visibility</div>
        <div className="tweaks-row">
          <button className="tweaks-btn active">Everyone</button>
          <button className="tweaks-btn">Role-based</button>
        </div>
      </div>

      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--err)', width: '100%' }}>Remove block</button>
    </>
  );
};

const DataSources = ({ selectedSources = ['snowflake.prod.orders'], onToggleSource, hideEmptyUsed = false }) => {
  const usedSet = new Set(selectedSources);
  const availableSources = DATA_SOURCES.filter(s => !usedSet.has(s.id));
  const usedSources = DATA_SOURCES.filter(s => usedSet.has(s.id));

  return (
  <div>
    {(usedSources.length > 0 || !hideEmptyUsed) && <div className="inspect-group-label">Used in this app</div>}
    {!hideEmptyUsed && usedSources.length === 0 && (
      <div className="data-pill" style={{ marginBottom: 10 }}>
        <span className="pill-icon">{I.database}</span>
        <span style={{ flex: 1, textAlign: 'left', color: 'var(--text-3)' }}>No source selected yet</span>
      </div>
    )}
    {usedSources.map(source => {
      const label = source.id;
      const meta = `${source.rows} rows · ${source.cols} cols · ${source.updated}`;
      return (
        <div key={source.id} style={{ marginBottom: 14 }}>
          <button
            className="data-pill bound"
            style={{ marginBottom: 6 }}
            onClick={() => onToggleSource && onToggleSource(source.id)}
          >
            <span className="pill-icon">{I.database}</span>
            <span className="mono" style={{ flex: 1, textAlign: 'left' }}>{label}</span>
            <span style={{ color: 'var(--text-3)', fontSize: 10 }}>selected</span>
          </button>
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', lineHeight: 1.5, paddingLeft: 4 }}>{meta}</div>
        </div>
      );
    })}

    <div className="inspect-group-label">Available in workspace</div>
    {availableSources.map(s => (
      <button
        key={s.id}
        className="data-pill"
        style={{ marginBottom: 4 }}
        onClick={() => onToggleSource && onToggleSource(s.id)}
      >
        <span className="pill-icon">{I.database}</span>
        <span className="mono" style={{ flex: 1, textAlign: 'left' }}>{s.id}</span>
        <span style={{ color: 'var(--text-3)', fontSize: 10 }}>{s.rows}</span>
      </button>
    ))}
    <button className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 10 }}>{I.plus} Connect source</button>
  </div>
  );
};

const AppSettingsModal = ({ settings, errors = {}, projectSlug, onClose, onSave }) => {
  const [draft, setDraft] = React.useState(settings);

  React.useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const update = (patch) => setDraft(prev => ({ ...prev, ...patch }));

  return (
    <>
      <div className="modal-scrim" onClick={onClose} />
      <div className="modal" style={{ width: 620, position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 60 }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">App Settings</div>
            <div className="modal-sub">Configure app URL, name, and basic behavior.</div>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ padding: 4 }}>{I.close}</button>
        </div>
        <div className="modal-body">
          {(errors.name || errors.urlSlug) && (
            <div className="builder-settings-error-banner">Please fix the highlighted fields before publishing.</div>
          )}

          <div className="inspect-group" style={{ marginBottom: 14 }}>
            <div className="inspect-field-label">App name</div>
            <input
              className={`input ${errors.name ? 'input-error' : ''}`}
              value={draft.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="My Data App"
              aria-invalid={!!errors.name}
            />
            {errors.name && <div className="builder-field-error">{errors.name}</div>}
          </div>

          <div className="inspect-group" style={{ marginBottom: 14 }}>
            <div className="inspect-field-label">App URL slug</div>
            <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              <span className="mono" style={{ padding: '0 10px', fontSize: 11, color: 'var(--text-3)' }}>{`apps.keboola.io/${projectSlug}/`}</span>
              <input
                className={`input ${errors.urlSlug ? 'input-error' : ''}`}
                style={{ borderLeft: '1px solid var(--border)' }}
                value={draft.urlSlug}
                onChange={(e) => update({ urlSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                placeholder="my-data-app"
                readOnly={settings.isPublished}
                aria-invalid={!!errors.urlSlug}
              />
            </div>
            {settings.isPublished && <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-3)' }}>URL is locked after publishing.</div>}
            {errors.urlSlug && <div className="builder-field-error">{errors.urlSlug}</div>}
          </div>

          <div className="inspect-group" style={{ marginBottom: 14 }}>
            <div className="inspect-field-label">Visibility</div>
            <div className="tweaks-row">
              <button className={`tweaks-btn ${draft.visibility === 'Private' ? 'active' : ''}`} onClick={() => update({ visibility: 'Private' })}>Private</button>
              <button className={`tweaks-btn ${draft.visibility === 'Shared' ? 'active' : ''}`} onClick={() => update({ visibility: 'Shared' })}>Shared</button>
              <button className={`tweaks-btn ${draft.visibility === 'Public' ? 'active' : ''}`} onClick={() => update({ visibility: 'Public' })}>Public</button>
            </div>
          </div>

          <div className="inspect-group">
            <div className="inspect-field-label">Description (optional)</div>
            <textarea
              className="input"
              style={{ height: 88, padding: '8px 10px', resize: 'vertical' }}
              value={draft.description || ''}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="Short description of the app purpose and audience"
            />
          </div>
        </div>
        <div className="sheet-footer" style={{ borderTop: '1px solid var(--border)' }}>
          <Btn variant="ghost" size="sm" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" size="sm" onClick={() => onSave(draft)}>Save settings</Btn>
        </div>
      </div>
    </>
  );
};

const ConnectGitModal = ({ draft, error, onClose, onConnect }) => {
  const [localDraft, setLocalDraft] = React.useState(draft);

  React.useEffect(() => {
    setLocalDraft(draft);
  }, [draft]);

  const update = (patch) => setLocalDraft(prev => ({ ...prev, ...patch }));

  return (
    <>
      <div className="modal-scrim" onClick={onClose} />
      <div className="modal" style={{ width: 620, position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 60 }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Connect Git Repository</div>
            <div className="modal-sub">Link source control to initialize your app in code mode.</div>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ padding: 4 }}>{I.close}</button>
        </div>

        <div className="modal-body">
          {error && <div className="builder-settings-error-banner">{error}</div>}

          <div className="inspect-group" style={{ marginBottom: 14 }}>
            <div className="inspect-field-label">Provider</div>
            <div className="tweaks-row">
              <button className={`tweaks-btn ${localDraft.provider === 'GitHub' ? 'active' : ''}`} onClick={() => update({ provider: 'GitHub' })}>GitHub</button>
              <button className={`tweaks-btn ${localDraft.provider === 'GitLab' ? 'active' : ''}`} onClick={() => update({ provider: 'GitLab' })}>GitLab</button>
              <button className={`tweaks-btn ${localDraft.provider === 'Bitbucket' ? 'active' : ''}`} onClick={() => update({ provider: 'Bitbucket' })}>Bitbucket</button>
            </div>
          </div>

          <div className="inspect-group" style={{ marginBottom: 14 }}>
            <div className="inspect-field-label">Repository URL</div>
            <input
              className={`input ${error ? 'input-error' : ''}`}
              value={localDraft.repositoryUrl}
              onChange={(e) => update({ repositoryUrl: e.target.value })}
              placeholder="https://github.com/org/repo"
              aria-invalid={!!error}
            />
          </div>

          <div className="inspect-group" style={{ marginBottom: 6 }}>
            <div className="inspect-field-label">Branch</div>
            <input
              className="input"
              value={localDraft.branch}
              onChange={(e) => update({ branch: e.target.value })}
              placeholder="main"
            />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
            We will open a blank app definition in code mode and connect this repository for versioning.
          </div>
        </div>

        <div className="sheet-footer" style={{ borderTop: '1px solid var(--border)' }}>
          <Btn variant="ghost" size="sm" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" size="sm" icon={I.git} onClick={() => onConnect(localDraft)}>Connect repository</Btn>
        </div>
      </div>
    </>
  );
};

/* ==== BINDING SHEET (3 steps) ==== */
const BindingSheet = ({ blockId, onClose, onComplete }) => {
  const [step, setStep] = React.useState(0);
  const [chosen, setChosen] = React.useState(null);

  const steps = ['Select table', 'Map fields', 'Review'];

  return (
    <>
      <div className="modal-scrim" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-header">
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Bind data</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Block <span className="mono">#{blockId}</span></div>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ padding: 4 }}>{I.close}</button>
        </div>
        <div className="sheet-body">
          <div className="stepper">
            {steps.map((s, i) => (
              <React.Fragment key={s}>
                <div className={`step ${step === i ? 'active' : ''} ${step > i ? 'done' : ''}`}>
                  <div className="step-num">{step > i ? '✓' : i + 1}</div>
                  <div className="step-label">{s}</div>
                </div>
                {i < steps.length - 1 && <div className="step-sep" />}
              </React.Fragment>
            ))}
          </div>

          {step === 0 && (
            <div>
              <div className="input-group" style={{ marginBottom: 12 }}>
                {I.search}
                <input placeholder="Search tables…" defaultValue="orders" />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Suggested by Kai</div>
              {DATA_SOURCES.slice(0, 3).map((s, i) => (
                <button
                  key={s.id}
                  className="data-pill"
                  style={{
                    width: '100%',
                    marginBottom: 6,
                    borderColor: chosen === s.id ? 'var(--accent)' : 'var(--border)',
                    background: chosen === s.id ? 'var(--accent-soft)' : 'transparent',
                  }}
                  onClick={() => setChosen(s.id)}
                >
                  <span className="pill-icon">{I.database}</span>
                  <span className="mono" style={{ flex: 1, textAlign: 'left' }}>{s.id}</span>
                  <span style={{ color: 'var(--text-3)', fontSize: 10 }}>{s.rows}</span>
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 14 }}>
                Kai matched 3 of 3 required fields based on column names and types. Confirm or override.
              </div>
              {[
                { field: 'x — dimension', expected: 'date', mapped: 'order_date', conf: 0.98 },
                { field: 'y — measure', expected: 'number', mapped: 'amount', conf: 0.94 },
                { field: 'split by', expected: 'string', mapped: 'region', conf: 0.88 },
              ].map(m => (
                <div key={m.field} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{m.field}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>type: {m.expected}</div>
                  </div>
                  <span style={{ color: 'var(--text-3)' }}>{I.arrow}</span>
                  <div>
                    <div className="ab-select" style={{ width: '100%', justifyContent: 'space-between' }}>
                      <span className="mono" style={{ fontSize: 12 }}>{m.mapped}</span>
                      <span style={{ color: 'var(--live)', fontSize: 10 }}>{Math.round(m.conf * 100)}% match</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="reason-card" style={{ marginBottom: 14 }}>
                <strong>Ready to bind.</strong> Your block will refresh automatically when the source does — every 15 min for this table.
                You can override the cache window in Settings.
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>Preview · first 3 rows</div>
              <div className="ab-table">
                <table>
                  <thead><tr><th>week</th><th>amount</th><th>region</th></tr></thead>
                  <tbody>
                    <tr><td className="mono">2026-14</td><td className="mono">$128,402</td><td>EMEA</td></tr>
                    <tr><td className="mono">2026-15</td><td className="mono">$134,011</td><td>EMEA</td></tr>
                    <tr><td className="mono">2026-16</td><td className="mono">$142,880</td><td>EMEA</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <div className="sheet-footer">
          {step > 0 && <Btn variant="outline" size="sm" onClick={() => setStep(step - 1)}>Back</Btn>}
          <div style={{ flex: 1 }} />
          <Btn variant="ghost" size="sm" onClick={onClose}>Cancel</Btn>
          {step < 2 ? (
            <Btn variant="primary" size="sm" onClick={() => setStep(step + 1)} disabled={step === 0 && !chosen}>
              Continue
            </Btn>
          ) : (
            <Btn variant="accent" size="sm" icon={I.link} onClick={() => onComplete(blockId, chosen)}>
              Bind data
            </Btn>
          )}
        </div>
      </div>
    </>
  );
};

Object.assign(window, { Builder });
