# Agentboard vs WebTmux: Comparison

Two web-based tmux terminal solutions with different philosophies and target audiences.

## Quick Summary

| Aspect | Agentboard | WebTmux |
|--------|------------|---------|
| **Language** | TypeScript (Bun) | Go |
| **Frontend** | React + Zustand | Lit.js (Web Components) |
| **Terminal** | xterm.js | xterm.js |
| **Distribution** | Node/Bun app | Single binary |
| **Focus** | AI agent workflows | Traditional tmux UI |
| **Pane Support** | Single pane per window | Full pane layout |

---

## What WebTmux Does Better

### 1. Scroll-to-Copy-Mode
WebTmux automatically enters tmux copy mode when you scroll up. This is native tmux behavior that Agentboard doesn't support.

```javascript
// WebTmux: scroll up triggers copy mode
if (deltaY < 0) {
  this.sendMessage(MSG.TmuxScrollUp, lines)
}
```

Agentboard just scrolls the xterm.js buffer—it doesn't interact with tmux's copy mode at all.

### 2. Full Pane Layout
WebTmux renders a **visual minimap** of your pane layout:
- Shows all panes with proportional positioning
- Click a pane to focus it
- Red dot indicates active pane
- Split horizontal/vertical buttons

Agentboard treats each tmux window as a single terminal. No pane awareness.

### 3. OSC 52 Clipboard Integration
WebTmux intercepts OSC 52 sequences from tmux and writes directly to system clipboard via `navigator.clipboard.writeText()`. Native tmux copy → browser clipboard.

### 4. Single Binary Distribution
Go's `embed` directive bundles all assets. Download one file, run it. No npm, no node_modules, no bun.

### 5. Built-in HTTP Basic Auth
WebTmux generates credentials on first run. Secure by default.

---

## What Agentboard Does Better

### 1. Agent Status Detection
Agentboard's killer feature. It parses terminal content to detect:
- **working**: Content changed (agent executing)
- **waiting**: Content stable (agent idle)
- **permission**: Detected approval prompt

```typescript
// Permission prompt patterns
/❯\s*1\.\s*Yes/           // Claude Code
/\[approve\]\s*\[reject\]/ // Codex
/\[Y\/n\]/                 // Generic
```

WebTmux has zero semantic awareness. It's just a dumb pipe.

### 2. Mobile UX
Agentboard's mobile controls are more sophisticated:
- Virtual d-pad for arrow keys
- Numpad overlay
- Quick Ctrl/Esc/Tab buttons
- Haptic feedback on iOS
- Visual viewport handling for soft keyboard

WebTmux has basic mobile controls (prefix button, split buttons, pane selector) but no virtual keyboard aids.

### 3. Session Creation Workflow
Agentboard has:
- Directory browser for picking project paths
- Custom command input
- Project history
- Agent type detection (Claude/Codex icons)

WebTmux assumes you're attaching to existing sessions.

### 4. Real-time Status Updates
WebSocket broadcasts session status changes. UI shows colored badges. You can monitor multiple agents without switching terminals.

---

## What They Both Do Similarly

| Feature | Agentboard | WebTmux |
|---------|------------|---------|
| xterm.js | v5.5.0 | v5.5.0 |
| WebGL addon | Yes | Yes |
| FitAddon | Yes | Yes |
| WebSocket comms | JSON protocol | Binary protocol |
| Tailwind CSS | Build-time | CDN |
| Window tabs | Yes | Yes |
| Resize handling | ResizeObserver | ResizeObserver |

---

## The Hybrid: What Would It Take?

### Option A: Add Agent Features to WebTmux

**Pros:**
- Single binary distribution
- Already has pane layout, copy mode, auth
- Go backend is fast and simple

**Cons:**
- Would need to add:
  - Status detection (parse pane content periodically)
  - Permission prompt patterns
  - Agent type inference
  - Session creation UI
  - Better mobile controls
- Lit.js is less flexible than React for complex UI
- Go isn't ideal for the text parsing/regex work

**Effort:** Medium-High. The Go backend needs new endpoints. Frontend needs significant UI additions.

### Option B: Add tmux Features to Agentboard

**Pros:**
- Already has status detection, mobile UX, session creation
- TypeScript/React is easier for UI iteration
- Existing WebSocket protocol is extensible

**Cons:**
- Would need to add:
  - Pane layout queries (`tmux display-message -p` for pane info)
  - Pane minimap component
  - Copy mode integration (send tmux copy-mode commands)
  - Split pane UI
  - OSC 52 clipboard handling
  - Optional: HTTP Basic Auth
  - Optional: Single binary (Bun compile?)

**Effort:** Medium. The backend changes are straightforward tmux commands. Frontend is new components.

### Option C: Fork WebTmux, Rewrite Frontend in React

**Pros:**
- Keep Go backend (fast, single binary)
- Use React for UI (easier to build complex status/agent features)
- Best of both worlds

**Cons:**
- Maintain two languages
- Build pipeline complexity
- Lose Go embed simplicity

---

## Recommendation

**Option B (enhance Agentboard)** is probably the right call:

1. **Status detection is hard to retrofit.** It's the core value prop and Agentboard already has it.

2. **Pane support is straightforward to add.** It's just tmux queries + UI components.

3. **Copy mode is the main gap.** Need to:
   - Detect scroll intent
   - Send `tmux copy-mode` / scroll commands
   - Handle OSC 52 for clipboard

4. **Single binary is nice-to-have, not essential.** Bun can compile to standalone executable if needed.

### Priority Features to Port from WebTmux

1. **Scroll-to-copy-mode** — Most impactful UX improvement
2. **OSC 52 clipboard** — Native tmux copy should work
3. **Pane minimap** — Visual pane awareness (if users want multi-pane)
4. **HTTP Basic Auth** — Optional, for non-Tailscale deployments

### Features WebTmux Doesn't Have (Keep These)

- Permission prompt detection
- Working/waiting status
- Agent type inference
- Session creation workflow
- Directory browser
- Mobile d-pad/numpad
- Haptic feedback

---

## Conclusion

WebTmux is more "tmux-complete" (panes, copy mode, auth). Agentboard is more "agent-aware" (status, prompts, mobile).

The hybrid answer: **Add copy-mode and pane support to Agentboard.** The agent intelligence is the differentiator, and it's easier to add tmux features to an agent-aware tool than to add agent awareness to a generic tmux client.

WebTmux's frontend is fairly minimal—about 500 lines of Lit.js. The Go backend is the real value (single binary, auth). If distribution simplicity matters a lot, consider wrapping Agentboard with Bun's compile feature or containerizing it.
