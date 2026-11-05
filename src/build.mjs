import {build} from 'esbuild';import fs from 'fs';
const r=await build({entryPoints:['mw.js'],bundle:true,minify:true,format:'iife',target:'es2022',write:false,legalComments:'none'});
const js=r.outputFiles[0].text.replace(/<\/script/g,'<\\/script');
const t=fs.readFileSync('template.html','utf8');
fs.mkdirSync('../public',{recursive:true});
fs.writeFileSync('../public/index.html',t.replace('<!--MW-->',()=>`<script>${js}</script>`));
