# Editor Pane Specification

Integrated file editor for viewing and editing files within Agentboard.

## Overview

A collapsible right-side pane that allows users to view and edit files (any extension) associated with each terminal session. Built with CodeMirror 6 for iOS Safari compatibility and auto-detected syntax highlighting.

## Requirements

### Core Behavior
- **Location**: Right-hand side collapsible pane with draggable divider
- **Per-session binding**: Each terminal session remembers its open file
- **File picker**: Quick search/filter dropdown scoped to session's project directory
- **Editor**: CodeMirror 6 with auto-detected syntax highlighting
- **Save**: Manual save via `Cmd+S` / `Ctrl+S` with unsaved indicator
- **Scope**: Edit existing files only (no file creation)

### UI/UX

| Element | Desktop | Mobile |
|---------|---------|--------|
| Pane | Inline flex column, resizable | Slide-in overlay from right |
| Toggle | Header icon button + `Cmd+E` shortcut | Same button in terminal header |
| File picker | Dropdown in pane header | Same, full-width |
| Width | User resizable, persisted | Full-width or 85vw |

### Keyboard Shortcuts
- `Cmd+E` / `Ctrl+E` - Toggle editor pane visibility
- `Cmd+S` / `Ctrl+S` - Save current file (when editor focused)

---

## Implementation

### Phase 1: Backend API

**Create `src/server/fileRoutes.ts`**

```typescript
// GET /api/files - List files in directory
// Query params:
//   - dir: string (project path, required)
//   - recursive: boolean (default: true)
//   - ext: string (optional filter, e.g., ".md")
// Response: { files: Array<{ path: string, name: string, relativePath: string }> }

// GET /api/file - Read file content
// Query params:
//   - path: string (absolute path)
// Response: { content: string, mtime: number }

// PUT /api/file - Save file content
// Body: { path: string, content: string }
// Response: { success: boolean, mtime: number }
```

**Security**:
- Validate paths are within allowed project directories
- Reject path traversal attempts (`../`)
- Blocklist binary extensions (`.png`, `.jpg`, `.exe`, `.bin`, etc.)

---

### Phase 2: Zustand Store

**Create `src/client/stores/editorStore.ts`**

```typescript
interface EditorFile {
  path: string
  content: string
  savedContent: string  // for dirty state comparison
  mtime: number
}

interface EditorState {
  isOpen: boolean
  paneWidth: number
  openFiles: Record<string, EditorFile>  // keyed by sessionId

  // Actions
  setOpen: (open: boolean) => void
  toggleOpen: () => void
  setPaneWidth: (width: number) => void
  openFile: (sessionId: string, path: string, content: string, mtime: number) => void
  updateContent: (sessionId: string, content: string) => void
  markSaved: (sessionId: string, mtime: number) => void
  closeFile: (sessionId: string) => void

  // Computed
  isDirty: (sessionId: string) => boolean
}
```

**Persistence**: `isOpen`, `paneWidth`, and file paths (not content) via localStorage.

---

### Phase 3: Editor Pane Component

**Create `src/client/components/EditorPane.tsx`**

Layout:
```
+-----------------------------+
| [file-icon v] filename  [S] |  <- Header: file picker + save button
+-----------------------------+
|                             |
|   CodeMirror Editor         |  <- Main editor area
|                             |
+-----------------------------+
```

**File Picker (`src/client/components/FilePicker.tsx`)**:
- Combobox input with fuzzy search
- Fetches file list from `/api/files` on open
- Shows relative paths for readability
- Keyboard navigable (arrow keys, Enter to select)

**CodeMirror Setup**:
```typescript
import { EditorView, basicSetup } from 'codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
// ... other languages

// Extensions:
// - Language mode based on file extension
// - Theme matching app (dark/light from themeStore)
// - keymap with Cmd+S bound to save handler
// - updateListener to sync content to store
```

**Language Detection**:
- `.md` → markdown
- `.ts`, `.tsx` → typescript
- `.js`, `.jsx` → javascript
- `.json` → json
- `.css` → css
- `.html` → html
- `.yaml`, `.yml` → yaml
- Others → plain text (fallback)

---

### Phase 4: Resize Handle

**Create `src/client/components/ResizeHandle.tsx`**

- Vertical divider between terminal and editor pane
- Drag to resize (mousedown → mousemove → mouseup)
- Min width: 200px
- Max width: 60% of viewport
- Cursor: `col-resize`
- Persist width to store on drag end

---

### Phase 5: App Integration

**Update `src/client/App.tsx`**

Layout change:
```tsx
<div className="flex h-full overflow-hidden">
  <Sidebar />
  <div className="flex flex-1">
    <Terminal
      style={{
        flex: isEditorOpen ? `0 0 calc(100% - ${paneWidth}px)` : 1
      }}
    />
    {isEditorOpen && (
      <>
        <ResizeHandle />
        <EditorPane width={paneWidth} />
      </>
    )}
  </div>
</div>
```

**Keyboard Shortcuts** (add to existing handler):
```typescript
// Cmd+E / Ctrl+E -> toggle editor pane
if (event.code === 'KeyE' && matchesModifier(event)) {
  event.preventDefault()
  editorStore.getState().toggleOpen()
}
```

**Save Shortcut** (in EditorPane):
- Intercept Cmd+S when editor is focused
- Call `PUT /api/file` with current content
- Update `markSaved()` in store
- Show brief "Saved" indicator or flash

---

### Phase 6: Mobile Support

**Mobile Overlay Mode**:
- When viewport < 768px, render as slide-in drawer from right
- Similar pattern to existing `SessionDrawer`
- Backdrop click to close
- Width: 100vw or 85vw

**Toggle Button**:
- Add to `TerminalControls.tsx` for mobile
- Icon: document/edit icon

---

### Phase 7: Theme Integration

**CodeMirror Themes**:
- Create light/dark themes matching existing terminal themes
- Subscribe to `themeStore` and swap theme extension dynamically
- Use CSS variables from `index.css` for consistency

---

## File Changes Summary

| File | Action |
|------|--------|
| `src/server/fileRoutes.ts` | Create |
| `src/server/index.ts` | Import and mount file routes |
| `src/client/stores/editorStore.ts` | Create |
| `src/client/components/EditorPane.tsx` | Create |
| `src/client/components/FilePicker.tsx` | Create |
| `src/client/components/ResizeHandle.tsx` | Create |
| `src/client/App.tsx` | Add editor pane, keyboard shortcut |
| `src/client/styles/index.css` | Add editor styles |
| `package.json` | Add CodeMirror dependencies |

---

## Dependencies

```json
{
  "codemirror": "^6.0.1",
  "@codemirror/lang-markdown": "^6.2.0",
  "@codemirror/lang-javascript": "^6.2.0",
  "@codemirror/lang-json": "^6.0.0",
  "@codemirror/lang-css": "^6.2.0",
  "@codemirror/lang-html": "^6.4.0",
  "@codemirror/lang-yaml": "^6.0.0",
  "@codemirror/state": "^6.4.0",
  "@codemirror/view": "^6.26.0",
  "@codemirror/theme-one-dark": "^6.1.0"
}
```

---

## Open Questions

None at this time. Scope is finalized.
