import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

// Export a separate file:// demo without changing the production build.
const source=path.resolve('dist');
const output=path.resolve('offline-preview');
fs.mkdirSync(output,{recursive:true});
fs.cpSync(source,output,{recursive:true});
const files=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const name=path.join(dir,entry.name);entry.isDirectory()?walk(name):files.push(name);}}
walk(output);
function relativeUrl(url,file){
  if(!url.startsWith('/')||url.startsWith('//'))return url;
  const [,pathname,suffix='']=url.match(/^([^?#]*)(.*)$/);
  const target=path.join(output,pathname.endsWith('/')?pathname+'index.html':pathname);
  return path.relative(path.dirname(file),target).split(path.sep).join('/')+suffix;
}
let pages=0,checked=0;
for(const file of files.filter(x=>x.endsWith('.html'))){
  let html=fs.readFileSync(file,'utf8');
  html=html.replace(/<link\b[^>]*rel="preload"[^>]*as="font"[^>]*>/g,'');
  html=html.replace(/\b(href|src)="(\/[^\"]*)"/g,(_,attribute,url)=>`${attribute}="${relativeUrl(url,file)}"`);
  html=html.replace(/\bsrcset="([^\"]*)"/g,(_,value)=>`srcset="${value.split(',').map(candidate=>{const [url,...size]=candidate.trim().split(/\s+/);return [relativeUrl(url,file),...size].join(' ');}).join(', ')}"`);
  fs.writeFileSync(file,html);
  for(const match of html.matchAll(/\b(?:href|src)="([^\"]+)"/g)){
    const url=match[1];if(/^(?:[a-z][a-z\d+.-]*:|#|\/\/)/i.test(url))continue;
    const target=path.resolve(path.dirname(file),url.split(/[?#]/)[0]);
    assert(target.startsWith(output+path.sep),`Escaping reference: ${url}`);
    assert(fs.existsSync(target)&&fs.statSync(target).isFile(),`Missing file: ${url}`);checked++;
  }
  for(const match of html.matchAll(/\bsrcset="([^\"]*)"/g))for(const candidate of match[1].split(',')){
    const url=candidate.trim().split(/\s+/)[0];assert(fs.existsSync(path.resolve(path.dirname(file),url)),`Missing responsive image: ${url}`);checked++;
  }
  assert(!/\b(?:href|src)="\/(?!\/)/.test(html),'Root-relative file reference remains');pages++;
}
for(const file of files.filter(x=>x.endsWith('.css'))){
  let css=fs.readFileSync(file,'utf8');
  css=css.replace(/url\(['"]?(\/assets\/[^)'"\s]+)['"]?\)/g,(_,url)=>{
    if(url.endsWith('.woff2'))return `url('data:font/woff2;base64,${fs.readFileSync(path.join(output,url)).toString('base64')}')`;
    return `url('${relativeUrl(url,file)}')`;
  });fs.writeFileSync(file,css);
}
fs.writeFileSync(path.join(output,'OPEN-WEBSITE.txt'),`1 & DONE REMOVAL - OFFLINE WEBSITE DEMO\r\n\r\nDouble-click index.html in this folder to open the website.\r\nNo installation, internet connection, or local server is needed.\r\n\r\nKeep index.html, assets, and all page folders together.\r\nUse the site's navigation to move between pages.\r\n\r\nBusiness phone and email links open your device’s apps. Google review buttons\r\nare prepared but disabled until the business links are supplied.\r\nExternal image-credit links require internet if clicked.\r\n\r\nThis copy is for showing the website locally, not the production\r\nhosting package. The original project remains on the computer.\r\n`);
console.log(`Offline export ready: ${output}`);
console.log(`PASS: ${pages} HTML pages; ${checked} file links/images; local font embedded for offline browser compatibility.`);
