const TAU=Math.PI*2;
export class Effects {
 constructor(){this.items=[];this.particles=[];this.texts=[];this.ghosts=[];this.atlas=new Image();this.atlas.src='./assets/effects.png';this.elementAtlas=new Image();this.elementAtlas.src='./assets/elemental-effects.png';this.shake=0;this.reduced=!!globalThis.window?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;}
 clear(){this.items=[];this.particles=[];this.texts=[];this.ghosts=[];this.shake=0;}
 emit(type,x,y,{color='#a9f6e3',size=85,angle=0,amount=12,life=.45,stage=0,variant=0}={}){
  this.items.push({type,x,y,color,size,angle,life,max:life,stage,variant});
  if(this.items.length>80)this.items.shift();
  const count=this.reduced?Math.min(amount,4):amount;
  for(let i=0;i<count;i++){const a=i/count*TAU+Math.random()*.4,speed=45+Math.random()*160;this.particles.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:.25+Math.random()*.35,max:.6,size:2+Math.random()*3,color});}
  if(this.particles.length>450)this.particles.splice(0,this.particles.length-450);
 }
 element(stage,x,y,kind='impact',variant=0){const colors=['#ffc07b','#8deac7','#93deff','#efbaf5','#ffe4ae','#c8a0ff'];this.emit('element',x,y,{stage,variant,color:colors[stage],size:({ranged:70,charge:100,boss:200,impact:95,death:115})[kind]||80,amount:kind==='boss'?22:8,angle:variant===1?.25:0,life:kind==='boss'?.7:.45});}
 number(x,y,value,color='#fff2ba'){this.texts.push({x,y,text:String(value),color,life:.8});if(this.texts.length>35)this.texts.shift();}
 ghost(player,x,y){this.ghosts.push({player:{...player,face:{...player.face}},x,y,life:.28});}
 update(dt){for(const a of [this.items,this.particles,this.texts,this.ghosts])for(const e of a)e.life-=dt;this.items=this.items.filter(e=>e.life>0);this.ghosts=this.ghosts.filter(e=>e.life>0);this.texts=this.texts.filter(e=>e.life>0);this.particles=this.particles.filter(e=>e.life>0);this.particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.exp(-dt*5);p.vy*=Math.exp(-dt*5);});this.texts.forEach(t=>t.y-=36*dt);this.shake=Math.max(0,this.shake-dt*30);}
 draw(c,sprites,time){
  this.ghosts.forEach(g=>sprites.drawPlayer(c,g.player,time,{x:g.x,y:g.y,alpha:g.life/.28*.35}));
  for(const e of this.items){const progress=1-e.life/e.max;c.save();c.translate(e.x,e.y);c.rotate(e.angle);c.globalAlpha=Math.min(1,e.life/e.max*2);c.strokeStyle=e.color;c.fillStyle=e.color;c.lineWidth=3;
   const row={hit:0,slash:1,dash:2,click:3}[e.type];
   if(e.type==='element'&&this.elementAtlas.complete&&this.elementAtlas.naturalWidth){const sw=this.elementAtlas.naturalWidth/4,sh=this.elementAtlas.naturalHeight/6,frame=Math.min(3,Math.floor(progress*4));c.drawImage(this.elementAtlas,frame*sw+1,e.stage*sh+1,sw-2,sh-2,-e.size/2,-e.size/2,e.size,e.size);if(e.variant===1){c.lineWidth=1;c.beginPath();c.arc(0,0,e.size*.25*progress,0,TAU);c.stroke();}}
   else if(row!==undefined&&this.atlas.complete&&this.atlas.naturalWidth){const sw=this.atlas.naturalWidth/4,sh=this.atlas.naturalHeight/4,frame=Math.min(3,Math.floor(progress*4));c.drawImage(this.atlas,frame*sw+2,row*sh+2,sw-4,sh-4,-e.size/2,-e.size/2,e.size,e.size);}
   else if(e.type==='nova'||e.type==='heal'||e.type==='shield'||e.type==='death'){const radius=10+progress*e.size;c.beginPath();c.arc(0,0,radius,0,TAU);c.stroke();c.globalAlpha*=.5;c.beginPath();c.arc(0,0,radius*.75,0,TAU);c.stroke();for(let i=0;i<8;i++){c.save();c.rotate(i/8*TAU+progress);c.fillRect(radius-4,-2,8,4);c.restore();}}
   else if(e.type==='muzzle'){c.beginPath();c.moveTo(-8,0);c.lineTo(28,0);c.stroke();}
   c.restore();
  }
  for(const p of this.particles){c.save();c.globalAlpha=p.life/p.max;c.fillStyle=p.color;c.translate(p.x,p.y);c.rotate(p.life*6);c.fillRect(-p.size/2,-p.size/2,p.size,p.size);c.restore();}
  for(const t of this.texts){c.save();c.globalAlpha=Math.min(1,t.life*3);c.textAlign='center';c.font='bold 19px sans-serif';c.strokeStyle='#16132c';c.lineWidth=4;c.strokeText(t.text,t.x,t.y);c.fillStyle=t.color;c.fillText(t.text,t.x,t.y);c.restore();}
 }
 projectile(c,b,time){const a=Math.atan2(b.vy,b.vx);c.save();c.translate(b.x,b.y);c.rotate(a);c.strokeStyle=b.color||(b.ally?'#b6ffe8':'#f3a19c');c.fillStyle=c.strokeStyle;c.shadowColor=c.strokeStyle;c.shadowBlur=12;
  if(b.kind==='moon'){c.rotate(time*12);c.lineWidth=5;c.beginPath();c.arc(0,0,15,.2,Math.PI*1.7);c.stroke();c.lineWidth=2;c.beginPath();c.arc(0,0,9,2,Math.PI*3);c.stroke();}
  else if(b.kind==='petal'){c.beginPath();c.moveTo(12,0);c.lineTo(0,-5);c.lineTo(-12,0);c.lineTo(0,5);c.closePath();c.fill();}
  else if(!b.ally){
   const colors=['#ffa351','#75eac0','#88dfff','#eab6fa','#fff1bb','#c49fff'];c.fillStyle=b.color||colors[b.stage||0];c.strokeStyle=c.fillStyle;if(b.source==='boss')c.scale(1.3,1.3);
   if(b.stage===0){c.beginPath();c.moveTo(11,0);c.quadraticCurveTo(-4,-10,-20,-2);c.quadraticCurveTo(-5,12,11,0);c.fill();c.fillStyle='#fff1bf';c.beginPath();c.arc(4,0,4,0,TAU);c.fill();}
   else if(b.stage===1){c.lineWidth=3;c.beginPath();c.moveTo(-14,0);c.lineTo(-5,-7);c.lineTo(0,4);c.lineTo(12,-2);c.stroke();}
   else if(b.stage===2){c.lineWidth=2;c.beginPath();c.arc(0,0,8,0,TAU);c.stroke();c.beginPath();c.ellipse(2,0,5,7,0,0,TAU);c.fill();}
   else if(b.stage===3){c.rotate(time*5);c.beginPath();c.moveTo(11,0);c.lineTo(0,-7);c.lineTo(-9,0);c.lineTo(0,7);c.closePath();c.fill();c.strokeStyle='#fff0c8';c.lineWidth=1;c.stroke();}
   else if(b.stage===4){c.fillRect(-10,-3,20,6);c.globalAlpha=.4;c.fillRect(-22,-2,8,4);}
   else{c.rotate(time*6);c.lineWidth=2;c.beginPath();c.arc(0,0,10,0,TAU);c.stroke();c.beginPath();c.moveTo(0,-7);c.lineTo(0,0);c.lineTo(6,2);c.stroke();}
  }
  else{c.lineWidth=4;c.beginPath();c.moveTo(-22,0);c.lineTo(8,0);c.stroke();c.fillStyle='#fffceb';c.beginPath();c.arc(7,0,4,0,TAU);c.fill();}c.restore();
 }
}
