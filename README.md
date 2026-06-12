[中文说明](Readme-zh.md)

# MindMark

MindMark is an Obsidian plugin for editing Markdown files as visual mind maps.

It keeps your notes as normal Markdown files, so you can switch between text editing and mind map editing without maintaining a separate mind map format.

![MindMark overview](docs/screenshots/mindmark-showcase-overview.png)

## Features

- Create Markdown-backed mind map notes.
- Open compatible Markdown files directly as mind maps.
- Switch between MindMap view and Markdown view.
- Edit nodes with keyboard shortcuts and double-click editing.
- Add child nodes, sibling nodes, delete nodes, move nodes, and reorganize branches.
- Use undo and redo while editing the mind map.
- Render common Markdown formatting inside nodes, including bold, italic, highlight, strikethrough, inline code, links, and embeds.
- Render and open Obsidian internal links from mind map nodes.
- Show internal link previews on hover.
- Use file suggestions while editing wikilinks with `[[`.
- Drag nodes to change order and hierarchy.
- Expand and collapse branches.
- Use Focus Mode to highlight the selected branch.
- Configure canvas size, background, font size, layout direction, branch colors, focus overlay opacity, and internal link behavior.
- Import `.xmind` files by dragging them into the mind map.
- Export mind maps to PNG, JPEG, and HTML.

## Screenshots

### Obsidian Knowledge Links

![MindMark knowledge links](docs/screenshots/mindmark-showcase-links.png)

### Share And Export

![MindMark export](docs/screenshots/mindmark-showcase-export.png)

## Markdown Format

MindMark recognizes Markdown files with this frontmatter:

```markdown
---
mindmap-plugin: basic
---
```

Headings and unordered lists are converted into the mind map structure:

```markdown
# Project Plan

## Research
- Collect references
- Summarize findings

## Execution
- Draft outline
- Review milestones
```

The file remains a Markdown file. MindMark serializes edits back to Markdown when the note is saved.

## Commands

MindMark registers these main commands:

- `Create New MindMap`
- `Set to mindmap view`
- `Set to markdown view`
- `Toggle to markdown or mindmap`
- `Insert child`
- `Add sibling/end editing`
- `Undo`
- `Redo`
- `Export to PNG`
- `Export to JPEG`
- `Export to HTML`

## Keyboard Shortcuts

- `Tab`: add child node.
- `Enter`: add sibling node or finish editing.
- `Delete` / `Backspace`: delete selected node.
- `Space` / double-click: edit selected node.
- Arrow keys: navigate between nodes.
- `Home`: select the root node.
- `F`: toggle Focus Mode for the selected node.
- `Esc`: exit Focus Mode or cancel editing.
- `Cmd/Ctrl + Z`: undo.
- `Cmd/Ctrl + Y`: redo.
- `Cmd/Ctrl + mouse wheel`: zoom.

## Installation

### Community Plugin

After MindMark is approved in the Obsidian community plugin directory:

1. Open Obsidian Settings.
2. Go to Community plugins.
3. Search for `MindMark`.
4. Install and enable the plugin.

### Manual Installation

1. Download `manifest.json`, `main.js`, and `styles.css` from a GitHub release.
2. Create this folder in your vault: `.obsidian/plugins/mindmark`.
3. Place the three downloaded files in that folder.
4. Restart Obsidian or reload community plugins.
5. Enable MindMark in Community plugins.

## Desktop Support

MindMark is currently published as a desktop-only plugin. The editing workflow uses desktop interactions such as keyboard navigation, drag and drop, hover preview, and Electron-based export capture.

## Known Limitations

- MindMark uses Markdown as its source format, not a separate binary mind map file format.
- `.xmind` support is import-only.
- HTML export creates a standalone HTML file containing an embedded exported image.
- Very large mind maps can still take time to render, although the initial rendering pipeline has been optimized to reduce repeated layout work.

## Development

Install dependencies:

```bash
npm install
```

Build:

```bash
npm run build
```

Generated runtime files:

- `main.js`
- `styles.css`
- `manifest.json`

## Release Checklist

Before creating a GitHub release:

1. Update `manifest.json`, `package.json`, and `versions.json`.
2. Run `npm run build`.
3. Commit the source changes and generated `main.js`.
4. Create a GitHub release whose tag matches the plugin version, for example `0.2.6`.
5. Attach `manifest.json`, `main.js`, and `styles.css` to the release.

## License

MindMark is released under the MIT License. See [LICENSE.md](LICENSE.md).
