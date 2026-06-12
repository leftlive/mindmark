export default function parseMd(text:string){
   return text.replace(/\r\n/g, '\n').trim();
}
