import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('dist');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.xml':'application/xml','.txt':'text/plain'};
http.createServer((req,res)=>{
  let requestPath;
  try { requestPath = decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch { res.writeHead(400); return res.end(); }
  let file = path.resolve(root,'.'+requestPath);
  if (file !== root && !file.startsWith(root+path.sep)) {res.writeHead(403);return res.end();}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory()) file=path.join(file,'index.html');
  if(!fs.existsSync(file)){res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});return res.end(fs.readFileSync(path.join(root,'404.html')));}
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(file).pipe(res);
}).listen(4185,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4185'));
