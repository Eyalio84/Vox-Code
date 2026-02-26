import { useMemo, useState } from 'react'
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
  SandpackConsole,
} from '@codesandbox/sandpack-react'
import type { AusFile } from '../types/project.js'

/* ── Config ────────────────────────────────────────────────────── */

const IGNORED_FILES = new Set([
  '.env',
  '.env.local',
  '.gitignore',
  'metadata.json',
  'README.md',
  'readme.md',
  '.eslintrc.json',
  'tsconfig.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'postcss.config.js',
  'tailwind.config.js',
  'tailwind.config.ts',
])

const DEFAULT_APP_CODE = `export default function App() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui', color: '#888', background: '#111827' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: '#0ea5e9', marginBottom: 8 }}>Studio Preview</h2>
        <p>Describe your app in the chat to get started</p>
      </div>
    </div>
  );
}`

/* ── Helpers ────────────────────────────────────────────────────── */

interface PreviewPanelProps {
  files: Record<string, AusFile>
  selectedFile: string | null
  className?: string
  extraDeps?: Record<string, string>
}

function hasImportMap(html: string): boolean {
  return html.includes('type="importmap"') || html.includes("type='importmap'")
}

function toSandpackFiles(
  files: Record<string, AusFile>,
): { spFiles: Record<string, { code: string }>; activeFile: string } {
  const spFiles: Record<string, { code: string }> = {}

  for (const [path, file] of Object.entries(files)) {
    // Skip backend files
    if (path.startsWith('backend/') || path.endsWith('.py') || path.endsWith('.sql')) {
      continue
    }

    // Strip frontend/ prefix
    const stripped = path.startsWith('frontend/') ? path.slice('frontend/'.length) : path

    // Skip ignored config files
    const basename = stripped.split('/').pop() ?? stripped
    if (IGNORED_FILES.has(basename)) continue

    // Skip index.html with importmap (CDN-based templates Sandpack can't handle)
    if (basename === 'index.html' && hasImportMap(file.content)) continue

    // Ensure leading /
    const spPath = stripped.startsWith('/') ? stripped : '/' + stripped
    spFiles[spPath] = { code: file.content }
  }

  // Determine entry point
  const candidates = ['/App.tsx', '/App.js', '/App.jsx', '/src/App.tsx', '/src/App.js', '/src/App.jsx']
  let activeFile = candidates.find((c) => spFiles[c]) ?? ''

  if (!activeFile) {
    // No known entry point -- create a default
    spFiles['/App.js'] = { code: DEFAULT_APP_CODE }
    activeFile = '/App.js'
  }

  return { spFiles, activeFile }
}

function parseDeps(files: Record<string, AusFile>): Record<string, string> {
  const deps: Record<string, string> = {}
  const candidates = ['package.json', '/package.json', 'frontend/package.json']
  const pkgFile = candidates.reduce<AusFile | undefined>(
    (found, key) => found ?? files[key],
    undefined,
  )

  if (!pkgFile) return deps

  try {
    const pkg = JSON.parse(pkgFile.content) as { dependencies?: Record<string, string> }
    if (pkg.dependencies) {
      for (const [name, version] of Object.entries(pkg.dependencies)) {
        // Sandpack already provides react and react-dom
        if (name === 'react' || name === 'react-dom') continue
        deps[name] = version
      }
    }
  } catch {
    // Malformed package.json -- ignore
  }

  return deps
}

/* ── Component ─────────────────────────────────────────────────── */

function PreviewPanel({ files, selectedFile, className, extraDeps }: PreviewPanelProps): JSX.Element {
  const [showConsole, setShowConsole] = useState(false)

  const { spFiles, activeFile: defaultActive } = useMemo(() => toSandpackFiles(files), [files])
  const customDeps = useMemo(() => parseDeps(files), [files])
  const hasFiles = Object.keys(files).length > 0

  const activeFile = useMemo(() => {
    if (selectedFile) {
      const stripped = selectedFile.startsWith('frontend/')
        ? selectedFile.slice('frontend/'.length)
        : selectedFile
      const spPath = stripped.startsWith('/') ? stripped : '/' + stripped
      if (spFiles[spPath]) return spPath
    }
    return defaultActive
  }, [selectedFile, spFiles, defaultActive])

  // Empty state -- no generated files yet
  if (!hasFiles) {
    return (
      <div
        className={`w-80 shrink-0 border-l overflow-y-auto p-3 hidden lg:flex flex-col items-center justify-center ${className ?? ''}`}
        style={{
          background: 'var(--t-surface)',
          borderColor: 'var(--t-border)',
        }}
      >
        <h3
          className="text-[10px] font-semibold uppercase mb-2"
          style={{ color: 'var(--t-muted)' }}
        >
          Preview
        </h3>
        <p className="text-xs text-center" style={{ color: 'var(--t-muted)' }}>
          Live preview will appear here after generation.
        </p>
      </div>
    )
  }

  return (
    <div
      className={`w-96 shrink-0 border-l overflow-hidden hidden lg:flex flex-col ${className ?? ''}`}
      style={{ borderColor: 'var(--t-border)' }}
    >
      {/* Header */}
      <div
        className="text-[10px] font-semibold uppercase px-3 py-1.5 border-b flex items-center justify-between"
        style={{
          color: 'var(--t-muted)',
          background: 'var(--t-surface)',
          borderColor: 'var(--t-border)',
        }}
      >
        <span>Preview</span>
        <div className="flex items-center gap-2">
          <span>{Object.keys(spFiles).length} files</span>
          <button
            onClick={() => setShowConsole((prev) => !prev)}
            className="text-[10px] px-2 py-0.5 rounded transition-colors"
            style={{
              background: showConsole ? 'var(--t-primary)' : 'var(--t-surface2, var(--t-surface))',
              color: showConsole ? '#fff' : 'var(--t-muted)',
            }}
          >
            Console
          </button>
        </div>
      </div>

      {/* Sandpack with absolute positioning to force full height */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div className="aus-sandpack-wrapper" style={{ position: 'absolute', inset: 0 }}>
          <SandpackProvider
            template="react"
            files={spFiles}
            customSetup={{
              dependencies: { ...customDeps, ...extraDeps },
            }}
            options={{
              activeFile,
              visibleFiles: [activeFile],
              recompileMode: 'delayed',
              recompileDelay: 500,
            }}
          >
            <SandpackLayout>
              <SandpackPreview
                showNavigator={false}
                showRefreshButton
                showOpenInCodeSandbox={false}
              />
              {showConsole && <SandpackConsole />}
            </SandpackLayout>
          </SandpackProvider>
        </div>

        <style>{`
          .aus-sandpack-wrapper,
          .aus-sandpack-wrapper > .sp-wrapper,
          .aus-sandpack-wrapper > div {
            height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
          }
          .aus-sandpack-wrapper .sp-layout {
            flex: 1 !important;
            height: 100% !important;
            max-height: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
          .aus-sandpack-wrapper .sp-stack {
            flex: 1 !important;
            height: 100% !important;
            max-height: none !important;
          }
          .aus-sandpack-wrapper .sp-preview-container {
            flex: 1 !important;
            height: 100% !important;
            max-height: none !important;
          }
          .aus-sandpack-wrapper .sp-preview-iframe {
            height: 100% !important;
            min-height: 0 !important;
          }
          .aus-sandpack-wrapper .sp-preview-actions {
            z-index: 10;
          }
        `}</style>
      </div>
    </div>
  )
}

export default PreviewPanel
