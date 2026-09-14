export class Enemy{
  constructor(game,x,y){this.game=game;this.x=x;this.y=y;this.hp=55;this.radius=18;this.speed=55;this.hitFlash=0}
  update(dt){const p=this.game.player,dx=p.x-this.x,dy=p.y-this.y,d=Math.hypot(dx,dy)||1;if(d>70){this.x+=dx/d*this.speed*dt;this.y+=dy/d*this.speed*dt}if(d<38)p.damage(8*dt);this.hitFlash=Math.max(0,this.hitFlash-dt)}
  hit(amount){this.hp-=amount;this.hitFlash=.12;if(this.hp<=0){this.game.player.restore=Math.min(100,this.game.player.restore+4);this.game.effects.push({life:.25,draw:c=>{c.fillStyle='#f6d07e';c.fillRect(this.x-8,this.y-8,16,16)}})}}
  draw(c){if(this.hp<=0)return;c.save();c.translate(this.x,this.y);c.fillStyle=this.hitFlash?'#fff1bd':'#4d2e3a';c.beginPath();c.arc(0,0,this.radius,0,Math.PI*2);c.fill();c.fillStyle='#efb267';c.fillRect(-8,-3,5,5);c.fillRect(4,-3,5,5);c.restore()}
}
