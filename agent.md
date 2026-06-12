# MindMark Agent Guide

This is the primary operating guide for AI agents working in this repository.

## Project Facts

- Repository: `/Volumes/WORKSYSN/SynologyDrive/00-开发项目/mindmark`
- Obsidian vault: `/Users/ian/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian`
- Runtime plugin: `/Users/ian/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian/.obsidian/plugins/mindmark`
- Plugin ID: `mindmark`
- Mind map view type: `mindmapViewUpgraded`
- Source entry: `src/main.ts`
- Generated runtime bundle: `main.js`

The repository is the source of truth. Never make source changes directly in the
runtime plugin directory.

## Quick Build And Test

Obsidian must be running, and its command line interface must be enabled.

### Build only

```bash
cd "/Volumes/WORKSYSN/SynologyDrive/00-开发项目/mindmark"
npm run build
```

A clean build has no TypeScript, Rollup, or circular dependency warnings.

### Build, deploy, reload, and check errors

```bash
cd "/Volumes/WORKSYSN/SynologyDrive/00-开发项目/mindmark"
npm run build &&
cp main.js styles.css "/Users/ian/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian/.obsidian/plugins/mindmark/" &&
obsidian plugin:reload id=mindmark &&
obsidian dev:errors
```

Expected final output:

```text
No errors captured.
```

If old errors are present:

```bash
obsidian dev:errors clear
obsidian plugin:reload id=mindmark
```

### Fast runtime smoke test

```bash
obsidian open path='00-INBOX/未命名思维导图 2.md'
sleep 2
obsidian eval code='JSON.stringify({type:app.workspace.activeLeaf?.view?.getViewType?.(),mindmaps:document.querySelectorAll(".mm-mindmap").length,nodes:document.querySelectorAll(".mm-node").length,paths:document.querySelectorAll(".mm-mindmap svg path").length})'
obsidian dev:errors
```

Expected:

- `type` is `mindmapViewUpgraded`
- `mindmaps` is at least `1`
- `nodes` is greater than `0`
- no runtime errors are captured

### Verify runtime files match the build

```bash
cmp -s main.js "/Users/ian/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian/.obsidian/plugins/mindmark/main.js" &&
echo "runtime bundle matches build"
```

## Interaction Testing

Do not treat a successful event dispatch as sufficient for UI bugs. Verify the
actual DOM state and, when relevant, use Chrome DevTools Protocol mouse or
keyboard input.

```bash
obsidian dev:debug on
obsidian dev:cdp method=Input.dispatchMouseEvent params='{"type":"mouseMoved","x":1000,"y":600}'
obsidian dev:screenshot path='/tmp/mindmark-test.png'
obsidian dev:errors
obsidian dev:debug off
```

Useful inspection commands:

```bash
obsidian workspace
obsidian eval code='JSON.stringify(app.plugins.plugins.mindmark.settings)'
obsidian eval code='JSON.stringify(Array.from(document.querySelectorAll(".mm-node")).map(e=>({id:e.getAttribute("data-id"),display:getComputedStyle(e).display,visibility:getComputedStyle(e).visibility,selected:e.classList.contains("mm-node-select")})))'
```

For temporary test notes:

- Prefix filenames with `__mindmark_`.
- Put them in `00-INBOX`.
- Detach their leaves and delete the files after testing.
- Restore the user's previously open note when practical.

## Required Verification By Change Type

### Runtime or interaction changes

1. Run `npm run build`.
2. Copy `main.js` and `styles.css` to the runtime plugin directory.
3. Reload `mindmark`.
4. Reproduce the workflow using real UI interaction.
5. Inspect DOM or plugin state.
6. Run `obsidian dev:errors`.

### Settings changes

1. Verify the control appears in the MindMark settings tab.
2. Verify its default value.
3. Verify changes apply to already open mind maps.
4. Reload the plugin and verify persistence in `data.json`.
5. Test invalid or boundary values where applicable.

### Markdown conversion changes

1. Test MindMap to Markdown conversion.
2. Inspect the resulting file contents.
3. Test Markdown to MindMap conversion.
4. Confirm frontmatter remains valid.
5. Confirm opening Markdown or split Markdown performs required formatting.

### Focus, collapse, or layout changes

Verify nodes and SVG edges together. Check:

- `INode.isShow()`
- element `display`, `visibility`, and selection classes
- focused and selected node IDs
- rendered SVG path count and visibility
- exit and re-entry behavior

## Code Conventions

- Follow existing project structure and APIs; avoid unrelated refactors.
- Keep TypeScript changes narrowly scoped.
- Use explicit types for new settings and public behavior.
- Put setting defaults in both `MindMapSettings` and `loadSettings()`.
- Add English and Simplified Chinese locale strings for visible settings.
- Runtime behavior must read current plugin settings so changes can apply
  without reopening a file.
- Keep comments short and only for non-obvious state transitions.
- Do not add new dependencies unless the existing stack cannot solve the task.
- Do not edit generated `main.js` manually; regenerate it with `npm run build`.
- Commit `main.js` with source changes because Obsidian loads it directly.
- Do not commit `node_modules`, test notes, screenshots, or runtime `data.json`.

## Repository Safety

- The worktree may contain user changes. Inspect `git status --short` first.
- Never discard, reset, or overwrite changes you did not create.
- Stage only files belonging to the current task.
- Do not use `git reset --hard`, `git checkout --`, or destructive cleanup.
- Run `git diff --check` before committing.
- Review source diffs before reviewing the large generated `main.js` diff.
- Keep commits focused and use an imperative English subject.

Recommended final checks:

```bash
git diff --check
git status --short
git diff --stat
obsidian dev:errors
```

## Architecture Map

- `src/main.ts`: plugin lifecycle, commands, settings load, view switching
- `src/MindMapView.ts`: Obsidian file view and Markdown conversion
- `src/mindmap/mindmap.ts`: events, focus mode, layout orchestration
- `src/mindmap/INode.ts`: node state, DOM, editing, collapse and expansion
- `src/mindmap/Layout.ts`: node placement and SVG edge drawing
- `src/mindmap/Execute.ts`: command dispatch
- `src/mindmap/Cmds.ts`: undoable operations
- `src/mindmap/History.ts`: undo and redo history
- `src/settings.ts`: persisted setting types and defaults
- `src/settingTab.ts`: settings UI
- `src/lang/locale/`: localized UI text
- `styles.css`: runtime styling
- `.agent/README.md`: historical handoff notes and known bug context

## Important Invariants

- Collapsed nodes must keep `isShow()`, DOM display, and edge visibility aligned.
- Focus mode must hide both out-of-scope nodes and their edges.
- Exiting focus mode must reselect and center the previously focused node.
- Markdown files with `mindmap-plugin` frontmatter may be deliberately kept in
  Markdown mode through `mindmapFileModes`.
- Internal-link previews depend on Obsidian's core `page-preview` plugin.
- The Markdown return action must not be registered more than once per view.

