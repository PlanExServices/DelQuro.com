// Local review server only. Production behavior is tested against nginx in CI.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.ico':'image/x-icon','.mp3':'audio/mpeg','.mp4':'video/mp4','.xml':'application/xml','.txt':'text/plain','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{
  let url;try{url=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400).end();return}
  let file=path.resolve(root,'.'+url);
  if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403).end();return}
  if(url.split('/').some(s=>s.startsWith('.'))||/^\/(scripts|catalog|memory|deploy)\b/.test(url)){res.writeHead(404).end();return}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory()){if(!url.endsWith('/')){res.writeHead(301,{Location:url+'/'}).end();return}file=path.join(file,'index.html')}
  let code=200;if(!fs.existsSync(file)||!fs.statSync(file).isFile()){file=path.join(root,'404.html');code=404}
  const size=fs.statSync(file).size,headers={'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','Accept-Ranges':'bytes'};
  let start=0,end=size-1;const range=/bytes=(\d+)-(\d*)/.exec(req.headers.range||'');
  if(range&&code===200){start=Number(range[1]);end=range[2]?Math.min(Number(range[2]),size-1):size-1;if(start>end){res.writeHead(416,{'Content-Range':`bytes */${size}`}).end();return}code=206;headers['Content-Range']=`bytes ${start}-${end}/${size}`}
  headers['Content-Length']=end-start+1;res.writeHead(code,headers);if(req.method==='HEAD'){res.end();return}fs.createReadStream(file,{start,end}).pipe(res);
});
server.listen(Number(process.env.PORT)||4173,'127.0.0.1',()=>console.log('DelQuro preview: http://127.0.0.1:4173'));
