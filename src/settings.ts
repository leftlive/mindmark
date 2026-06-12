export class MindMapSettings {
    theme:string = 'dark';
    canvasSize:number = 8000;
    background:string = 'transparent';
    fontSize:number = 16;
    headLevel:number = 1;
    layout:string="mindmap";
    layoutDirect:string = 'mindmap'
    color?:string;
    exportMdModel?:string;
    //strokeArray?:string=''
    strokeArray?:any[];
    focusOnMove:boolean;
    focusOverlayOpacity:number = 0.4;
    enableLinkPreview:boolean = true;
    linkOpenMode:'current' | 'tab' | 'window' = 'window';
}
