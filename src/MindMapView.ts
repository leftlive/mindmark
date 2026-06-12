import {
  HoverParent,
  HoverPopover,
  Menu,
  TextFileView,
  WorkspaceLeaf,
  TFile,
  Notice,
  Platform
} from "obsidian";

import MindMapPlugin from './main'
import { FRONT_MATTER_REGEX } from './constants'
import MindMap from "./mindmap/mindmap";
import { INodeData } from './mindmap/INode'
import { Transformer } from './markmapLib/markmap-lib';
import { t } from './lang/helpers'
import { uuid } from './utils'

// import domtoimage from './domtoimage.js'
import domtoimage from './dom-to-image-more.js'

const transformer = new Transformer();


export const mindmapViewType = "mindmapViewUpgraded";
export const mindmapIcon = "blocks";

export class MindMapView extends TextFileView implements HoverParent {
  plugin: MindMapPlugin;
  hoverPopover: HoverPopover | null = null;
  id: string = (this.leaf as any).id;
  mindmap: MindMap | null;
  colors: string[] = [];
  timeOut: any = null;
  fileCache: any;
  firstInit: boolean = true;
  yamlString:string=''

  getViewType() {
    return mindmapViewType;
  }
  getIcon() {
    return mindmapIcon;
  }

  getDisplayText() {
    return this.file?.basename || "mindmap";
  }

  setColors() {
    var colors:any[] = []
    try{
      if( this.plugin.settings.strokeArray){
         //colors = this.plugin.settings.strokeArray.split(',')
         colors = this.plugin.settings.strokeArray;
      }
    }catch(err){
       console.log(err,'stroke array is error');
    }

    this.colors = this.colors.concat(colors);

    // We no longer add 50 random colors. Layout.ts now uses CSS variable defined theme palettes.
  }

  exportToSvg(){
    if(!this.mindmap){
      return;
    }

   // this.mindmap.contentEL.style.visibility='hidden';
    var nodes:any[] = [];
    this.mindmap.traverseDF((n:any)=>{
       if(n.isShow()){
         nodes.push(n)
       }
    });



    var oldScrollLeft = this.mindmap.containerEL.scrollLeft;
    var oldScrollTop = this.mindmap.containerEL.scrollTop;

    var box  = this.mindmap.getBoundingRect(nodes);
    var rootBox = this.mindmap.root.getPosition();

    var disX =0,disY=0;
    if(box.x>60){
      disX = box.x - 60;
    }

    if(box.y>60){
       disY = box.y - 60;
    }

    this.mindmap.root.setPosition(rootBox.x-disX,rootBox.y-disY);
    this.mindmap.refresh();

    var w = box.width + 120;
    var h = box.height + 120;

    this.mindmap.contentEL.style.width=w+'px';
    this.mindmap.contentEL.style.height=h+'px';

    setTimeout(()=>{
      domtoimage.toPng(this.mindmap.contentEL,{}).then(dataUrl=>{
        var img = new Image()
        img.src = dataUrl;
        var str = img.outerHTML;

        const fileName = this.mindmap.path.replace(/\.md$/, '.html');
        try{
          new Notice(`Mindmap exported as HTML: ${fileName}`);
          this.app.vault.adapter.write(fileName, str);
          this.restoreMindmap(rootBox,oldScrollLeft,oldScrollTop)
        }catch(err){
          this.restoreMindmap(rootBox,oldScrollLeft,oldScrollTop)
          new Notice(`Failed to export mindmap: ${err}`);
        }

      }).catch(err=>{
        this.restoreMindmap(rootBox,oldScrollLeft,oldScrollTop)
        new Notice(err);
      })
    },200);

  }

  exportToPng(i_scale: number) {
    if (!this.mindmap) {
      return;
    }

    return this.exportImage('png', i_scale);
  }

  exportToJpeg(i_scale: number) {
    if (!this.mindmap) {
      return;
    }

    return this.exportImage('jpeg', i_scale);
  }

  private async exportImage(format: 'png' | 'jpeg', scale: number) {
    if (!this.mindmap) {
      return;
    }

    let exportEl: HTMLElement | null = null;
    const extension = format === 'png' ? '.png' : '.jpeg';

    try {
      const snapshot = this.createExportSnapshot();
      exportEl = snapshot.element;
      const options = {
        width: snapshot.width,
        height: snapshot.height,
        scale: Math.max(1, scale),
        bgcolor: format === 'jpeg'
          ? this.getExportBackgroundColor()
          : undefined,
      };
      const dataUrl = format === 'png'
        ? await domtoimage.toPng(exportEl, options)
        : await domtoimage.toJpeg(exportEl, { ...options, quality: 1.0 });
      const fileName = this.mindmap.path.replace(/\.md$/, extension);
      const arrayBuffer = await this.dataURLtoBlob(dataUrl).arrayBuffer();

      await this.app.vault.adapter.writeBinary(fileName, arrayBuffer);
      new Notice(`Mindmap exported as ${format.toUpperCase()}: ${fileName}`);
    } catch (err) {
      console.error(`Failed to export mindmap as ${format.toUpperCase()}:`, err);
      new Notice(`Failed to export mindmap as ${format.toUpperCase()}: ${err}`);
    } finally {
      exportEl?.remove();
    }
  }

