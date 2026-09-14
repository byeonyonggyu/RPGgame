export const WEAPONS = [
  {id:'mirror',name:'거울빛',tag:'연속 사격',icon:'✧',color:'#9ef5e3',cooldown:.28,description:'빠른 단일 정화 · 세 번째 공격은 삼연광'},
  {id:'petal',name:'자기꽃',tag:'부채 산탄',icon:'❋',color:'#efb3f7',cooldown:.68,description:'다섯 갈래 파편 · 가까운 적에게 집중 피해'},
  {id:'moon',name:'월륜',tag:'관통 회귀',icon:'☾',color:'#f2d391',cooldown:.85,description:'적을 관통한 달의 고리가 다시 돌아옵니다'}
];
export const ENEMIES = [
  [{name:'옹기 토우',role:'charger'},{name:'가마 불씨',role:'ranged'}],
  [{name:'간돌검 파수꾼',role:'charger'},{name:'거울의 잔영',role:'ranged'}],
  [{name:'이끼 바위',role:'tank'},{name:'폭포석 정령',role:'ranged'}],
  [{name:'자기 병정',role:'charger'},{name:'찻잔 요정',role:'ranged'}],
  [{name:'장난꾸러기 책상',role:'charger'},{name:'분필 유령',role:'ranged'}],
  [{name:'망각의 상자',role:'tank'},{name:'잊힌 시계',role:'ranged'}]
];
export function segmentDistance(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(px-ax-dx*t,py-ay-dy*t);}
export function inCone(origin,target,angle,range,halfAngle){const dx=target.x-origin.x,dy=target.y-origin.y;const delta=Math.atan2(Math.sin(Math.atan2(dy,dx)-angle),Math.cos(Math.atan2(dy,dx)-angle));return Math.hypot(dx,dy)<=range&&Math.abs(delta)<=halfAngle;}
export function animationFrame(state,time,duration=.4){const row={idle:0,walk:1,attack:2,dash:3,hit:4}[state]??0;const looping=state==='idle'||state==='walk';const frame=looping?Math.floor(time*(state==='walk'?10:3))%4:Math.min(3,Math.floor(time/duration*4));return {row,frame};}
