import {IllustratedDialogue} from './IllustratedDialogue.js';
import {MainLobby} from './MainLobby.js';
import {EventBus} from '../core/EventBus.js';
import {HubUI,questSteps,questPercent} from './HubUI.js';
import {ExhibitionRenderer} from '../render/ExhibitionRenderer.js';
import {ARTIFACTS,observedCount,MUSEUM_SOURCE} from '../data/artifacts.js';
import {SaveManager,freshCampaign,validateCampaign} from './SaveManager.js';
import {MapManager} from './MapManager.js';
import {AreaManager,gateOpen} from './AreaManager.js';
import {QuestManager} from './QuestManager.js';
import {DialogueSystem} from './DialogueSystem.js';
import {CHARACTERS,QUESTS,DIALOGUES} from '../data/campaign.js';
import {STAGES,freshSave,stats,canEnter} from '../data/stages.js';
const $=id=>document.getElementById(id);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const copy=value=>structuredClone(value);
export class RPGController {
 constructor(game,{saves=new SaveManager(),map=new MapManager()}={}){
  this.game=game;this.legacy=copy(game.save);this.saves=saves;this.map=map;this.bus=new EventBus();this.active=false;this.slot=null;this.transitioning=false;this.campVisited=false;
  this.hub=new HubUI(this);this.conversation=new IllustratedDialogue(this);this.mainLobby=new MainLobby(this);this.exhibits=new ExhibitionRenderer();
  this.area=new AreaManager(map,this.bus,{capture:()=>this.capture(),cleanup:()=>this.clearRoom(),install:(room,spawn,scope)=>this.install(room,spawn,scope),fade:on=>this.fade(on)});
  if($('world-map-button'))$('world-map-button').onclick=()=>{if(this.active&&!this.transitioning)this.showMap();};if($('quest-button'))$('quest-button').onclick=()=>{if(this.active&&!this.transitioning)this.journal();};
 }
 get character(){return CHARACTERS.find(c=>c.id===this.data?.character)||CHARACTERS[0];}
 home(){if(this.active)this.onLobby();this.mainLobby.render();}
 desk(){if(this.active)this.onLobby();this.hub.render();}
 async newJourney(){try{const records=await this.saves.list(),slot=[1,2,3].find(i=>!records.some(r=>r.slot===i));if(!slot){this.home();this.game.settings();this.game.toast('모든 기록 칸이 사용 중입니다. 환경설정의 저장 기록에서 관리하세요.');return;}this.selectCharacter(slot);}catch(error){this.home();this.status(error.message,true);this.game.toast(error.message);}}
 event(type,target,extra={}){if(this.active)this.bus.emit('game:event',{type,target,phase:this.data.phase,...extra});}
 async run(action){try{return await action();}catch(error){this.game.toast(error.message||'작업을 완료하지 못했습니다.');this.status(error.message,true);return null;}}
 status(message,error=false){const node=$('rpg-status');if(node){node.textContent=message;node.dataset.error=String(error);}if($('save-status'))$('save-status').textContent=message;}
 async slots(){
  this.game.view('slots',`<section class="rpg-page"><small>THE MEMORY ARCHIVE</small><h1>세 개의 기억, 세 번의 여정</h1><p>각 기록에는 캐릭터와 탐험 진행 상황이 따로 보관됩니다.</p><p id="rpg-status" role="status">기록을 읽는 중…</p><div id="save-slots" class="save-slots"></div><button id="slots-back">환경설정으로</button></section>`);
  $('slots-back').onclick=()=>{this.home();this.game.settings();};
  try{const records=await this.saves.list();if(this.game.state!=='slots')return;this.status('안내 데스크와 수장고 텐트에서 자동 저장됩니다.');$('save-slots').innerHTML=[1,2,3].map(slot=>{const r=records.find(r=>r.slot===slot);return `<article class="slot-card"><small>SLOT 0${slot}</small><h2>${r?escape(CHARACTERS.find(c=>c.id===r.character)?.name||'알 수 없는 기록'):'아직 쓰이지 않은 밤'}</h2><p>${r?`${r.cycle}회차 · ${Math.floor(r.playSeconds/60)}분<br>${escape(r.room)}<br>${new Date(r.updatedAt).toLocaleString('ko-KR')}`:'새 학예사를 선택하고<br>여월의 기억을 찾아 떠나세요.'}</p>${r?`<button class="primary" data-load="${slot}">기록 이어가기</button><button data-delete="${slot}">이 기록 지우기</button>`:`<button class="primary" data-new="${slot}">새로운 여정</button><label class="backup-import">백업 JSON 가져오기<input type="file" accept=".json,application/json" data-backup="${slot}"></label>${this.legacy.started?`<button data-import="${slot}">이전 버전 기록 가져오기</button>`:''}`}</article>`;}).join('');document.querySelectorAll('[data-backup]').forEach(input=>input.onchange=()=>this.run(()=>this.importSave(Number(input.dataset.backup),input.files[0])));document.querySelectorAll('[data-load]').forEach(b=>b.onclick=()=>this.run(()=>this.load(Number(b.dataset.load))));document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>this.confirmDelete(Number(b.dataset.delete)));document.querySelectorAll('[data-new]').forEach(b=>b.onclick=()=>this.selectCharacter(Number(b.dataset.new)));document.querySelectorAll('[data-import]').forEach(b=>b.onclick=()=>this.selectCharacter(Number(b.dataset.import),true));}
  catch(error){this.status(error.message,true);$('save-slots').innerHTML='<button id="retry-slots">저장 연결 다시 시도</button>';$('retry-slots').onclick=()=>this.slots();}
 }
 selectCharacter(slot,migrate=false){
  this.game.view('characters',`<section class="rpg-page"><small>CHOOSE YOUR CURATOR · SLOT ${slot}</small><h1>기억을 이어 갈 사람</h1><p>시온과 동행 복원사 하연. 같은 박물관의 이야기, 서로 다른 전투 성향.</p><div class="character-cards">${CHARACTERS.map(c=>`<article style="--hero-color:${c.color}"><div class="hero-sheet" style="background-image:url('./assets/${c.art}')" role="img" aria-label="${c.name}의 대기 애니메이션"></div><small>${c.role}</small><h2>${c.name}</h2><p>${c.description}</p><div class="hero-stats">생명 ${100+c.hp} · 정화력 ${20+c.attack} · 이동 ${Math.round(c.speed*100)}%</div><button class="primary" data-character="${c.id}">${c.name}으로 시작</button></article>`).join('')}</div><p id="rpg-status" role="status"></p><button id="character-back">안내 데스크로</button></section>`);
  $('character-back').onclick=()=>this.home();document.querySelectorAll('[data-character]').forEach(b=>b.onclick=()=>this.run(async()=>{document.querySelectorAll('[data-character]').forEach(x=>x.disabled=true);try{const data=freshCampaign(b.dataset.character,migrate?this.legacy:freshSave());data.legacy.started=true;data.equipment.weapon=CHARACTERS.find(c=>c.id===data.character).weapon;await this.prepareArt(data.character);await this.saves.save(slot,data,'new');this.activate(slot,data);this.game.lobby();}finally{document.querySelectorAll('[data-character]').forEach(x=>x.disabled=false);}}));
 }
 confirmDelete(slot){this.game.dialog(`<h2>슬롯 ${slot}의 기록 삭제</h2><p>이 슬롯의 캐릭터, 탐험과 퀘스트 기록을 지웁니다. 다른 슬롯과 이전 버전의 기록은 유지됩니다.</p><button id="delete-slot-confirm">슬롯 ${slot} 삭제</button><button data-close>기록 유지</button>`);$('delete-slot-confirm').onclick=()=>this.run(async()=>{await this.saves.remove(slot);if(this.slot===slot){this.disposeCampaign();this.slot=null;this.game.save=copy(this.legacy);}this.game.closeDialog();await this.slots();});}
 async exportSave(){await this.save();const data=await this.saves.load(this.slot);const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`yeowol-slot-${this.slot}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);this.game.toast('저장 JSON 백업을 내려받았습니다.');}
 async importSave(slot,file){if(!file)return;if(file.size>16*1024*1024)throw new Error('16 MB 이하의 저장 JSON을 선택하세요.');const data=validateCampaign(JSON.parse(await file.text()));await this.saves.save(slot,data,'import');await this.slots();this.status(`슬롯 ${slot}에 백업을 복원했습니다.`);}
 async prepareArt(id){const path=`./assets/${CHARACTERS.find(c=>c.id===id).art}`;const im=new Image();im.src=path;let timer;try{await Promise.race([im.decode(),new Promise((_,reject)=>timer=setTimeout(()=>reject(new Error('캐릭터 그림을 불러오지 못했습니다. 다시 시도해 주세요.')),15000))]);}finally{clearTimeout(timer);}this.game.sprites.player=im;document.body.style.setProperty('--player-sheet',`url('${path}')`);}
 activate(slot,data){this.disposeCampaign();this.slot=slot;this.data=data;this.active=true;this.game.save=this.data.legacy;this.quests=new QuestManager(this.bus,QUESTS,data,(reward,q)=>{this.game.save.fragments[reward.stage]+=reward.amount;this.game.toast(`의뢰 완료 · ${q.name} · 파편 +${reward.amount}`);});this.dialogue=new DialogueSystem(this.bus,data,DIALOGUES);}
 async load(slot){const data=await this.saves.load(slot);if(!data)throw new Error('비어 있는 슬롯입니다.');await this.prepareArt(data.character);this.activate(slot,data);if(data.location.room==='desk')this.game.lobby();else {const saved=copy(data.player);await this.travel(data.location.room,data.location.spawn||'default',saved);}}
 disposeCampaign(){this.conversation.dispose();this.hub.dispose();this.quests?.dispose();this.dialogue?.dispose();this.active=false;this.area.dispose();this.bus.clear();this.transitioning=false;const fade=$('room-fade');if(fade){fade.hidden=true;fade.classList.remove('visible');}}
 dispose(){this.disposeCampaign();this.saves.close();}
 clearRoom(){const g=this.game;g.input?.reset();g.keys?.clear();g.firing=false;for(const key of ['enemies','bullets','hazards','effects','drops','nodes'])g[key]=[];g.boss=null;g.fx?.clear();this.campVisited=false;}
 async fade(on){const el=$('room-fade');if(!el)return;el.hidden=false;el.classList.toggle('visible',on);await new Promise(resolve=>setTimeout(resolve,on?180:120));if(!on)el.hidden=true;}
 capture(){if(!this.active||!this.area.current||!this.game.player)return;const g=this.game,r=this.area.current;
  const actor=e=>({id:e.id,x:e.x,y:e.y,hp:Math.max(0,e.hp),maxHp:e.maxHp,variant:e.variant||0});
  this.data.rooms[r.id]={nodes:g.nodes.map(n=>({done:n.done,turn:n.turn})),enemies:g.enemies.filter(e=>e.hp>0).map(actor),boss:g.boss?actor(g.boss):null,drops:g.drops.map(d=>({x:d.x,y:d.y}))};
  this.data.inventory[`field-${r.stage}`]=g.loot;this.data.equipment.weapon=g.weaponIndex;this.data.player={x:g.player.x,y:g.player.y,hp:g.player.hp,maxHp:g.player.maxHp,attack:g.player.attack,focus:g.player.focus,potions:g.potions};this.data.location={room:r.id,spawn:'default'};
 }
 async save(reason='manual'){if(!this.active)return;this.capture();this.data.legacy=this.game.save;const slot=this.slot;await this.saves.save(slot,this.data,reason);this.status(`슬롯 ${slot} · ${reason==='checkpoint'?'체크포인트 자동 저장':'기록 저장'} 완료`);}
 async travel(id,spawn='default',restorePlayer=null){
  if(this.transitioning)return;const g=this.game;
  if(id==='desk'){g.closeDialog();g.lobby();return;}
  if(!canEnter(g.save,Number(id[0])))throw new Error('이전 전시실의 유물 능력이 필요합니다.');
  this.transitioning=true;g.input.reset();g.keys.clear();g.firing=false;this.restorePlayer=restorePlayer;const oldState=g.state;g.closeDialog();
  try{await this.area.enter(id,spawn);this.data.phase='night';this.data.location={room:id,spawn};}
  catch(error){if(this.area.current)g.state=oldState;throw error;}
  finally{this.restorePlayer=null;this.transitioning=false;}
 }
 startStage(index){return this.run(()=>this.travel(`${index}-entry`));}
 install(room,spawn,scope){const g=this.game,previous=this.restorePlayer||this.data.player;
  g.startArena(room.stage);const base=stats(g.save),c=this.character;g.player.maxHp=base.hp+c.hp;g.player.attack=base.attack+c.attack+(this.data.equipment.charm!==null?4:0);g.player.hp=previous?Math.min(previous.hp,g.player.maxHp):g.player.maxHp;g.player.focus=previous?.focus??50;g.potions=previous?.potions??(g.save.clues.includes(room.stage)?3:2);g.weaponIndex=this.data.equipment.weapon;
  Object.assign(g.player,spawn);if(this.restorePlayer&&!this.map.blocked(room,previous.x,previous.y)){g.player.x=previous.x;g.player.y=previous.y;}
  const saved=this.data.rooms[room.id];g.nodes=room.kind==='sanctum'?g.nodes:[];if(saved)g.nodes.forEach((n,i)=>Object.assign(n,saved.nodes[i]||{}));
  const sources=saved?saved.enemies:room.enemies;g.enemies=sources.filter(e=>!this.data.world.killed.includes(e.id)).map(e=>{const actor=g.makeEnemy(e.x,e.y,e.variant);actor.id=e.id;if(saved){actor.hp=Math.max(1,actor.maxHp*Math.min(1,e.hp/e.maxHp));}return actor;});
  g.boss=saved?.boss?.hp>0?{...saved.boss,freeze:0}:null;g.drops=copy(saved?.drops||[]);g.loot=this.data.inventory[`field-${room.stage}`]||0;
  if(room.kind==='sanctum'&&g.save.cleared.includes(room.stage)){g.nodes.forEach(n=>n.done=true);g.boss=null;}
  if(!this.data.world.visited.includes(room.id))this.data.world.visited.push(room.id);
  this.data.phase='night';this.data.location={room:room.id,spawn:'default'};g.weaponHud();g.updateHud();
  scope.own(this.bus.on('room:refresh',()=>g.updateHud()));this.event('visit',room.id);
 }
 onLobby(){if(!this.active)return;this.capture();this.area.dispose();this.data.phase='day';this.data.location={room:'desk',spawn:'default'};this.data.player=null;this.run(()=>this.save('checkpoint'));

 }
 move(player,dx,dy){if(!this.active||!this.area.current)return false;this.map.move(this.area.current,player,dx*this.character.speed,dy*this.character.speed);return true;}
 constrainActor(actor,old){if(!this.active||!this.area.current)return;const dx=actor.x-old.x,dy=actor.y-old.y;actor.x=old.x;actor.y=old.y;this.map.move(this.area.current,actor,dx,dy);}
 enemyTarget(actor,player,dt){if(!this.active||!this.area.current||!this.map.rayBlocked(this.area.current,actor.x,actor.y,player.x,player.y))return player;actor.navTime=(actor.navTime||0)-dt;if(actor.navTime<=0||!actor.waypoint||Math.hypot(actor.x-actor.waypoint.x,actor.y-actor.waypoint.y)<12){actor.navTime=.35;actor.waypoint=this.map.nextStep(this.area.current,actor,player);}return actor.waypoint;}
 projectileBlocked(x1,y1,x2,y2){return this.active&&this.area.current&&this.map.rayBlocked(this.area.current,x1,y1,x2,y2);}
 tick(dt){if(!this.active||!this.area.current)return;this.data.playSeconds+=dt;const point=this.area.current.points.find(p=>p.type==='checkpoint'&&Math.hypot(p.x-this.game.player.x,p.y-this.game.player.y)<70);if(point&&!this.campVisited){this.campVisited=true;this.rest();}}
 rest(){this.game.player.hp=this.game.player.maxHp;this.game.potions=this.game.save.clues.includes(this.game.stageIndex)?3:2;this.game.fx.emit('heal',this.game.player.x,this.game.player.y,{color:'#a5ead5',size:130,amount:16});this.run(()=>this.save('checkpoint'));this.game.toast('안전한 텐트 · 생명 회복 · 자동 저장');}
 nearPoint(){if(!this.active||!this.area.current)return null;return this.area.current.points.filter(p=>Math.hypot(p.x-this.game.player.x,p.y-this.game.player.y)<95).sort((a,b)=>Math.hypot(a.x-this.game.player.x,a.y-this.game.player.y)-Math.hypot(b.x-this.game.player.x,b.y-this.game.player.y))[0]||null;}
 interact(){const p=this.nearPoint();if(!p)return false;const w=this.data.world;
  if(p.type==='artifact'){this.inspectArtifact(p);return true;}
  if(p.type==='portal'){if(!gateOpen(p.gate,this.data)){this.game.toast(p.gate.ability!==undefined?`${STAGES[p.gate.ability].skill}을 얻은 뒤 돌아오세요.`:'전시 조명 제어대를 먼저 작동하세요.');return true;}if(!w.doors.includes(p.id))w.doors.push(p.id);this.run(()=>this.travel(p.target,p.spawn));}
  if(p.type==='switch'){if(!w.switches.includes(p.id)){w.switches.push(p.id);this.event('switch',p.id);this.game.fx.element(this.game.stageIndex,p.x,p.y,'boss');}this.game.toast('전시 조명이 돌아왔습니다. 기억 정화 전시대가 열립니다.');}
  if(p.type==='checkpoint')this.rest();
  if(p.type==='npc')this.talk(p.id);
  if(p.type==='chest'){if(w.collected.includes(p.id)){this.game.toast('이 기록은 이미 가방에 보관했습니다.');return true;}w.collected.push(p.id);this.data.inventory[p.id]=1;this.event('collect',p.id);this.game.fx.element(this.game.stageIndex,p.x,p.y,'death');this.game.toast('기억 원본 획득 · 낮의 안내 데스크에 돌아가 보고하세요.');}
  return true;
 }
 killed(enemy){if(!this.active||!enemy.id)return;if(!this.data.world.killed.includes(enemy.id)){this.data.world.killed.push(enemy.id);this.event('kill',String(this.game.stageIndex));}}
 collected(){this.event('collect','fragment');}
 recordObservation(point){if(!this.active||this.data.world.collected.includes(point.id))return false;this.data.world.collected.push(point.id);this.event('inspect',String(this.game.stageIndex));this.game.fx.element(this.game.stageIndex,point.x,point.y,'impact');return true;}
 inspectArtifact(point){this.conversation.inspect(point);}

 onVictory(){if(!this.active)return;const i=this.game.stageIndex;this.event('boss',String(i));const id=`${i}-sanctum:boss`;if(!this.data.world.killed.includes(id))this.data.world.killed.push(id);this.capture();this.data.inventory[`field-${i}`]=0;this.area.dispose();this.data.player=null;this.data.location={room:'desk',spawn:'default'};this.data.phase='day';}
 onDefeat(){if(!this.active)return;$('retry').textContent='마지막 체크포인트 불러오기';$('retry').onclick=()=>this.run(()=>this.load(this.slot));$('return').textContent='저장 슬롯 선택';$('return').onclick=()=>this.slots();const p=document.querySelector('.result > p');if(p)p.textContent='이번 체크포인트 이후의 기록은 저장되지 않았습니다. 저장된 기억에서 다시 이어갈 수 있습니다.';}
 talk(id){this.dialogue.start(id);this.renderDialogue();}
 renderDialogue(){const node=this.dialogue.node();if(!node){this.game.closeDialog();if(this.data.phase==='day')this.desk();return;}this.game.dialog(`<section class="branch-dialogue"><small>MEMORIES HAVE A VOICE · ${this.data.phase==='day'?'낮':'밤'}</small><h2>${escape(node.speaker)}</h2><p>${escape(node.text)}</p><div class="dialogue-choices">${node.choices.map((c,i)=>`<button data-choice="${i}">${escape(c.text)} <span>→</span></button>`).join('')}</div></section>`);document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{this.dialogue.choose(Number(b.dataset.choice));this.renderDialogue();});}
 journal(){this.game.dialog(`<small>QUEST JOURNAL · ${this.data.cycle}회차</small><h2>받은 유물 의뢰</h2><p>추적할 의뢰를 선택하면 안내 데스크의 진행판에 표시됩니다.</p><div class="quest-list">${QUESTS.filter(q=>this.quests.eligible(q)).map(q=>{const state=this.data.quests[q.id],percent=questPercent(q,state,this.data.world);return `<article class="${state?.done?'done':''}"><h3>${state?.done?'✓':'◇'} ${q.name}</h3><p>${q.description}</p><button class="quest-explanation" data-quest-explain="${q.id}">도윤 학예사에게 설명 듣기</button><ul>${questSteps(q.condition,state,this.data.world).map(step=>`<li>${step.label} <b>${step.value}/${step.total}</b></li>`).join('')}</ul><div class="bar"><i style="width:${percent}%"></i></div><small>${state?.done?'보상 수령 완료':percent+'% 진행'} · ${STAGES[q.reward.stage].fragment} ${q.reward.amount}</small>${state?.done?'':`<button data-track="${q.id}">${this.data.world.choices.trackedQuest===q.id?'추적 중':'메인 화면에서 추적'}</button>`}</article>`;}).join('')}</div><button data-close>돌아가기</button>`);document.querySelectorAll('[data-quest-explain]').forEach(button=>button.onclick=()=>this.conversation.quest(QUESTS.find(q=>q.id===button.dataset.questExplain)));document.querySelectorAll('[data-track]').forEach(button=>button.onclick=()=>{this.data.world.choices.trackedQuest=button.dataset.track;this.run(()=>this.save());this.game.closeDialog();if(this.game.state==='hub')this.hub.render();else if(this.game.state==='main-lobby')this.mainLobby.render();else this.game.updateHud();});}

 equipment(){const g=this.game;g.dialog(`<small>CURATOR INVENTORY</small><h2>기억을 담는 가방</h2><button id="export-campaign">저장 JSON 백업</button><p>복원도 100%인 유물 하나를 장착하면 정화력이 4 증가합니다. 획득한 탐험 능력은 장착과 별개로 유지됩니다.</p><div class="equipment-grid">${STAGES.map((st,i)=>`<article><h3>${st.icon} ${st.skill}</h3><p>파편 ${g.save.fragments[i]} · 복원 ${g.save.restored[i]}%<br>기억 원본 ${this.data.inventory[`archive-${i}`]?'보유':'미발견'}</p><button data-equip="${i}" ${g.save.restored[i]===100?'':'disabled'}>${this.data.equipment.charm===i?'장착 해제':'유물 장착'}</button></article>`).join('')}</div>${g.save.cleared.length===6?'<button id="new-cycle">다음 회차 준비</button>':''}<div class="actions"><button data-close>닫기</button></div>`);$('export-campaign').onclick=()=>this.run(()=>this.exportSave());document.querySelectorAll('[data-equip]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.equip);this.data.equipment.charm=this.data.equipment.charm===i?null:i;this.run(()=>this.save());this.equipment();});if($('new-cycle'))$('new-cycle').onclick=()=>this.confirmCycle();}
 confirmCycle(){this.game.dialog(`<h2>새로운 밤을 시작할까요?</h2><p>현재 슬롯의 ${this.data.cycle}회차 월드·퀘스트·획득 능력을 초기화합니다. 캐릭터, 유물 복원도와 정산된 파편은 계승하고 적의 생명은 회차마다 25% 증가합니다.</p><button id="confirm-cycle">${this.data.cycle+1}회차 시작</button><button data-close>현재 회차 유지</button>`);$('confirm-cycle').onclick=()=>this.run(async()=>{const old=this.data,next=freshCampaign(old.character);next.cycle=old.cycle+1;next.playSeconds=old.playSeconds;next.legacy.started=true;next.legacy.restored=copy(old.legacy.restored);next.legacy.fragments=copy(old.legacy.fragments);next.equipment=copy(old.equipment);await this.saves.save(this.slot,next,'new-cycle');this.activate(this.slot,next);this.game.lobby();});}
 showMap(){this.game.dialog(`<small>THE CONNECTED MUSEUM</small><h2>여월의 탐험 지도</h2><p>유물 관찰 → 전시 조명 복구 → 전시대 정화 → 이전 기록실 재방문. 텐트는 발견한 구역 사이의 귀환 지점입니다.</p><div class="world-map">${STAGES.map((st,i)=>`<section><h3>${st.icon} ${st.name}</h3><div>${['entry','gallery','sanctum','archive'].map(kind=>{const id=`${i}-${kind}`,visited=this.data.world.visited.includes(id),current=this.area.current?.id===id;return `<button ${kind==='entry'&&visited?'data-camp="'+id+'"':'disabled'} class="${visited?'visited':''} ${current?'current':''}">${{entry:'△ 텐트',gallery:'◇ 회랑',sanctum:'♜ 보스실',archive:'✧ 기록실'}[kind]}<small>${current?'현재 위치':visited?'발견':'미탐험'}${kind==='archive'?` · ${STAGES[Math.min(i,4)].skill}`:''}</small></button>`;}).join('')}</div></section>`).join('')}</div><p>발견한 텐트로 이동할 수 있습니다. 전투 중 지도는 일시정지됩니다.</p><button data-close>지도로부터 돌아가기</button>`);document.querySelectorAll('[data-camp]').forEach(b=>b.onclick=()=>this.run(()=>this.travel(b.dataset.camp)));}
 hud(){if(!this.active||!this.area.current)return;const room=this.area.current;const name=this.character.name;$('hpText').textContent=`${name} · ${Math.ceil(this.game.player.hp)} / ${this.game.player.maxHp}`;$('battle-title').textContent=room.name;const point=this.nearPoint();if(point){$('interact').hidden=false;$('interact').textContent=`E · ${point.name}`;}if(room.kind!=='sanctum')$('objective').innerHTML=`<strong>${room.kind==='entry'?'텐트에서 쉬고 회랑으로 향하세요':room.kind==='gallery'?`유물 관찰 ${observedCount(this.data,room.stage)}/3 · 전시 조명을 복구하세요`:'기억 원본을 찾아 낮의 안내 데스크로 돌아가세요'}</strong>발견 ${this.data.world.visited.length}/24 · 의뢰 ${Object.values(this.data.quests).filter(q=>q.done).length}/${QUESTS.length}`;}
 draw(c){if(this.active&&this.area.current)this.exhibits.room(c,this.area.current,this.data,this.game.time);}
}
