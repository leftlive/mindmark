# MindMark

MindMark is a local Obsidian plugin for editing Markdown files as mind maps. It is maintained as the source project for the plugin installed in the user's Obsidian vault.

This repository lives at:

```text
/Volumes/WORKSYSN/SynologyDrive/00-开发项目/mindmark
```

The Obsidian runtime plugin lives at:

```text
/Users/ian/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian/.obsidian/plugins/mindmark
```

## Current Plugin Identity

The active Obsidian plugin ID is:

```text
mindmark
```

The custom view type is:

```text
mindmapViewUpgraded
```

Do not confuse this project with the older plugin IDs or folders:

- `obsidian-enhancing-mindmap`
- `obsidian-enhancing-mindmap-upgraded`

Those names come from the upstream project and earlier local experiments. The maintained local plugin is `mindmark`.

## What It Does

MindMark converts Markdown files with this frontmatter into an editable mind map:

```markdown
---
mindmap-plugin: basic
---
```

It supports a practical subset of Markdown:

- Headings and unordered lists as mind map structure
- Inline styles such as bold, italic, strikethrough, code, links, and embeds
- Basic Obsidian internal links and hover previews
- Export to image/HTML flows inherited from the original plugin

The plugin is optimized for the user's Obsidian vault workflow, not for publishing as a generic community plugin at this stage.

## Main Commands

Common command IDs are registered under `mindmark`:

```text
mindmark:Create New MindMap
mindmark:Set to mindmap view
mindmark:Set to markdown view
mindmark:Toggle to markdown or mindmap
mindmark:Insert child
mindmark:Add sibling/end editing
mindmark:Undo
mindmark:Redo
mindmark:Export to PNG
mindmark:Export to JPEG
```

Keyboard behavior in the mind map view includes:

- `Tab`: add child node
- `Enter`: add sibling node
- `Delete` / `Backspace`: delete selected node
- `Space` / double-click: edit node
- Arrow keys: navigate nodes
- `F`: toggle focus mode on the selected node
- `Esc`: exit focus mode or cancel editing
- `Cmd/Ctrl + Z`: undo
- `Cmd/Ctrl + Y`: redo

## Internal Link Settings

MindMark provides two settings for Obsidian internal links rendered inside nodes:

- **Enable internal link preview**: show the target note preview on hover. Enabled by default.
- **Internal link open mode**: open links in the current tab, a new tab, or a new window. New window is the default.

## Project Structure

```text
src/main.ts                 Obsidian plugin entrypoint and command registration
src/MindMapView.ts          Obsidian TextFileView wrapper for mind map files
src/mindmap/mindmap.ts      Main runtime controller, events, layout refresh, focus mode
src/mindmap/Layout.ts       Node placement and SVG edge drawing
src/mindmap/INode.ts        Node DOM, editing, Markdown rendering, link/embed behavior
src/mindmap/Execute.ts      Command dispatcher around undoable operations
src/mindmap/Cmds.ts         Undo/redo command implementations
src/mindmap/FileSuggest.ts  Obsidian file suggestion support for node editing
src/utils.ts                Shared utilities such as uuid()
styles.css                  Runtime plugin styling
main.js                     Generated Rollup bundle loaded by Obsidian
```

`main.js` is generated but intentionally committed because Obsidian loads the bundled plugin file directly.

## Development

Install dependencies:

```bash
npm install
```

Build:

```bash
npm run build
```

The expected clean build output is:

```text
src/main.ts -> ....
created . in ...
```

There should be no TypeScript warnings and no Rollup circular dependency warnings.

## Deploy To The Local Obsidian Plugin

After building in this repo, copy the generated runtime files into the active Obsidian plugin directory:

```bash
cp main.js styles.css "/Users/ian/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian/.obsidian/plugins/mindmark/"
```

Then reload the plugin:

```bash
obsidian plugin:reload id=mindmark
```

If the plugin is disabled:

```bash
obsidian plugin:enable id=mindmark filter=community
obsidian plugin:reload id=mindmark
```

## Verification

Open a known mind map file:

```bash
obsidian open path='00-INBOX/未命名思维导图.md'
obsidian command id='mindmark:Set to mindmap view'
```

Check the workspace:

```bash
obsidian workspace
```

Expected active tab:

```text
[mindmapViewUpgraded] 未命名思维导图
```

Check runtime errors:

```bash
obsidian dev:errors
```

Expected:

```text
No errors captured.
```

Optional DOM sanity check:

```bash
obsidian eval code="JSON.stringify({mindmaps:document.querySelectorAll('.mm-mindmap').length,nodes:document.querySelectorAll('.mm-node').length,paths:document.querySelectorAll('.mm-mindmap svg path').length})"
```

Expected: at least one mind map, several nodes, and SVG paths when a mind map view is open.

## Recent Important Fixes

The current local changes include:

- Focus mode now hides both out-of-scope nodes and their SVG edges.
- `Layout` receives the active `MindMap` instance directly, avoiding `Cannot read properties of null (reading 'edgeGroup')` during resize/update.
- `uuid()` was moved to `src/utils.ts` to remove runtime circular imports.
- TypeScript warnings from older Obsidian type definitions were fixed with local compatibility casts.
- `inlineSourceMap` was disabled to avoid Rollup sourcemap configuration warnings.

## Notes For Future Work

- Keep source edits in this repo, not inside the Obsidian runtime plugin folder.
- Always build before copying `main.js` to the vault plugin folder.
- If Obsidian reports old errors, clear the buffer with `obsidian dev:errors clear` before retesting.
- The repository remote still points at the original upstream unless intentionally changed.
- `node_modules` is local build state and should not be committed.
