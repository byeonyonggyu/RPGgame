import {mkdir,writeFile} from 'node:fs/promises';
import {STAGES} from '../js/data/stages.js';
import {ARTIFACTS} from '../js/data/artifacts.js';
const out=new URL('../data/maps/',import.meta.url);await mkdir(out,{recursive:true});
for(let stage=0;stage<6;stage++)for(const kind of ['entry','gallery','archive','sanctum']){
 const id=`${stage}-${kind}`,tiles=Array.from({length:18},(_,y)=>Array.from({length:32},(_,x)=>x<2||x>29||y<5||y>15?'1':'0'));
 if(kind==='gallery')for(const x of [10+stage%2,20-stage%2])for(const y of [8,9,12])tiles[y][x]='1';
 if(kind==='archive')for(let x=8;x<24;x++)if(x<14||x>17)tiles[10][x]='1';
 const portal=(name,target,x,y,gate)=>({type:'portal',id:`${id}:${target}`,name,target,x,y,spawn:'default',...(gate?{gate}:{})});
 const points=[];
 if(kind==='entry'){
  points.push({type:'checkpoint',id:`${id}:camp`,name:'안전한 수장고 텐트 · 자동 저장',x:640,y:530},portal('탐험실 →',`${stage}-gallery`,1120,420),portal('안내 데스크로','desk',160,420));
  if(stage>0)points.push(portal('이전 전시 구역',`${stage-1}-entry`,400,250));
  if(stage<5)points.push(portal('다음 전시 구역',`${stage+1}-entry`,880,250,{ability:stage}));
 }else if(kind==='gallery'){
  points.push(portal('수장고 전시대',`${stage}-entry`,160,420),portal('기억 정화 전시대',`${stage}-sanctum`,1120,420,{switch:`${id}:switch`}),portal('기록실 전시대',`${stage}-archive`,640,250,{ability:Math.min(stage,4)}),{type:'switch',id:`${id}:switch`,name:'전시 조명 제어대',x:640,y:440});
  ARTIFACTS[stage].observations.forEach(([name],i)=>points.push({type:'artifact',id:`observe-${stage}-${i}`,name,index:i,x:[280,520,1000][i],y:[290,570,290][i]}));
  if(stage===1)points.push({type:'npc',id:'hwayu',name:'화유옹주의 잔향',x:920,y:570});
 }else if(kind==='archive')points.push(portal('탐험실로',`${stage}-gallery`,160,420),{type:'chest',id:`archive-${stage}`,name:'잊힌 기억 원본',x:1000,y:280});
 else points.push(portal('탐험실로',`${stage}-gallery`,160,590));
 const room={id,stage,kind,name:`${STAGES[stage].name} · ${{entry:'수장고 텐트',gallery:'기억의 회랑',archive:'숨은 기록실',sanctum:'원념의 전시실'}[kind]}`,tileSize:40,tiles:tiles.map(r=>r.join('')),spawns:{default:{x:640,y:580}},points,enemies:kind==='entry'?[]:Array.from({length:kind==='gallery'?5+stage:kind==='archive'?3:4},(_,i)=>({id:`${id}:mob:${i}`,x:[260,430,600,940,1110][i%5],y:470+Math.floor(i/5)*80,variant:i%2}))};
 await writeFile(new URL(`${id}.json`,out),JSON.stringify(room,null,2)+'\n');
}
console.log('Authored 24 connected tile rooms.');
