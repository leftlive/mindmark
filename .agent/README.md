# Agent Handoff: MindMark

This file is for the next AI agent taking over the MindMark Obsidian plugin work.

## Fast Facts

- Project repo: `/Volumes/WORKSYSN/SynologyDrive/00-开发项目/mindmark`
- Active Obsidian vault: `/Users/ian/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian`
- Active plugin runtime folder: `/Users/ian/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian/.obsidian/plugins/mindmark`
- Active plugin ID: `mindmark`
- Active view type: `mindmapViewUpgraded`
- Current branch: `main`

The user expects changes to happen in this repo, then be built and copied into the Obsidian runtime plugin folder when runtime verification is needed.

## Standard Loop

Use this loop for code changes:

```bash
cd "/Volumes/WORKSYSN/SynologyDrive/00-开发项目/mindmark"
npm run build
cp main.js styles.css "/Users/ian/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian/.obsidian/plugins/mindmark/"
obsidian plugin:reload id=mindmark
obsidian dev:errors
```

If `mindmark` is disabled:

```bash
obsidian plugin:enable id=mindmark filter=community
obsidian plugin:reload id=mindmark
```

If checking current view state:

```bash
obsidian workspace
```

If old errors make the state ambiguous:

```bash
obsidian dev:errors clear
```

## Known Good Runtime Smoke Test

```bash
obsidian dev:errors clear
obsidian open path='00-INBOX/未命名思维导图.md'
obsidian command id='mindmark:Set to mindmap view'
obsidian workspace
obsidian dev:errors
```

Expected:

- Workspace contains `[mindmapViewUpgraded] 未命名思维导图`
- `obsidian dev:errors` returns `No errors captured.`

Optional DOM check:

```bash
obsidian eval code="JSON.stringify({mindmaps:document.querySelectorAll('.mm-mindmap').length,nodes:document.querySelectorAll('.mm-node').length,paths:document.querySelectorAll('.mm-mindmap svg path').length,activeType:app.workspace.getActiveViewOfType(Object)?.getViewType?.()})"
```

Expected `activeType` is `mindmapViewUpgraded`.

## Important Architecture

- `src/main.ts`: plugin load, commands, view registration, markdown/mindmap switching.
- `src/MindMapView.ts`: Obsidian `TextFileView`, file lifecycle, rendering Markdown into `MindMap`.
- `src/mindmap/mindmap.ts`: runtime controller, keyboard/mouse events, focus mode, refresh/layout orchestration.
- `src/mindmap/Layout.ts`: physical node layout and SVG path drawing.
- `src/mindmap/INode.ts`: node DOM, edit mode, Markdown rendering, internal links, embeds.
- `src/mindmap/Execute.ts`, `src/mindmap/Cmds.ts`, `src/mindmap/History.ts`: undoable command system.
- `src/mindmap/FileSuggest.ts`: file suggestions during node editing.
- `src/utils.ts`: shared utility code. `uuid()` belongs here to avoid circular imports.
- `src/settings.ts` and `src/settingTab.ts`: persisted plugin settings and their Obsidian settings UI.

## Recent Bugs And Fixes

### Markdown view return button

Mind map files displayed as Markdown have a `blocks` action beside the Markdown reading/editing mode button. `MindMapPlugin.updateMarkdownMindMapActions()` owns this button, shows it only when the file has `mindmap-plugin` frontmatter, and prevents duplicate actions across layout updates.

### Collapsing hid edges but not child nodes

Symptom: clicking a node's collapse dot removed its edges while child nodes remained visible.

Fix location: `src/mindmap/mindmap.ts`

Current rule: the layout pre-pass restores each node's DOM display from `INode.isShow()`. It must not force every node to `display: block`, because that overrides the state set by `INode.collapse()`.

### Internal link preview and opening behavior

Settings:

- `enableLinkPreview`: controls whether mind map links emit Obsidian `hover-link` events.
- `linkOpenMode`: accepts `current`, `tab`, or `window`.

The hover source is registered in `src/main.ts`. Event handling and click routing are in `src/mindmap/mindmap.ts`. When previews are enabled, MindMark ensures Obsidian's core `page-preview` plugin is active.

### Focus mode showed orphan edges

Symptom: focus mode hid nodes but left SVG lines visible.

Fix location: `src/mindmap/Layout.ts`

Current rule: before drawing an edge, skip it if either endpoint is hidden, dimmed, or not shown.

### Plugin crashed on resize/update

Symptom:

```text
Cannot read properties of null (reading 'edgeGroup')
```

Fix locations:

- `src/mindmap/Layout.ts`
- `src/mindmap/mindmap.ts`

Current rule: `MindMap.layout()` constructs `new Layout(..., this)` so `Layout` receives the active `MindMap` directly instead of relying on `root.mindmap`.

### Build warnings

Previous warnings came from:

- old Obsidian TypeScript definitions not exposing `WorkspaceLeaf.id`
- newer runtime API signatures such as `getLeaf("split", "vertical")`
- `super.onPaneMenu` missing from old type definitions
- implicit `any` parameters in XMind import code
- Rollup sourcemap mismatch with `inlineSourceMap`
- circular import from `uuid()` living in `MindMapView.ts`

These are currently addressed. A clean `npm run build` should have no warning output.

## Boundaries

- Do not edit the Obsidian runtime plugin folder as the source of truth.
- Do not treat `.obsidian/plugins/obsidian-enhancing-mindmap-upgraded` as the maintained plugin. That folder was an incomplete stale copy.
- Keep `main.js` committed because Obsidian loads it directly.
- Do not commit `node_modules`.
- If generated bundle diffs are large, inspect source diffs first; Rollup can rewrite large sections of `main.js`.

## Commit Context

Most recent local functional commit before this handoff:

```text
cfd3100 Fix mindmark focus mode and runtime stability
```

After changing docs or code, run:

```bash
git status --short
git diff --stat
```

Commit when the requested scope is complete.