  private createExportSnapshot() {
    if (!this.mindmap) {
      throw new Error('Mindmap is not available');
    }

    const nodes: any[] = [];
    this.mindmap.traverseDF((node: any) => {
      if (node.isShow() && !node.containEl.classList.contains('mm-node-dimmed')) {
        nodes.push(node);
      }
    });

    if (nodes.length === 0) {
      throw new Error('No visible nodes to export');
    }

    const padding = 60;
    const box = this.mindmap.getBoundingRect(nodes);
    const width = Math.max(1, Math.ceil(box.width + padding * 2));
    const height = Math.max(1, Math.ceil(box.height + padding * 2));
    const sourceWidth = this.mindmap.contentEL.offsetWidth;
    const sourceHeight = this.mindmap.contentEL.offsetHeight;

    const wrapper = document.createElement('div');
    wrapper.className = 'mindmark-export-snapshot';
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-100000px';
    wrapper.style.top = '0';
    wrapper.style.width = `${width}px`;
    wrapper.style.height = `${height}px`;
    wrapper.style.overflow = 'hidden';
    wrapper.style.pointerEvents = 'none';
    wrapper.style.background = this.getExportBackgroundColor();

    const contentClone = this.mindmap.contentEL.cloneNode(true) as HTMLElement;
    contentClone.style.position = 'absolute';
    contentClone.style.left = `${padding - box.x}px`;
    contentClone.style.top = `${padding - box.y}px`;
    contentClone.style.width = `${sourceWidth}px`;
    contentClone.style.height = `${sourceHeight}px`;
    contentClone.style.transform = 'none';
    contentClone.style.transformOrigin = '0 0';
    contentClone.querySelectorAll('.mm-node-dimmed').forEach((element) => {
      (element as HTMLElement).style.display = 'none';
    });

    wrapper.appendChild(contentClone);
    document.body.appendChild(wrapper);

    return { element: wrapper, width, height };
  }

  private getExportBackgroundColor() {
    if (!this.mindmap) {
      return '#ffffff';
    }

    const configuredBackground = this.plugin.settings.background;
    if (configuredBackground && configuredBackground !== 'transparent') {
      return configuredBackground;
    }

    return getComputedStyle(this.mindmap.containerEL)
      .getPropertyValue('--background-primary')
      .trim() || '#ffffff';
  }

  private restoreMindmap(rootBox: any, left: number, top: number) {
    if (!this.mindmap || !rootBox) {
      return;
    }

    const size = this.plugin.settings.canvasSize;
    this.mindmap.contentEL.style.width = size + 'px';
    this.mindmap.contentEL.style.height = size + 'px';
    this.mindmap.containerEL.scrollTop = top;
    this.mindmap.containerEL.scrollLeft = left;
    this.mindmap.root.setPosition(rootBox.x, rootBox.y);
    this.mindmap.refresh();
  }

