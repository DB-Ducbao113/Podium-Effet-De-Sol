import fs from 'node:fs';
import path from 'node:path';
import type {Plugin} from 'vite';

/**
 * DEV-ONLY original CAD streaming for the Model B scroll source review.
 *
 * Assets come exclusively from .local-assets/model-b-scroll-preview (Git-
 * ignored), populated by stage_model_b_scroll_assets.py after SHA checks.
 * Nothing is copied to Vite public, dist, Cloudflare or production.
 *
 * Exposes ONLY seven exact local review paths. No arbitrary file browsing,
 * user-supplied paths, query path traversal or upload endpoints.
 */
export default function modelBLocalCadPlugin():Plugin{
  const root=path.resolve(import.meta.dirname,
    '../../../.local-assets/model-b-scroll-preview');
  const allowed=new Map<string,{file:string;type:string}>([
    ['/index.json',{file:'index.json',type:'application/json; charset=utf-8'}],
    ['/p28/manifest.json',{file:'p28/manifest.json',type:'application/json; charset=utf-8'}],
    ['/p28/source.glb',{file:'p28/source.glb',type:'model/gltf-binary'}],
    ['/p212/manifest.json',{file:'p212/manifest.json',type:'application/json; charset=utf-8'}],
    ['/p212/source.glb',{file:'p212/source.glb',type:'model/gltf-binary'}],
    ['/p214/manifest.json',{file:'p214/manifest.json',type:'application/json; charset=utf-8'}],
    ['/p214/source.glb',{file:'p214/source.glb',type:'model/gltf-binary'}],
  ]);
  return {
    name:'peds-original-model-b-assembly-local-cad',
    apply:'serve',
    configureServer(server){
      server.middlewares.use('/__peds-model-b-cad',(request,response)=>{
        const rel=(request.url??'').split('?')[0];
        const asset=allowed.get(rel);
        if(!asset){
          response.statusCode=404;response.end('Unknown local CAD review path');return;
        }
        if(request.method!=='GET'&&request.method!=='HEAD'){
          response.statusCode=405;response.end('Read-only CAD review asset');return;
        }
        const file=path.join(root,asset.file);
        if(!fs.existsSync(file)||!fs.statSync(file).isFile()){
          response.statusCode=404;response.end('Owner CAD source not staged locally');return;
        }
        response.setHeader('Content-Type',asset.type);
        response.setHeader('Cache-Control','no-store, private');
        response.setHeader('X-Content-Type-Options','nosniff');
        response.setHeader('Content-Length',String(fs.statSync(file).size));
        if(request.method==='HEAD'){response.end();return;}
        fs.createReadStream(file).on('error',()=>{
          if(!response.headersSent)response.statusCode=500;
          response.end();
        }).pipe(response);
      });
    },
  };
}
