export class RelicSkills {
  constructor(player){this.player=player;this.onggi={cooldown:0,max:4};this.wedge={cooldown:0,max:5};this.shield=0}
  update(dt){this.onggi.cooldown=Math.max(0,this.onggi.cooldown-dt);this.wedge.cooldown=Math.max(0,this.wedge.cooldown-dt);this.shield=Math.max(0,this.shield-dt)}
  cast(name){const skill=this[name];if(!skill||skill.cooldown>0||this.player.game.phase!=='night')return;skill.cooldown=skill.max;if(name==='onggi'){this.shield=1.4;this.player.game.effects.push(new RingEffect(this.player.x,this.player.y,48,'#e9bd68',.5));}else{const g=this.player.game;g.effects.push(new RingEffect(this.player.x,this.player.y,150,'#cdd3a0',.45));[...g.enemies,g.boss].forEach(enemy=>{if(Math.hypot(enemy.x-this.player.x,enemy.y-this.player.y)<155)enemy.hit(35,this.player.x,this.player.y)})}}
}
export class RingEffect{constructor(x,y,r,color,life){this.x=x;this.y=y;this.r=r;this.color=color;this.life=life;this.max=life}draw(c){c.save();c.globalAlpha=this.life/this.max;c.strokeStyle=this.color;c.lineWidth=8;c.beginPath();c.arc(this.x,this.y,this.r*(1-this.life/this.max),0,Math.PI*2);c.stroke();c.restore()}}
