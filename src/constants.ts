export const MM_VIEW_TYPE = 'mindmap';
export const MD_VIEW_TYPE = 'markdown';

export const FRONT_MATTER_REGEX = /^---\s*\n[\s\S]*?\n---\s*\n?/;

export const frontMatterKey = 'mindmap-plugin';
export const mindmapHoverSource = 'mindmark';


export const basicFrontmatter = [
  "---",
  "",
  `${frontMatterKey}: basic`,
  "",
  "---",
  "",
  "",
].join("\n");