  dataURLtoBlob(dataUrl: string) {
    var arr = dataUrl.split(','), mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  mindMapChange() {
    if (this.serializeMindMap()) {
    //  var matchArray: string[] = []
      // var collapsedIds: string[] = []
      // const idRegexMultiline = /.+ \^([a-z0-9\-]+)$/gim
      // while ((matchArray = idRegexMultiline.exec(md)) != null) {
      //   collapsedIds = [...collapsedIds, ...matchArray.slice(1, 2)];
      // }
      // this.fileCache.frontmatter.collapsedIds='';
      // if (collapsedIds.length > 0) {
      //   this.fileCache.frontmatter.collapsedIds = collapsedIds;
      // }
      //var frontMatter = this.getFrontMatter();
      // console.log(this.mindmap.path);
     // this.app.vault.adapter.write(this.mindmap.path, this.data);
       try{
        this.requestSave();
        //new Notice(`${t("Save success")}`);
       }catch(err){
        console.log(err);
        new Notice(`${t("Save fail")}`)
      }
    }
  }

  private serializeMindMap(): boolean {
    if (!this.mindmap) {
      return false;
    }

    const configuredHeadLevel = Number(this.plugin.settings.headLevel);
    this.mindmap.setting.headLevel = Number.isFinite(configuredHeadLevel)
      ? Math.max(0, Math.min(6, Math.trunc(configuredHeadLevel)))
      : 1;

    this.data = this.yamlString + this.mindmap.getMarkdown();
    return true;
  }

  async formatAndSaveMarkdown(): Promise<void> {
    if (!this.serializeMindMap()) {
      return;
    }

    await this.save(false);
  }

  getFrontMatter() {
    var frontMatter = '---\n\n';
  //  var v: any = '';
    if (this.fileCache.frontmatter) {
      // for (var k in this.fileCache.frontmatter) {
      //   if (k != 'position') {
      //     if (Object.prototype.toString.call(this.fileCache.frontmatter[k]) == '[object Array]' || Object.prototype.toString.call(this.fileCache.frontmatter[k]) == '[object Object]') {
      //       v = JSON.stringify(this.fileCache.frontmatter[k]);
      //     } else if (Object.prototype.toString.call(this.fileCache.frontmatter[k]) == '[object Number]' || Object.prototype.toString.call(this.fileCache.frontmatter[k]) == "[object String]") {
      //       v = this.fileCache.frontmatter[k];
      //     }

      //     if (v) {
      //       frontMatter += `${k}: ${v}\n`;
      //     }
      //   }
      // }
      //var position = this.fileCache.frontmatter.position;
      var position = this.fileCache.frontmatterPosition;
      var end =  position['end'].offset;

      frontMatter = this.data.substr(0,end);
    }

    frontMatter+='\n\n';
    //frontMatter += `\n---\n\n`;
    return frontMatter
  }

  constructor(leaf: WorkspaceLeaf, plugin: MindMapPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.setColors();

    this.fileCache = {
      'frontmatter': {
        'mindmap-plugin': 'basic'
      }
    }

  }


  async onClose() {
    // Remove draggables from render, as the DOM has already detached
    //this.plugin.removeView(this);
    if (this.mindmap) {
      this.mindmap.clear();
      this.contentEl.innerHTML = '';
      this.mindmap = null;
    }


  }

  clear() {

  }

  getViewData() {
    return this.data;
  }

  setViewData(data: string) {

    if (this.mindmap) {
      this.mindmap.clear();
      this.contentEl.innerHTML = '';
    }

    this.data = data;

    var mdText = this.getMdText(this.data);
    var mindData = this.mdToData(mdText);
    mindData.isRoot = true;

    // const frontmatterContentRegExResult = /^---$(.+?)^---$.+?/mis.exec(data)

    // if (frontmatterContentRegExResult != null && frontmatterContentRegExResult[1]) {
    //   frontmatterContentRegExResult[1].split('\n').forEach((frontmatterLine) => {
    //     const keyValue = frontmatterLine.split(': ')
    //     if (keyValue.length === 2) {
    //       const value = /^[{\[].+[}\]]$/.test(keyValue[1]) ? JSON.parse(keyValue[1]) : keyValue[1]
    //       this.fileCache.frontmatter[keyValue[0]] = value
    //     }
    //   });
    // }

    this.mindmap = new MindMap(mindData, this.contentEl, this.plugin.settings, this);
    this.mindmap.colors = this.colors;
    if (this.firstInit) {
      const mindmap = this.mindmap;

      setTimeout(() => {
        if (this.mindmap !== mindmap || !this.file) {
          return;
        }

        mindmap.path = this.file.path;
        this.fileCache = this.app.metadataCache.getFileCache(this.file);
        this.yamlString = this.getFrontMatter();
        mindmap.init();
        mindmap.refresh();
        mindmap.view = this;
        setTimeout(() => {
          if (this.mindmap === mindmap && mindmap.appEl) {
            mindmap.appEl.classList.add('mm-ready');
          }
        }, 50);
        
        // Auto-edit root node if the mindmap is completely new
        if (mdText.trim() === "") {
           setTimeout(() => {
               if (this.mindmap && this.mindmap.root) {
                   if (this.leaf) {
                       this.app.workspace.setActiveLeaf(this.leaf, false, true);
                   }
                   this.mindmap.root.edit();
               }
           }, 600);
        }
        
        this.firstInit = false;
      }, 100);
    } else {
      var view = this.leaf.view as MindMapView;
      this.fileCache = this.app.metadataCache.getFileCache(view.file);
      this.yamlString = this.getFrontMatter();

      this.mindmap.path = view?.file.path;
      this.mindmap.init();
      this.mindmap.refresh();
      this.mindmap.view = this;
      setTimeout(() => {
        if (this.mindmap && this.mindmap.appEl) {
          this.mindmap.appEl.classList.add('mm-ready');
        }
      }, 50);
    }
  }

  onunload() {

    if (this.mindmap) {
      this.mindmap.clear();
      this.contentEl.innerHTML = '';
      this.mindmap = null;
    }

    this.plugin.setMarkdownView(this.leaf);


  }

  onload() {
    super.onload();
    this.registerEvent(
      this.app.workspace.on("quick-preview", this.onQuickPreview, this)
    );
    this.registerEvent(
      this.app.workspace.on('active-leaf-change', (leaf) => {
        if (leaf === this.leaf) {
            setTimeout(() => this.updateMindMap(), 100);
        }
      })
    );

    // 增加切换回 Markdown 的快捷按钮
    this.addAction("document", t("Open as markdown"), async () => {
      this.plugin.mindmapFileModes[this.id || this.file.path] = "markdown";
      await this.plugin.setMarkdownView(this.leaf);
    });

    // 增加向右分屏并以 Markdown 展示的快捷按钮 (Toggle 模式)
    this.addAction("sidebar-right", "Toggle split right (Markdown)", async () => {
      // 查找当前工作区中是否已经有显示该文件的 markdown 视图
      const leaves = this.app.workspace.getLeavesOfType("markdown");
      const existingLeaf = leaves.find(l => {
         const view = l.view as any;
         return view.file && view.file.path === this.file.path;
      });

      if (existingLeaf) {
        // 如果已经存在，则将其关闭（取消分屏）
        existingLeaf.detach();
      } else {
        await this.formatAndSaveMarkdown();
        // 否则，创建一个新的右侧分屏叶子
        const newLeaf = (this.app.workspace as any).getLeaf("split", "vertical") as WorkspaceLeaf;
        // 标记这个新叶子需要以 Markdown 模式打开，避免被插件再次拦截为导图
        this.plugin.mindmapFileModes[(newLeaf as any).id || this.file.path] = "markdown";
        // 在新叶子中打开当前文件
        newLeaf.openFile(this.file, { active: true });
      }
    });
  }

  onQuickPreview(file: TFile, data: string) {
    if (file === this.file && data !== this.data) {
      this.setViewData(data);
      this.fileCache = this.app.metadataCache.getFileCache(file);
    }
  }

  updateMindMap() {
    if (this.mindmap?.root && this.contentEl && this.contentEl.clientWidth > 0) {
      this.mindmap.refresh();
      if(Platform.isDesktopApp){
        this.mindmap.center();
      }
    }
  }

  onResize() {
    super.onResize();
    this.updateMindMap();
  }

  async onFileMetadataChange(file: TFile) {
    var path = file.path;
    let md = await this.app.vault.adapter.read(path);
    this.onQuickPreview(file, md);
  }

  getMdText(str: string) {
    var md = str.trim().replace(FRONT_MATTER_REGEX, '');
    return md.trim();
  }

  mdToData(str: string) {
    function transformData(mapData: any) {
      var flag = true;
      if (mapData.t == 'blockquote') {
        mapData = mapData.c[0];
        flag = false;
        mapData.v = '> ' + mapData.v;
      }
      const regexResult = /^.+ \^([a-z0-9\-]+)$/im.exec(mapData.v);
      const id = regexResult != null ? regexResult[1] : null

     // console.log(id);

      var rawText = id ? mapData.v.replace(` ^${id}`, '') : mapData.v;
      var map: INodeData = {
        id: id || uuid(),
        text: rawText.replace(/<br>/g, '\n'),
        children: [],
        expanded: id ? false:true
      };

      if (flag && mapData.c && mapData.c.length) {
        mapData.c.forEach((data: any) => {
          map.children.push(transformData(data));
        });
      }

      return map;
    }

    if (str) {
      const { root } = transformer.transform(str);
      const data = transformData(root);
      return data;

    } else {
      return {
        id: uuid(),
        text: this.app.workspace.getActiveFile()?.basename || `${t('Untitled mindmap')}`
      }
    }
  }


  onMoreOptionsMenu(menu: Menu) {
    // Add a menu item to force the board to markdown view
    menu
      .addItem((item) => {
        item
          .setTitle(`${t("Open as markdown")}`)
          .setIcon("document")
          .onClick(async () => {
            this.plugin.mindmapFileModes[this.id || this.file.path] = "markdown";
            await this.plugin.setMarkdownView(this.leaf);
          });
      });

    // .addItem((item)=>{
    //    item
    //    .setTitle(`${t("Export to opml")}`)
    //    .setIcon('image-file')
    //    .onClick(()=>{
    //       const targetFolder = this.plugin.app.fileManager.getNewFileParent(
    //        this.plugin.app.workspace.getActiveFile()?.path || ""
    //       );
    //       if(targetFolder){
    //         console.log(targetFolder,this.plugin.app.fileManager);

    //       }
    //    })

    // })

    const parentView = Object.getPrototypeOf(MindMapView.prototype);
    parentView.onPaneMenu?.call(this, menu, 'more-options');
  }

}
