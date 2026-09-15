import {difficulty} from '../data/difficulty.js';
import { RPGController } from '../rpg/RPGController.js';
import { TouchInput, canvasPoint, movementVector } from '../platform/TouchInput.js';
import { MobileDisplay } from '../platform/MobileDisplay.js';
import { Effects } from '../render/Effects.js';
import { SpriteRenderer } from '../render/Sprites.js';
import { WEAPONS, ENEMIES, segmentDistance, inCone } from '../data/combat.js';
import { STAGES, SAVE_KEY, freshSave, validateSave, canEnter, stats, restoreRelic } from '../data/stages.js';
export { STAGES };
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export class Game {
 constructor(canvas){
  this.canvas=canvas;this.ctx=canvas.getContext('2d');this.width=1280;this.height=720;
  this.cleanups=[];this.state='title';this.keys=new Set();this.time=0;this.lastTime=0;this.sound=false;this.stageIndex=0;this.storageFailed=false;
  try{this.save=validateSave(JSON.parse(localStorage.getItem(SAVE_KEY)));}catch{this.save=freshSave();this.storageFailed=true;}
  this.art=new Image();this.art.src='./assets/sion.png';this.background=new Image();this.background.src='./assets/museum.png';this.stageArt=new Image();this.stageArt.src='./assets/stages.png';
  this.fx=new Effects();this.sprites=new SpriteRenderer();this.weaponIndex=0;this.input=new TouchInput(this);this.display=new MobileDisplay(this);try{const pref=JSON.parse(localStorage.getItem('yeowol-settings-v1'));if(pref){this.input.setMode(pref.controls);this.sound=pref.sound===true;if(typeof pref.reduced==='boolean')this.fx.reduced=pref.reduced;}}catch{}this.bindInput();this.title();
 }
 start(){this.rpg??=new RPGController(this);this.rpg.mainLobby.splash();this.running=true;this.frame=requestAnimationFrame(t=>this.loop(t));}
 loop(time){if(this.disposed)return;const dt=Math.min((time-this.lastTime)/1000||0,.04);this.lastTime=time;if(this.state==='battle'&&!$('modal').open&&!this.display.blocked&&!this.rpg?.transitioning){this.time+=dt;this.update(dt);this.rpg?.tick(dt);}if(this.state==='battle')this.render();this.frame=requestAnimationFrame(t=>this.loop(t));}
 persist(){if(this.rpg?.active){this.rpg.run(()=>this.rpg.save());return;}try{localStorage.setItem(SAVE_KEY,JSON.stringify(this.save));$('save-status').textContent='진행 상황 저장됨 · 이 브라우저';}catch{this.storageFailed=true;$('save-status').textContent='저장 불가 · 이번 실행에서만 유지';}}
 view(state,html){this.rpg?.hub?.dispose();if($('modal').open)$('modal').close();this.state=state;document.body.dataset.scene=state;this.input?.reset();if(state==='title'){this.display?.leave();if(this.rpg?.active)this.rpg.disposeCampaign();document.body.style.setProperty?.('--player-sheet',"url('./assets/sion-animation.png')");}this.keys.clear();this.firing=false;$('screen').hidden=false;$('play').hidden=true;$('screen').innerHTML=html;$('phase-label').textContent=({title:'부천시립박물관 · 여월동',story:'황혼 · 거울의 공명',lobby:'낮 · 수장고 로비',result:'밤 · 기억의 정화',defeat:'귀환 · 복원대의 불빛',ending:'새벽 · 06:00'})[state]||'여월의 밤';window.scrollTo(0,0);}
 title(){
  if(this.rpg)return this.rpg.mainLobby.splash();
  this.view('title',`<section class="nocturne"><div class="night-sky"></div><div class="title-kicker"><span>BUCHEON MUSEUM</span><span>FANTASY ACTION RPG · CHRONICLES</span></div><div class="title-layout"><div class="title-copy"><span class="chapter-mark">月 <i>THE TWILIGHT ARCHIVE</i></span><h1>기억이 깨어나는<br><em>여월의 밤</em></h1><p>유리 너머 잠든 이야기,<br>오늘 밤은 당신의 손에서 다시 시작됩니다.</p><div class="title-buttons"><button class="primary" id="begin">${this.save.started?'탐험 이어가기':'밤의 박물관 입장'} <span>↗</span></button><button class="quiet" id="story-button">프롤로그 보기</button></div><div class="save-ticket"><span class="ticket-dot"></span><span>${this.save.started?`시온의 기록 · ${this.save.cleared.length}/6 구역 정화`:'새로운 학예사의 첫 번째 밤'}</span></div></div><div class="title-stage"><div class="moon-disc"></div><div class="orbital orbital-a"></div><div class="orbital orbital-b"></div><span class="floating-rune rune-a">✧</span><span class="floating-rune rune-b">◇</span><div class="animated-sion" role="img" aria-label="거울을 들고 숨 쉬는 시온 애니메이션"></div><div class="character-plaque"><small>CURATOR No. 01</small><strong>시온</strong><span>잊힌 시간을 비추는 작은 거울</span></div></div><aside class="chapter-aside"><span class="vertical-label">24 ROOMS · SIX ERAS</span>${STAGES.map((st,i)=>`<span class="mini-chapter ${this.save.cleared.includes(i)?'complete':''}"><b>0${i+1}</b>${st.name}<i>${this.save.cleared.includes(i)?'✧':'·'}</i></span>`).join('')}</aside></div><div class="title-bottom"><div><span class="edition">NEW</span><b>달의 전투술</b><span>연속 사격 · 산탄 · 회귀 월륜</span></div><button id="combat-guide">새로운 조작 살펴보기 <span>↗</span></button></div></section><section class="title-features"><div><span>01</span><h3>깨어난 전시실</h3><p>여섯 시대, 서로 다른 수호자</p></div><div><span>02</span><h3>손끝에서 피는 빛</h3><p>거울을 바꾸고, 공격을 이어가세요</p></div><div><span>03</span><h3>사라지지 않는 기억</h3><p>정화한 유물을 복원하는 여정</p></div></section>`);
  $('begin').onclick=()=>this.boot();$('story-button').onclick=()=>this.story();$('combat-guide').onclick=()=>this.help();
 }

 async boot(){
  this.view('loading',`<section class="loading-scene"><div class="loading-moon">☾</div><small>THE MUSEUM AWAKENS</small><h1>여월의 문을 여는 중</h1><p>시온과 함께 전시실의 기억을 불러옵니다.</p><div class="bar"><i id="loading-progress" style="width:0%"></i></div><span id="loading-count">그림 준비 중</span></section>`);
  const orientation=this.display.enter();
  const images=[this.art,this.background,this.stageArt,this.sprites.player,this.sprites.enemies,this.fx.atlas,this.fx.elementAtlas,...(this.rpg?[this.rpg.exhibits.atlas]:[])];let loaded=0;
  const results=await Promise.allSettled(images.map(async image=>{let timer;try{await Promise.race([image.decode(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('asset timeout')),15000);})]);}finally{clearTimeout(timer);loaded++;if(this.state==='loading'){$('loading-progress').style.width=`${loaded/images.length*100}%`;$('loading-count').textContent=`${loaded} / ${images.length} 준비 완료`;}}}));
  await orientation;if(this.state!=='loading')return;
  if(results.some(r=>r.status==='rejected')){this.view('loading',`<section class="loading-scene"><h1>전시실을 불러오지 못했어요</h1><p>연결을 확인한 뒤 다시 시도해 주세요.</p><button class="primary" id="load-retry">다시 불러오기</button><button id="load-back">시작 화면으로</button></section>`);$('load-retry').onclick=()=>{for(const im of images)if(!im.naturalWidth)im.src=im.src;this.boot();};$('load-back').onclick=()=>this.title();return;}
  if(this.rpg)await this.rpg.newJourney();else this.save.started?this.lobby():this.story();
 }

 story(){this.view('story',`<section class="story"><small>PROLOGUE · 거울이 깨어난 밤</small><h1>흙을 빚던 손길은<br>아직 이곳에 남아 있다.</h1><p>여월동, 달과 같은 마을. 세상의 눈을 피해 옹기를 굽던 사람들의 숨결이 남은 땅 위에 박물관이 세워졌다.</p><p>특별 기획전을 준비하던 초보 학예사 <b>시온</b>은 미등록 상자 하나를 연다. 화유옹주의 부장품 거울과 오랜 제사 수석이 공명하고, 전시실마다 서로 다른 시대가 흘러넘치기 시작한다.</p><div class="companion"><span class="pot">♨</span><div><b>점동이 · 옹기토에서 태어난 길잡이</b><p>“겁먹지 마. 저 녀석들도 잊히는 게 무서운 거여.<br>때려 부수는 대신, 그 안에 담긴 마음을 들어 주자고.”</p></div></div><div class="actions"><button id="back-title">돌아가기</button><button class="primary" id="to-lobby">시온의 첫 출근 →</button></div></section>`);$('back-title').onclick=()=>this.title();$('to-lobby').onclick=()=>{if(this.rpg&&!this.rpg.active){this.rpg.slots();return;}this.save.started=true;this.persist();this.lobby();};}
 lobby(){
  if(this.rpg)return this.rpg.home();
  const s=stats(this.save),count=this.save.cleared.length,next=Math.min(count,5),stage=STAGES[next];
  this.view('lobby',`<section class="museum-lobby"><div class="lobby-vignette"></div><div class="museum-ornament ornament-top"></div><div class="museum-ornament ornament-bottom"></div><div class="lobby-topline"><div><small>BUCHEON MUSEUM · 17:30</small><h2>박물관의 황혼</h2></div><div class="lobby-currency"><span>◇ ${this.save.fragments.reduce((a,b)=>a+b,0)} <small>유물 파편</small></span><button id="lobby-settings" aria-label="설정">⚙</button></div></div><div class="lobby-character"><div class="animated-sion" role="img" aria-label="대기 중인 학예사 시온"></div><div class="lobby-nameplate"><small>기억을 잇는 학예사</small><strong>시온 <em>Lv. ${1+this.save.restored.filter(x=>x===100).length}</em></strong><span>생명 ${s.hp} · 정화력 ${s.attack}</span></div></div><div class="lobby-menu"><small>THE TWILIGHT LOBBY</small><h1>수장고의 밤</h1><div class="gold-divider"><i></i><span>◯ ● ◯</span><i></i></div><button class="gilded-menu selected" id="exhibitions"><span>❯❯</span>밤의 전시실로<span>❮❮</span></button><button class="gilded-menu" id="restoration">유물 복원대</button><button class="gilded-menu" id="journal">학예 연구 일지</button><button class="gilded-menu" id="bestiary">수호자 도감</button><button class="gilded-menu small-menu" id="lobby-title">시작 화면으로</button></div><aside class="lobby-memory"><small>오늘 이어갈 기억</small><div class="stage-card" data-stage="${next}"><div class="stage-art"></div></div><h3>${stage.name}</h3><p>${stage.sub}</p><span class="memory-reward">정화 보상 · ${stage.skill}</span><div class="lobby-progress"><div class="bar"><i style="width:${count/6*100}%"></i></div><small>기억 복원 ${count} / 6</small></div></aside><div class="lobby-bottomline"><span>♨ 점동이</span><p>${count===6?'“모두 돌아왔구먼. 남은 유물도 함께 복원해 보자고.”':'“흙에 담긴 마음을 잊지 마. 오늘도 우리가 기억해 주는 거여.”'}</p><button id="lobby-help">조작 안내</button></div></section>`);
  $('exhibitions').onclick=()=>this.exhibitions();$('restoration').onclick=()=>this.restoration();$('journal').onclick=()=>this.journal();$('bestiary').onclick=()=>this.bestiary();$('lobby-settings').onclick=()=>this.settings();$('lobby-title').onclick=()=>this.title();$('lobby-help').onclick=()=>this.help();this.rpg?.onLobby();
 }
 exhibitions(){this.dialog(`<small>EXHIBITION PORTALS</small><h2>오늘 밤의 전시실</h2><p>기억을 정화하면 다음 구역의 문이 열립니다.</p><div class="stage-grid">${STAGES.map((st,i)=>`<button class="stage-card" data-stage="${i}" ${!canEnter(this.save,i)?'disabled':''} style="--accent:${st.color}"><div class="stage-art"><span>${st.icon}</span></div><div class="stage-content"><small>${i===5?'FINAL CHAPTER':`CHAPTER 0${i+1}`}</small><h3>${st.name}</h3><p>${st.sub}</p><span class="status">${this.save.cleared.includes(i)?'✓ 정화 완료 · 다시 탐험':canEnter(this.save,i)?'☾ 탐험 가능 →':'이전 구역 정화 필요'}</span></div></button>`).join('')}</div><div class="actions">${this.save.cleared.length===6?'<button id="ending">새벽의 이야기</button>':''}<button data-close>로비로 돌아가기</button></div>`);document.querySelectorAll('button[data-stage]').forEach(b=>b.onclick=()=>this.stageIntro(Number(b.dataset.stage)));if($('ending'))$('ending').onclick=()=>{this.closeDialog();this.ending();};}
 bestiary(){this.dialog(`<small>KEEPERS OF THE MUSEUM</small><h2>깨어난 수호자들</h2><p>공격 전의 빛을 살펴보세요. 돌진형은 경고선을 남기고, 원거리형은 유물의 기운을 쏘아 보냅니다.</p><div class="bestiary-grid">${STAGES.map((st,i)=>`<section class="bestiary-row"><h3>${st.name}</h3><div>${[...ENEMIES[i].map(e=>({name:e.name,detail:({charger:'돌진 예고 · 궤적 공격',ranged:'원거리 기운 · 거리 유지',tank:'바위 충격 · 강한 접촉 피해'})[e.role]})),{name:st.boss,detail:st.pattern}].map((e,j)=>`<article><div class="enemy-portrait" role="img" aria-label="${e.name}" style="background-position:${j*50}% ${i*20}%"></div><strong>${e.name}</strong><p>${e.detail}</p></article>`).join('')}</div></section>`).join('')}</div><div class="actions"><button data-close>닫기</button></div>`);}
 saveSettings(){try{localStorage.setItem('yeowol-settings-v1',JSON.stringify({controls:this.input.mode,sound:this.sound,reduced:this.fx.reduced}));}catch{}}
 settings(){this.dialog(`<section class="settings-panel"><small>MUSEUM SETTINGS</small><h2>환경설정</h2><div class="settings-shortcuts"><button id="settings-help">조작법 보기</button><button id="settings-load">저장 기록 이어하기</button><button id="settings-new">새 학예사 등록</button></div><div class="gold-divider"><i></i><span>◯ ● ◯</span><i></i></div><div class="setting-row"><span>조작 방식</span><select id="control-mode" aria-label="조작 방식"><option value="auto" ${this.input.mode==='auto'?'selected':''}>기기에 맞게 자동</option><option value="touch" ${this.input.mode==='touch'?'selected':''}>스크린 터치</option><option value="keyboard" ${this.input.mode==='keyboard'?'selected':''}>키보드 · 마우스</option></select></div><button id="settings-sound" class="setting-row">효과음 <b>${this.sound?'켜짐':'꺼짐'}</b></button><button id="settings-effects" class="setting-row">화면 흔들림 · 입자 <b>${this.fx.reduced?'줄이기':'기본'}</b></button><button id="settings-fullscreen" class="setting-row">전체 화면 · 가로 전환 <b>↗</b></button><p>자동 회전이 지원되지 않으면 기기를 가로로 돌려 주세요.</p><div class="actions"><button class="primary" data-close>돌아가기</button></div></section>`);$('settings-help').onclick=()=>this.help();$('settings-load').onclick=()=>{this.closeDialog();if(this.rpg)this.rpg.slots();};$('settings-new').onclick=()=>this.boot();$('control-mode').onchange=e=>{this.input.setMode(e.target.value);this.saveSettings();};$('settings-sound').onclick=()=>{this.sound=!this.sound;$('sound').textContent=this.sound?'소리 켜짐':'소리 꺼짐';$('sound').setAttribute('aria-pressed',String(this.sound));this.saveSettings();this.settings();};$('settings-effects').onclick=()=>{this.fx.reduced=!this.fx.reduced;this.saveSettings();this.settings();};$('settings-fullscreen').onclick=()=>this.display.enter();}

 stageIntro(index){if(!canEnter(this.save,index))return;this.stageIndex=index;const s=STAGES[index];this.dialog(`<small>18:00 · 셔터가 내려갑니다</small><h2>${s.icon} ${s.name}</h2><p>${s.lore}</p><div class="card"><small>오늘 밤의 목표</small><p>${s.objective}</p><small>균열의 수호자 · ${s.boss}</small><p>${s.pattern}</p><small>정화 보상 · ${s.skill}</small></div><p>${this.save.clues.includes(index)?s.hint:'연구 일지에서 이 구역의 단서를 미리 확인할 수 있습니다.'}</p><div class="actions"><button data-close>로비로</button><button class="primary" id="enter">밤의 전시실로 →</button></div>`);$('enter').onclick=()=>{this.closeDialog();this.enterStage(index);};}
 restoration(){this.dialog(`<small>RESTORATION ATELIER</small><h2>유물 복원대</h2><p>해당 구역 파편 3개로 25% 복원합니다. 100%마다 생명 +15, 정화력 +4가 영구 적용되며 게임 도록이 열립니다.</p><div class="relic-list">${STAGES.map((s,i)=>`<div class="relic-row"><button data-restore="${i}" ${this.save.fragments[i]<3||this.save.restored[i]>=100?'disabled':''}>${this.save.restored[i]>=100?'복원 완료':'파편 3개 사용'}</button><h3>${s.icon} ${s.fragment}</h3><p>파편 ${this.save.fragments[i]}개 · 복원 ${this.save.restored[i]}%</p><div class="bar"><i style="width:${this.save.restored[i]}%"></i></div></div>`).join('')}</div><div class="actions"><button data-close>로비로 돌아가기</button></div>`);document.querySelectorAll('[data-restore]').forEach(b=>b.onclick=()=>{if(restoreRelic(this.save,Number(b.dataset.restore))){this.persist();this.lobby();this.restoration();this.tone(650);}});}
 journal(){this.dialog(`<small>CURATOR'S JOURNAL</small><h2>기억의 단서와 도록</h2><p>안내 데스크에 남겨진 관람객의 이야기를 수집하세요. 단서 수집 시 해당 전시실 탐험에 회복약 1개가 추가됩니다.</p><div class="relic-list">${STAGES.map((s,i)=>`<div class="relic-row"><h3>${s.name}</h3><p>${canEnter(this.save,i)?s.hint:'이전 구역을 정화하면 관람객의 단서가 열립니다.'}</p>${canEnter(this.save,i)?`<button data-clue="${i}" ${this.save.clues.includes(i)?'disabled':''}>${this.save.clues.includes(i)?'단서 수집 완료':'관람객 단서 수집'}</button>`:''}<p>${this.save.restored[i]===100?`도록 해금 · ${s.archive}`:'도록 잠김 · 유물 복원 100% 필요'}</p></div>`).join('')}</div><p>도록 글과 이미지는 게임을 위한 창작 해석입니다. 박물관 공식 도록·소장품 아카이브 원본은 포함하지 않았습니다.</p><div class="actions"><button data-close>닫기</button></div>`);document.querySelectorAll('[data-clue]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.clue);if(!this.save.clues.includes(i))this.save.clues.push(i);this.persist();this.journal();});}
 dialog(html){this.input.reset();this.keys.clear();this.firing=false;$('modal-content').innerHTML=html;if(!$('modal').open)$('modal').showModal();document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>this.closeDialog());}
 closeDialog(){$('modal').close();this.keys.clear();if(this.state==='battle')this.canvas.focus({preventScroll:true});}
 help(){this.dialog(`<small>FIELD GUIDE</small><h2>밤의 박물관, 이렇게 탐험하세요</h2><p>유물 전시대의 순서와 빛을 복원하면 보스가 깨어납니다. 빛으로 원념을 정화하고 모은 파편을 로비에서 복원하세요.</p><div class="controls-grid">${[['WASD / 방향키','이동'],['J / 왼쪽 클릭','선택한 무기로 공격'],['Z','거울빛 · 자기꽃 · 월륜 전환'],['K / 우클릭','초승달 참격 · 4초 재사용'],['L','기억 폭발 · 공명 50 소모'],['SPACE','이동 방향으로 회피 · 잠깐 무적'],['E','가까운 유물 상호작용'],['1~5','정화한 구역의 유물 스킬'],['R','회복약 · 생명 45 회복'],['H','조작 안내 · 전투 정지'],['ESC','일시정지 / 창 닫기']].map(([k,t])=>`<div><kbd>${k}</kbd>${t}</div>`).join('')}</div><p>J는 가까운 적을 향해 자동 조준합니다. 거울빛은 세 번째 공격에 삼연광, 자기꽃은 다섯 갈래 산탄, 월륜은 관통 후 회귀합니다. 적을 맞히면 공명이 쌓이고 L로 광역 폭발을 일으킬 수 있습니다. 마우스 공격은 커서 방향으로 발사합니다. 붉은 바닥 표시는 곧 공격이 떨어질 곳입니다. 터치에서는 왼쪽 조이스틱으로 이동하고 오른쪽 공격 버튼을 길게 눌러 자동 조준 연속 공격합니다. 손가락 두 개로 이동과 공격을 동시에 할 수 있습니다. 회피·참격·폭발·무기 전환과 조사·회복 버튼도 화면에 있습니다.</p><p>낮에는 연구 일지에서 단서를 수집하고 복원대에서 영구 능력을 강화할 수 있습니다. RPG에서는 M으로 탐험 지도, Q로 의뢰 일지를 엽니다. 전시대 세 곳을 관찰하고 전시 조명을 복구한 뒤, 능력을 얻은 뒤 숨은 기록실에 재방문하세요. 안내 데스크와 텐트는 자동 저장 지점입니다. 사망 시 마지막 체크포인트를 불러옵니다.</p><div class="actions"><button class="primary" data-close>준비됐어요</button></div>`);}
 pause(){if(this.state!=='battle')return;this.dialog(`<section class="pause-menu"><small>PAUSED · 시간이 잠시 멈춥니다</small><h2>여월의 쉼표</h2><div class="gold-divider"><i></i><span>◯ ● ◯</span><i></i></div><button class="gilded-menu selected" data-close>❯❯ 계속 탐험 ❮❮</button><button class="gilded-menu" id="pause-settings">설정</button><button class="gilded-menu small-menu" id="abandon">귀환 · 안내 데스크</button><p>안내 데스크로 귀환하면 탐험 상태를 저장합니다. 지도 M · 의뢰 Q로 여정을 확인하세요.</p></section>`);$('abandon').onclick=()=>{this.closeDialog();this.lobby();};$('pause-settings').onclick=()=>this.settings();}

 enterStage(index){if(this.rpg?.active)return this.rpg.startStage(index);return this.startArena(index);}
 startArena(index){
  this.rpg?.hub?.dispose();
  if(!canEnter(this.save,index))return;
  this.stageIndex=index;this.state='battle';document.body.dataset.scene='battle';this.input.reset();this.display.active=true;this.display.sync();this.time=0;this.victoryDelay=0;this.gasTick=-1;this.keys.clear();this.firing=false;
  const st=STAGES[index],s=stats(this.save);this.player={x:640,y:570,hp:s.hp,maxHp:s.hp,attack:s.attack,inv:0,shot:0,dash:0,shield:0,buff:0,slow:0,face:{x:0,y:-1},moving:false,attackAnim:0,dashAnim:0,hurtAnim:0,heavy:0,nova:0,focus:50,chain:0,chainTimer:0};
  this.fx.clear();this.weaponIndex=0;this.enemySerial=0;
  this.potions=this.save.clues.includes(index)?3:2;this.loot=0;this.combo=0;this.cooldowns=[0,0,0,0,0];this.slow=0;this.bullets=[];this.hazards=[];this.effects=[];this.drops=[];
  this.nodes=st.nodes.map((name,i)=>({name,x:st.nodes.length===5?230+i*200:280+i*360,y:i%2?340:250,done:false,turn:0}));
  this.enemies=Array.from({length:3+index},(_,i)=>this.makeEnemy(170+(i*223)%940,400+(i%2)*50,i%2));this.boss=null;this.bossTimer=2.5;
  $('screen').hidden=true;$('play').hidden=false;$('phase-label').textContent='밤 · 시간 균열 탐험';$('battle-zone').textContent=`${index===5?'FINAL':`CHAPTER 0${index+1}`} · ${st.sub}`;$('battle-title').textContent=st.name;
  $('skillbar').innerHTML=STAGES.slice(0,5).map((s,i)=>`<button data-skill="${i}" ${this.save.cleared.includes(i)?'':'disabled'}><kbd>${i+1}</kbd> ${s.skill}<span id="cd-${i}"></span></button>`).join('')+'<button id="potion"><kbd>R</kbd> 회복약<span id="potions"></span></button>';
  document.querySelectorAll('[data-skill]').forEach(b=>b.onclick=()=>this.cast(Number(b.dataset.skill)));$('potion').onclick=()=>this.heal();
  this.weaponHud();this.canvas.focus({preventScroll:true});window.scrollTo(0,0);this.toast(`${st.name} · ${st.objective}`);this.updateHud();
 }
 get combatDifficulty(){return difficulty(this.stageIndex,this.save.cleared.length,this.rpg?.data?.cycle||1);}
 makeEnemy(x,y,variant=0){const design=ENEMIES[this.stageIndex][variant],level=this.combatDifficulty,hp=78*level.hp*(design.role==='tank'?1.65:design.role==='ranged'?.9:1);return {x,y,hp,maxHp:hp,speed:(design.role==='tank'?48:82)*level.speed,freeze:0,variant,role:design.role,name:design.name,seed:this.enemySerial++,hitFlash:0,windup:0,charge:0,attackTimer:(.9+Math.random()*.6)*level.cooldown,facing:1};}

 listen(target,event,handler){target.addEventListener(event,handler);this.cleanups.push(()=>target.removeEventListener?.(event,handler));}
 dispose(){this.disposed=true;cancelAnimationFrame(this.frame);clearTimeout(this.toastTimer);this.rpg?.dispose();this.input.dispose?.();this.display.dispose?.();for(const off of this.cleanups.splice(0))off();this.audio?.close();}
 bindInput(){
  $('sound').textContent=this.sound?'소리 켜짐':'소리 꺼짐';$('sound').setAttribute('aria-pressed',String(this.sound));
  $('help').onclick=()=>this.help();$('pause').onclick=()=>this.pause();$('home').onclick=e=>{e.preventDefault();if(this.state==='battle')this.pause();else this.title();};
  $('sound').onclick=()=>{this.sound=!this.sound;$('sound').textContent=this.sound?'소리 켜짐':'소리 꺼짐';$('sound').setAttribute('aria-pressed',String(this.sound));this.saveSettings();this.tone(440);};
  this.listen(window,'keydown',e=>{if(this.display.blocked){e.preventDefault();return;}const k=e.key.toLowerCase();if(this.rpg?.transitioning)return;if(this.rpg?.active&&!e.repeat&&(k==='m'||k==='q')){e.preventDefault();if(k==='m')this.rpg.showMap();else this.rpg.journal();return;}if(k==='escape'){if($('modal').open){e.preventDefault();this.closeDialog();}else this.pause();return;}if(k==='h'&&!e.repeat){e.preventDefault();if(!$('modal').open)this.help();return;}if(this.state!=='battle'||$('modal').open||this.victoryDelay>0||this.rpg?.transitioning)return;if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();this.keys.add(k);if(e.repeat)return;if(k===' ')this.dash();if(k==='e')this.interact();if(k==='r')this.heal();if(k==='z')this.switchWeapon();if(k==='k')this.heavyAttack();if(k==='l')this.novaAttack();if(/^[1-5]$/.test(k))this.cast(Number(k)-1);});
  this.listen(window,'keyup',e=>this.keys.delete(e.key.toLowerCase()));
  this.listen(window,'blur',()=>{this.keys.clear();this.firing=false;if(this.state==='battle'&&!$('modal').open)this.pause();});
  this.listen(document,'visibilitychange',()=>{if(document.hidden&&this.state==='battle'&&!$('modal').open)this.pause();});
  this.listen($('modal'),'cancel',e=>{e.preventDefault();this.closeDialog();});
  this.listen(this.canvas,'pointermove',e=>{const r=this.canvas.getBoundingClientRect();this.mouse=canvasPoint(r,e.clientX,e.clientY,this.width,this.height,'fill');});
  this.listen(this.canvas,'pointerdown',e=>{if(this.state!=='battle'||$('modal').open||this.victoryDelay>0||this.rpg?.transitioning)return;const r=this.canvas.getBoundingClientRect();this.mouse=canvasPoint(r,e.clientX,e.clientY,this.width,this.height,'fill');this.fx.emit('click',this.mouse.x,this.mouse.y,{size:65,amount:3});if(e.pointerType==='touch')return;if(e.button===0){this.firing=true;this.canvas.setPointerCapture(e.pointerId);this.attack(true);}else if(e.button===2){e.preventDefault();this.heavyAttack(true);}});
  this.listen(this.canvas,'contextmenu',e=>e.preventDefault());
  document.querySelectorAll('[data-weapon]').forEach(b=>b.onclick=()=>this.switchWeapon(Number(b.dataset.weapon)));
  this.listen(document,'pointerdown',e=>{if(!e.target.closest?.('button')||e.target.closest('button').disabled)return;const sparkle=document.createElement('i');sparkle.className='ui-click';sparkle.style.left=e.clientX+'px';sparkle.style.top=e.clientY+'px';document.body.appendChild(sparkle);setTimeout(()=>sparkle.remove(),600);});
  this.listen(window,'pointerup',()=>{this.firing=false;});this.listen(window,'pointercancel',()=>{this.firing=false;this.keys.clear();});
  document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{if(this.state!=='battle'||$('modal').open||this.victoryDelay>0||this.rpg?.transitioning)return;({attack:()=>this.attack(),dash:()=>this.dash(),interact:()=>this.interact(),heavy:()=>this.heavyAttack(),nova:()=>this.novaAttack()})[b.dataset.action]();});
  document.querySelectorAll('[data-move]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);this.keys.add(b.dataset.move);};b.onpointerup=b.onpointercancel=()=>this.keys.delete(b.dataset.move);});
 }
 switchWeapon(index=(this.weaponIndex+1)%3){if(this.state!=='battle'||$('modal').open||this.victoryDelay>0||this.rpg?.transitioning||!Number.isInteger(index)||index<0||index>2)return;this.weaponIndex=index;this.player.chain=0;this.weaponHud();this.toast(`${WEAPONS[index].name} · ${WEAPONS[index].description}`);}
 weaponHud(){document.querySelectorAll('[data-weapon]').forEach(b=>{b.setAttribute('aria-pressed',String(Number(b.dataset.weapon)===this.weaponIndex));});$('weapon-description').textContent=WEAPONS[this.weaponIndex].description;}
 aim(mouse=false){const p=this.player,target=mouse&&this.mouse?this.mouse:[...this.enemies,...(this.boss?[this.boss]:[])].filter(e=>e.hp>0).sort((a,b)=>distance(a,p)-distance(b,p))[0]||{x:p.x+p.face.x*100,y:p.y+p.face.y*100};return Math.atan2(target.y-p.y,target.x-p.x);}
 attack(mouse=false){
  if(this.state!=='battle'||$('modal').open||this.victoryDelay>0||this.rpg?.transitioning||this.player.shot>0)return;
  const p=this.player,weapon=WEAPONS[this.weaponIndex],angle=this.aim(mouse);
  p.chain=p.chainTimer>0?p.chain+1:1;p.chainTimer=1.3;p.attackAnim=.38;p.face={x:Math.cos(angle),y:Math.sin(angle)};
  const shoot=(offset,scale=1)=>this.bullets.push({x:p.x,y:p.y-20,vx:Math.cos(angle+offset)*600,vy:Math.sin(angle+offset)*600,life:2,age:0,ally:true,damage:p.attack*scale,kind:weapon.id,color:weapon.color,pierce:weapon.id==='moon',hit:new Set(),returning:false});
  if(weapon.id==='petal'){for(let j=-2;j<=2;j++)shoot(j*.17,.52);}
  else if(weapon.id==='moon')shoot(0,1.5);
  else if(p.chain%3===0){shoot(-.09,.8);shoot(0,1.2);shoot(.09,.8);this.fx.number(p.x,p.y-105,'삼연광',weapon.color);}
  else shoot(0);
  this.fx.emit('muzzle',p.x+Math.cos(angle)*25,p.y-20+Math.sin(angle)*25,{color:weapon.color,size:40,amount:4,angle});
  p.shot=weapon.cooldown*(p.buff>0?.6:1);this.tone(weapon.id==='moon'?350:550,.04,.025);
 }
 heavyAttack(mouse=false){
  if(this.state!=='battle'||$('modal').open||this.victoryDelay>0||this.rpg?.transitioning||this.player.heavy>0)return;
  const p=this.player,angle=this.aim(mouse);p.heavy=4;p.attackAnim=.38;p.face={x:Math.cos(angle),y:Math.sin(angle)};
  for(const e of [...this.enemies,...(this.boss?[this.boss]:[])])if(e.hp>0&&inCone(p,e,angle,240,1.15))this.hitEnemy(e,p.attack*3,{knockback:30});
  this.bullets=this.bullets.filter(b=>b.ally||!inCone(p,b,angle,240,1.15));
  this.fx.emit('slash',p.x+Math.cos(angle)*100,p.y-20+Math.sin(angle)*100,{color:'#d9baff',size:250,amount:22,angle,life:.45});this.fx.shake=3;this.tone(270,.16);
 }
 novaAttack(){
  if(this.state!=='battle'||$('modal').open||this.victoryDelay>0||this.rpg?.transitioning||this.player.nova>0||this.player.focus<50)return;
  const p=this.player;p.focus-=50;p.nova=8;p.attackAnim=.38;
  for(const e of [...this.enemies,...(this.boss?[this.boss]:[])])if(e.hp>0&&distance(e,p)<310)this.hitEnemy(e,p.attack*3.5,{knockback:45});
  this.bullets=this.bullets.filter(b=>b.ally||distance(b,p)>310);
  this.fx.emit('nova',p.x,p.y,{color:'#ead0ff',size:310,amount:36,life:.7});this.fx.emit('hit',p.x,p.y-20,{size:230,color:'#eecbff',amount:20,life:.5});this.fx.shake=5;this.tone(200,.25);
 }
 hitEnemy(e,amount,{knockback=0}={}){if(e.hp<=0)return;const damage=Math.round(amount*(e.freeze>0?1.3:1));e.hp-=damage;if(!(e.hitFlash>0))this.fx.element(this.stageIndex,e.x,e.y-20,'impact',e.variant||0);e.hitFlash=.16;this.player.focus=Math.min(100,this.player.focus+4);if(knockback&&e!==this.boss){const d=distance(e,this.player)||1;e.x=clamp(e.x+(e.x-this.player.x)/d*knockback,60,1220);e.y=clamp(e.y+(e.y-this.player.y)/d*knockback,180,650);}this.fx.emit('hit',e.x,e.y-30,{color:WEAPONS[this.weaponIndex].color,size:65,amount:7,life:.3});this.fx.number(e.x,e.y-70,damage);}

 dash(){if(this.state!=='battle'||$('modal').open||this.victoryDelay>0||this.rpg?.transitioning)return;const p=this.player;if(p.dash>0)return;const moving=movementVector(this.keys,this.input.vector);if(moving.x||moving.y){const length=Math.hypot(moving.x,moving.y);p.face={x:moving.x/length,y:moving.y/length};}const old={x:p.x,y:p.y};if(!this.rpg?.move(p,p.face.x*125,p.face.y*125)){p.x=clamp(p.x+p.face.x*125,70,1210);p.y=clamp(p.y+p.face.y*125,190,655);}p.inv=.4;p.dash=1.8;p.dashAnim=.32;
  for(let i=0;i<4;i++)this.fx.ghost(p,old.x+(p.x-old.x)*i/4,old.y+(p.y-old.y)*i/4);
  this.fx.emit('dash',old.x,old.y-30,{size:130,color:'#a2edff',amount:16,angle:Math.atan2(p.face.y,p.face.x),life:.4});this.tone(650,.05);
 }

 heal(){if(this.state!=='battle'||$('modal').open||this.victoryDelay>0||this.rpg?.transitioning||!this.potions||this.player.hp>=this.player.maxHp)return;this.potions--;this.fx.emit('heal',this.player.x,this.player.y,{color:'#9beac8',size:90,amount:18,life:.65});this.fx.number(this.player.x,this.player.y-80,'+45','#a2f1c9');this.player.hp=Math.min(this.player.maxHp,this.player.hp+45);this.toast('기억의 물약 · 생명 +45');this.tone(720);this.updateHud();}
 cast(i){if(this.state!=='battle'||$('modal').open||this.victoryDelay>0||this.rpg?.transitioning||!this.save.cleared.includes(i)||this.cooldowns[i]>0)return;this.cooldowns[i]=[9,7,12,10,15][i];const p=this.player;
  p.attackAnim=.38;if(i===0){p.shield=3;this.fx.emit('shield',p.x,p.y-20,{color:'#ecd097',size:75,life:.6});}
  if(i===1){this.enemies.forEach(e=>{if(distance(e,p)<260)this.hitEnemy(e,85);});if(this.boss&&distance(this.boss,p)<290)this.hitEnemy(this.boss,70);this.nodes.forEach(n=>{if(distance(n,p)<160&&this.stageIndex===1&&!n.done){this.toast('거울은 빛의 순서로 열립니다. E로 정렬하세요.');}});}
  if(i===2){this.slow=5;p.inv=1.2;}
  if(i===3){this.enemies.forEach(e=>{e.freeze=4;this.hitEnemy(e,35);});if(this.boss)this.hitEnemy(this.boss,55);}
  if(i===4){p.buff=6;p.slow=0;p.hp=Math.min(p.maxHp,p.hp+25);}
  this.fx.emit(i===1?'nova':i===3?'hit':'shield',p.x,p.y-20,{size:i===1?260:140,life:.65,color:STAGES[i].color,amount:24});this.toast(STAGES[i].skill);this.tone(400+i*100);
 }
 interact(){
  if(this.state!=='battle'||$('modal').open||this.victoryDelay>0||this.rpg?.transitioning)return;if(this.rpg?.active&&this.rpg.interact())return;const n=this.nearNode();if(!n){this.toast('빛나는 유물 가까이에서 E를 눌러 주세요.');return;}const i=this.nodes.indexOf(n),s=this.stageIndex,count=this.nodes.filter(n=>n.done).length;
  if(s===0&&i===1&&Math.sin(this.time*2)<0){this.toast('성형틀의 빛이 초록색일 때 다시 시도하세요.');return;}
  if(s===1&&i!==count){this.toast('거울은 Ⅰ → Ⅱ → Ⅲ 순서로 이어집니다.');return;}
  if(s===2){n.turn=(n.turn+1)%4;if(n.turn!==i+1){this.toast(`${n.name} · 방향 ${n.turn} / 목표 ${i+1}`);return;}}
  if(s===3&&i!==[2,0,1][count]){this.nodes.forEach(n=>n.done=false);this.toast('공명이 흩어졌습니다. Ⅰ → Ⅱ → Ⅲ 순서로 연주하세요.');return;}
  if(s===4&&Math.sin(this.time*2)<0){this.toast('지금은 빨간 종 · 초록 종을 기다리세요.');return;}
  if(s===5&&!this.save.cleared.includes(i))return;
  n.done=true;this.rpg?.event('place',String(s));this.loot+=1;this.effects.push({x:n.x,y:n.y,r:110,life:.8,max:.8,color:'#b5efde'});this.tone(500+i*110);this.toast(`${n.name} · 기억을 되찾았습니다`);
  if(this.nodes.every(n=>n.done)){this.boss={x:980,y:270,hp:this.combatDifficulty.bossHp,maxHp:this.combatDifficulty.bossHp,freeze:0};this.bossTimer=2;this.toast(`${STAGES[s].boss} · ${STAGES[s].pattern}`);}this.updateHud();
 }
 nearNode(){return this.nodes.filter(n=>!n.done&&distance(n,this.player)<100).sort((a,b)=>distance(a,this.player)-distance(b,this.player))[0];}
 damage(amount){const p=this.player;if(this.state!=='battle'||p.inv>0)return;if(p.shield>0){this.fx.emit('shield',p.x,p.y-20,{size:70,color:'#f0ce8b',amount:4,life:.2});return;}p.hp=Math.max(0,p.hp-amount);p.inv=.75;p.hurtAnim=.38;this.combo=0;this.fx.emit('hit',p.x,p.y-35,{color:'#ff8a9c',size:100,amount:16});this.fx.number(p.x,p.y-90,`−${amount}`,'#ff9daa');this.fx.shake=5;this.tone(120,.12,.07);if(p.hp===0)this.defeat();}

 update(dt){
  const p=this.player;this.fx.update(dt);if(this.victoryDelay>0){this.victoryDelay=Math.max(0,this.victoryDelay-dt);if(this.victoryDelay===0)this.win();return;}
  for(const key of ['inv','shot','dash','shield','buff','slow','attackAnim','dashAnim','hurtAnim','heavy','nova','chainTimer'])p[key]=Math.max(0,p[key]-dt);
  p.focus=Math.min(100,p.focus+dt*2);this.slow=Math.max(0,this.slow-dt);this.cooldowns=this.cooldowns.map(v=>Math.max(0,v-dt));
  const move=movementVector(this.keys,this.input.vector),speed=(p.buff>0?330:235)*(p.slow>0?.55:1);if(!this.rpg?.move(p,move.x*speed*dt,move.y*speed*dt)){p.x=clamp(p.x+move.x*speed*dt,70,1210);p.y=clamp(p.y+move.y*speed*dt,190,655);}p.moving=!!(move.x||move.y);if(p.moving)p.face={...move};
  if(this.keys.has('j')||this.firing||this.input.attackHeld)this.attack(this.firing);
  const enemyDt=dt*(this.slow>0?.3:1);
  for(const e of this.enemies){
   if(e.hp<=0)continue;const oldPosition={x:e.x,y:e.y};e.hitFlash=Math.max(0,(e.hitFlash||0)-dt);e.freeze=Math.max(0,e.freeze-dt);if(e.freeze>0)continue;
   const target=this.rpg?.enemyTarget(e,p,enemyDt)||p,d=distance(e,p)||1,travelDistance=distance(e,target)||1,ux=(target.x-e.x)/travelDistance,uy=(target.y-e.y)/travelDistance;e.facing=ux;e.attackTimer=(e.attackTimer??2)-enemyDt;
   if(e.charge>0){e.x=clamp(e.x+e.chargeX*380*enemyDt,65,1215);e.y=clamp(e.y+e.chargeY*380*enemyDt,190,650);e.charge-=enemyDt;}
   else if(e.windup>0){e.windup-=enemyDt;if(e.windup<=0){e.charge=.45;e.chargeX=ux;e.chargeY=uy;this.fx.element(this.stageIndex,e.x,e.y-20,'charge',e.variant);}}
   else if(e.role==='ranged'){
    const direction=d<180?-1:d>320?1:0;e.x=clamp(e.x+ux*e.speed*direction*enemyDt,65,1215);e.y=clamp(e.y+uy*e.speed*direction*enemyDt,190,650);
    if(e.attackTimer<=0){const level=this.combatDifficulty,aim=Math.atan2(p.y-e.y,p.x-e.x);for(let shot=0;shot<level.volley;shot++){const angle=aim+(shot-(level.volley-1)/2)*.16,speed=220*level.speed;this.bullets.push({x:e.x,y:e.y-15,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:5,ally:false,stage:this.stageIndex,source:'ranged'});}e.attackTimer=2.2*level.cooldown;this.fx.element(this.stageIndex,e.x,e.y-25,'ranged',e.variant);}
   }else{e.x+=ux*e.speed*enemyDt;e.y+=uy*e.speed*enemyDt;if(e.role==='charger'&&d<250&&e.attackTimer<=0){e.windup=Math.max(.45,.65*this.combatDifficulty.cooldown);e.attackTimer=2.8*this.combatDifficulty.cooldown;}}
   this.rpg?.constrainActor(e,oldPosition);if(distance(e,p)<35)this.damage(Math.round((e.role==='tank'?18:13)*this.combatDifficulty.damage));
  }
  if(this.state!=='battle')return;
  if(this.boss&&this.boss.hp>0){this.boss.hitFlash=Math.max(0,(this.boss.hitFlash||0)-dt);this.bossTimer-=enemyDt;if(this.bossTimer<=0){this.bossAttack();this.bossTimer=(this.boss.hp<this.boss.maxHp*.4?1.35:2.1)*this.combatDifficulty.cooldown;}}
  if(this.stageIndex===0&&!this.nodes.every(n=>n.done)&&Math.floor(this.time)!==this.gasTick){this.gasTick=Math.floor(this.time);if(p.x<150||p.x>1130)this.damage(4);}
  if(this.state!=='battle')return;
  for(const b of this.bullets){
   const step=b.ally?dt:enemyDt,oldX=b.x,oldY=b.y;b.age=(b.age||0)+dt;b.hit??=new Set();
   if(b.kind==='moon'&&b.age>.48){if(!b.returning){b.returning=true;b.hit.clear();}const a=Math.atan2(p.y-20-b.y,p.x-b.x);b.vx=Math.cos(a)*650;b.vy=Math.sin(a)*650;if(Math.hypot(b.x-p.x,b.y-(p.y-20))<24)b.life=0;}
   b.x+=b.vx*step;b.y+=b.vy*step;b.life-=dt;if(this.rpg?.projectileBlocked(oldX,oldY,b.x,b.y))b.life=0;if(b.life<=0)continue;
   if(b.ally){for(const e of [...this.enemies,...(this.boss?[this.boss]:[])])if(e.hp>0&&!b.hit.has(e)&&segmentDistance(e.x,e.y,oldX,oldY,b.x,b.y)<(e===this.boss?53:30)){this.hitEnemy(e,b.damage);b.hit.add(e);if(!b.pierce){b.life=0;break;}}}
   else if(segmentDistance(p.x,p.y,oldX,oldY,b.x,b.y)<28){if(p.shield>0){b.ally=true;b.vx=-b.vx;b.vy=-b.vy;b.damage=p.attack*2;b.life=2;b.color='#f9d79d';this.fx.emit('shield',b.x,b.y,{color:'#f9d79d',size:60,amount:8});}else{this.damage(Math.round(14*this.combatDifficulty.damage));b.life=0;}}
  }
  this.bullets=this.bullets.filter(b=>b.life>0&&b.x>-60&&b.x<1340&&b.y>-60&&b.y<780);
  if(this.state!=='battle')return;
  this.hazards.forEach(h=>{h.delay-=enemyDt;if(h.delay<=0&&!h.hit){h.hit=true;const hit=h.shape==='cross'?Math.abs(p.x-h.x)<35||Math.abs(p.y-h.y)<35:h.shape==='ring'?Math.abs(distance(p,h)-h.r)<30:distance(p,h)<h.r;if(hit){this.damage(Math.round(21*this.combatDifficulty.damage));if(this.stageIndex===4&&p.buff<=0)p.slow=2;}this.fx.element(this.stageIndex,h.x,h.y,'boss');}});this.hazards=this.hazards.filter(h=>h.delay>-.3);
  this.enemies=this.enemies.filter(e=>{if(e.hp>0)return true;this.rpg?.killed(e);this.drops.push({x:e.x,y:e.y});this.combo++;this.fx.element(this.stageIndex,e.x,e.y-20,'death',e.variant);return false;});
  this.drops=this.drops.filter(d=>{if(distance(d,p)<70){this.loot++;this.rpg?.collected();this.tone(850,.035,.025);return false;}return true;});
  this.effects=this.effects.filter(e=>{e.life-=dt;return e.life>0;});
  if(this.state==='battle'&&this.boss&&this.boss.hp<=0){this.victoryDelay=.8;this.input.reset();this.keys.clear();this.firing=false;this.bullets=[];this.fx.element(this.stageIndex,this.boss.x,this.boss.y-30,'boss');this.fx.emit('nova',this.boss.x,this.boss.y-20,{size:190,color:STAGES[this.stageIndex].color,life:.8,amount:30});return;}if(this.state==='battle')this.updateHud();
 }

 bossAttack(){const b=this.boss,p=this.player,s=this.stageIndex;const shot=(angle,speed=180)=>this.bullets.push({x:b.x,y:b.y,vx:Math.cos(angle)*speed*this.combatDifficulty.speed,vy:Math.sin(angle)*speed*this.combatDifficulty.speed,life:6,ally:false,stage:s,source:'boss'});
  if(s===0||s===2||s===4||s===5){const count=s===2?3:s===5?4:2;for(let i=0;i<count;i++)this.hazards.push({x:clamp(p.x+(i?Math.sin(this.time+i)*180:0),100,1180),y:clamp(p.y+(i?Math.cos(this.time+i)*150:0),190,640),r:s===0?105:80,delay:1.1,hit:false,shape:'circle'});}
  if(s===1)this.hazards.push({x:p.x,y:p.y,r:200,delay:1.2,hit:false,shape:'cross'});
  if(s===2)this.hazards.push({x:b.x,y:b.y,r:250,delay:1.3,hit:false,shape:'ring'});
  this.fx.element(s,b.x,b.y-30,'boss');b.hitFlash=.12;
  const n=(s===3?16:s===5?18:10)+Math.min(4,this.save.cleared.length);
  if(s===4){const angle=Math.atan2(p.y-b.y,p.x-b.x);for(let j=-3;j<=3;j++)shot(angle+j*.18,230);}else for(let j=0;j<n;j++)shot(j/n*Math.PI*2+this.time*.3,s===3?170:145);
  if(s===3&&this.enemies.length<5)this.enemies.push({...this.makeEnemy(b.x-90,b.y+50),id:this.rpg?.area.current?`${this.rpg.area.current.id}:summon:${this.enemySerial}`:undefined});
 }
 win(){const unpicked=this.drops.length;this.rpg?.onVictory();const i=this.stageIndex,first=!this.save.cleared.includes(i);if(first)this.save.cleared.push(i);const reward=this.loot+unpicked+9;this.save.fragments[i]+=reward;this.persist();this.view('result',`<section class="story result"><small>MEMORY RESTORED</small><div class="result-symbol">✧</div><h1>${STAGES[i].name},<br>다시 숨을 쉬다.</h1><p>“우리를 기억해 주어서 고마워.”<br>유물에 깃든 원념이 잦아들고, 작은 빛이 시온에게 닿습니다.</p><div class="card"><h3>${first?'새로운 유물 능력':'기억의 재발견'} · ${STAGES[i].skill}</h3><p>${STAGES[i].fragment} 파편 +${reward}개<br>정화 시간 ${Math.floor(this.time/60)}분 ${Math.floor(this.time%60)}초 · 남은 생명 ${Math.ceil(this.player.hp)}<br>${i<5&&first?'다음 전시실의 포털이 열렸습니다.':'여월의 기억이 한층 선명해졌습니다.'}</p></div><div class="actions"><button class="primary" id="reward-next">${i===5?'시공의 복원 · 새벽을 맞이하기':'낮의 복원대로 돌아가기'}</button></div></section>`);$('reward-next').onclick=()=>i===5?this.ending():this.lobby();this.tone(880,.3);}
 defeat(){this.view('defeat',`<section class="story result"><small>THE NIGHT CONTINUES</small><div class="result-symbol">☾</div><h1>아직, 끝나지 않은 밤</h1><p>점동이가 시온을 안전한 복원대로 데려왔습니다.<br>이번 탐험의 파편은 남겨졌지만, 복원한 유물과 이전 진행은 그대로입니다.</p><div class="actions"><button id="retry">같은 구역 다시 도전</button><button class="primary" id="return">로비에서 준비하기</button></div></section>`);$('retry').onclick=()=>this.enterStage(this.stageIndex);$('return').onclick=()=>this.lobby();this.rpg?.onDefeat();}
 ending(){this.view('ending',`<section class="story result"><small>EPILOGUE · 06:00</small><div class="result-symbol">☀</div><h1>기억하는 사람이 있는 한.</h1><p>시온은 다섯 유물과 방명록의 기억을 빛으로 엮었다.<br>망각의 관리자는 조용히 눈을 감고, 뒤얽힌 시대는 제자리로 돌아갔다.</p><p>새벽 6시, 여월동 언덕 위로 동이 튼다.<br>점동이는 작은 옹기 인형이 되어 수장고 선반에 앉았다.</p><div class="card"><small>09:30 · 부천시립박물관 개관</small><p>아이들의 발소리와 함께 시온이 해설 마이크를 잡는다.</p><h3>“어서 오세요, 부천시립박물관입니다.<br>오늘 들려드릴 이야기는 조금 특별합니다.”</h3></div><div class="actions"><button class="primary" id="end-lobby">남은 유물 복원하기 →</button></div></section>`);$('end-lobby').onclick=()=>this.lobby();}
 updateHud(){const p=this.player,st=STAGES[this.stageIndex];$('hpText').textContent=`시온 · ${Math.ceil(p.hp)} / ${p.maxHp}`;$('hpBar').style.width=`${p.hp/p.maxHp*100}%`;
  $('objective').innerHTML=`<strong>${this.boss?'원념을 정화하세요 · '+st.boss:st.objective}</strong>${this.boss?st.pattern:`봉인 해제 ${this.nodes.filter(n=>n.done).length} / ${this.nodes.length}`} · 파편 ${this.loot}개${this.stageIndex===4?` · ${Math.sin(this.time*2)>=0?'초록 종 ●':'빨간 종 ●'}`:''}`;
  $('boss-hud').hidden=!this.boss;if(this.boss){$('boss-name').textContent=st.boss;$('bossBar').style.width=`${Math.max(0,this.boss.hp)/this.boss.maxHp*100}%`;}
  const n=this.nearNode();$('interact').hidden=!n;$('interact').textContent=n?`E · ${n.name}${this.stageIndex===2?` (방향 ${n.turn} → 목표 ${this.nodes.indexOf(n)+1})`:''}`:'';
  this.cooldowns.forEach((v,i)=>{$(`cd-${i}`).textContent=this.save.cleared.includes(i)?v>0?`${v.toFixed(1)}초`:'사용 가능':'구역 정화 후 해금';document.querySelector(`[data-skill="${i}"]`).disabled=!this.save.cleared.includes(i)||v>0;});$('potions').textContent=`${this.potions}개`;$('focusBar').style.width=`${p.focus}%`;$('focusText').textContent=`${Math.floor(p.focus)} / 100`;$('heavy-cd').textContent=p.heavy>0?p.heavy.toFixed(1)+'초':'초승달 참격';$('nova-cd').textContent=p.nova>0?p.nova.toFixed(1)+'초':p.focus<50?'공명 부족':'기억 폭발 · 50';$('heavy-action').disabled=p.heavy>0;$('nova-action').disabled=p.nova>0||p.focus<50;this.input.updateHud();this.rpg?.hud();}
 toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2600);}
 tone(hz,duration=.12,volume=.045){if(!this.sound)return;try{this.audio||=new (window.AudioContext||window.webkitAudioContext)();this.audio.resume();const o=this.audio.createOscillator(),g=this.audio.createGain();o.type='sine';o.frequency.value=hz;g.gain.setValueAtTime(volume,this.audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,this.audio.currentTime+duration);o.connect(g);g.connect(this.audio.destination);o.start();o.stop(this.audio.currentTime+duration);}catch{this.sound=false;$('sound').textContent='소리 사용 불가';}}
 render(){
  const c=this.ctx,s=STAGES[this.stageIndex],p=this.player;c.clearRect(0,0,1280,720);c.save();if(!this.fx.reduced&&this.fx.shake>0)c.translate(Math.sin(this.time*90)*this.fx.shake,Math.cos(this.time*83)*this.fx.shake);c.fillStyle='#151829';c.fillRect(0,0,1280,720);
  if(this.stageArt.complete&&this.stageArt.naturalWidth){const w=this.stageArt.naturalWidth/3,h=this.stageArt.naturalHeight/2;c.drawImage(this.stageArt,(this.stageIndex%3)*w,Math.floor(this.stageIndex/3)*h,w,h,0,0,1280,720);}else if(this.background.complete&&this.background.naturalWidth)c.drawImage(this.background,0,0,1280,720);
  c.fillStyle='#10112255';c.fillRect(0,0,1280,720);c.fillStyle=s.color+'18';c.fillRect(40,155,1200,525);
  const floor=c.createLinearGradient(0,140,0,700);floor.addColorStop(0,'#161b2d88');floor.addColorStop(1,s.color+'35');c.fillStyle=floor;c.fillRect(50,165,1180,510);
  c.strokeStyle=s.color+'55';c.lineWidth=2;c.strokeRect(55,160,1170,520);
  for(let x=80;x<1250;x+=100){c.strokeStyle='#b9bad114';c.beginPath();c.moveTo(x,175);c.lineTo(x-70,680);c.stroke();}for(let y=190;y<680;y+=80){c.beginPath();c.moveTo(55,y);c.lineTo(1225,y);c.stroke();}
  this.drawDecor(c,s);this.rpg?.draw(c);
  for(let i=0;i<30;i++){c.fillStyle=i%2?s.color+'99':'#dbd5ff66';const x=(i*137+Math.sin(this.time*.3+i)*25)%1200+40,y=160+(i*79-this.time*12%480+480)%480;c.beginPath();c.arc(x,y,1+i%3,0,Math.PI*2);c.fill();}
  if(this.stageIndex===0&&!this.nodes.every(n=>n.done)){c.fillStyle='#93b77f24';c.fillRect(55,180,95,490);c.fillRect(1130,180,95,490);}
  this.nodes.forEach((n,i)=>{if(this.rpg?.exhibits){this.rpg.exhibits.node(c,n,i,this.stageIndex,this.time);return;}c.save();c.translate(n.x,n.y);c.shadowColor=n.done?'#9cebd6':s.color;c.shadowBlur=22;c.fillStyle=n.done?'#345d5c':'#333049';c.strokeStyle=n.done?'#a4e5d0':s.color;c.lineWidth=2;c.beginPath();c.ellipse(0,20,44,17,0,0,Math.PI*2);c.fill();c.stroke();c.shadowBlur=0;c.font='38px Georgia';c.textAlign='center';c.fillStyle=n.done?'#b7ebd6':'#f5dcab';c.fillText(n.done?'✧':s.icon,0,7);c.font='13px sans-serif';c.fillStyle='#ede5db';c.fillText(n.name,0,56);if(this.stageIndex===2&&!n.done)c.fillText(`${n.turn} → ${i+1}`,0,76);if((this.stageIndex===4||this.stageIndex===0&&i===1)&&!n.done){c.fillStyle=Math.sin(this.time*2)>=0?'#91ecbd':'#e88893';c.beginPath();c.arc(0,-45,6,0,Math.PI*2);c.fill();}c.restore();});
  this.hazards.forEach(h=>{c.save();c.strokeStyle='#ff9b99';c.fillStyle=h.hit?'#ff789944':'#ee63772b';c.lineWidth=3;c.setLineDash([9,6]);if(h.shape==='cross'){c.fillRect(h.x-35,165,70,510);c.fillRect(55,h.y-35,1170,70);}else{c.beginPath();c.arc(h.x,h.y,h.r,0,Math.PI*2);if(h.shape!=='ring')c.fill();c.stroke();}c.restore();});
  this.drops.forEach(d=>{c.save();c.translate(d.x,d.y);c.rotate(this.time);c.shadowBlur=12;c.shadowColor='#cfc2ff';c.fillStyle='#d8c3ff';c.fillRect(-6,-6,12,12);c.restore();});

  const actors=[...this.enemies,...(this.boss?[this.boss]:[]),p].sort((a,b)=>a.y-b.y);
  for(const actor of actors){if(actor===p){c.save();c.fillStyle='#090a2055';c.beginPath();c.ellipse(p.x,p.y+14,30,10,0,0,Math.PI*2);c.fill();if(!this.sprites.drawPlayer(c,p,this.time)&&this.art.complete&&this.art.naturalWidth)c.drawImage(this.art,p.x-36,p.y-95,72,108);if(p.shield>0||p.buff>0){c.strokeStyle=p.shield>0?'#ecd197':'#9bedcd';c.lineWidth=3;c.beginPath();c.arc(p.x,p.y-25,58,0,Math.PI*2);c.stroke();}c.restore();}else this.drawEntity(c,actor,actor===this.boss);}
  this.bullets.forEach(b=>this.fx.projectile(c,b,this.time));
  this.drawClay(c,p.x-58,p.y+12,15,'#b78762',false);
  this.fx.draw(c,this.sprites,this.time);
  this.effects.forEach(e=>{c.save();c.globalAlpha=e.life/e.max;c.strokeStyle=e.color;c.lineWidth=5;c.beginPath();c.arc(e.x,e.y,e.r*(1-e.life/e.max)+8,0,Math.PI*2);c.stroke();c.restore();});
  if(this.slow>0){c.strokeStyle='#afd3ef77';c.lineWidth=12;c.strokeRect(5,5,1270,710);}
  c.fillStyle='#d6c9ea';c.font='12px sans-serif';c.textAlign='left';c.fillText(`정화 연속 ${this.combo} · 회피 ${p.dash>0?p.dash.toFixed(1)+'s':'준비'} · 회복약 ${this.potions}개`,75,706);c.restore();
 }
 drawClay(c,x,y,r,color,boss){c.save();c.translate(x,y);c.fillStyle='#080a214d';c.beginPath();c.ellipse(0,r*.8,r, r*.35,0,0,Math.PI*2);c.fill();const g=c.createRadialGradient(-r*.3,-r*.5,1,0,0,r*1.5);g.addColorStop(0,'#efd2a7');g.addColorStop(.35,color);g.addColorStop(1,'#35253a');c.fillStyle=g;c.beginPath();c.ellipse(0,-r*.25,r,r*1.15,0,0,Math.PI*2);c.fill();c.fillStyle='#282036';c.fillRect(-r*.8,-r*1.25,r*1.6,r*.2);c.fillStyle=boss?'#ffe8a0':'#b8f9eb';c.shadowBlur=10;c.shadowColor=c.fillStyle;for(const sign of [-1,1]){c.beginPath();c.ellipse(sign*r*.36,-r*.4,r*.14,r*.2,0,0,Math.PI*2);c.fill();}c.restore();}
 drawEntity(c,e,boss){
  if(e.hp<=0)return;const color=STAGES[this.stageIndex].color,r=boss?55:28;
  c.save();c.fillStyle='#11102766';c.beginPath();c.ellipse(e.x,e.y+15,boss?60:30,boss?18:9,0,0,Math.PI*2);c.fill();
  if(e.windup>0){c.strokeStyle='#ffb382';c.lineWidth=2;c.beginPath();c.moveTo(e.x,e.y);c.lineTo(this.player.x,this.player.y);c.stroke();c.fillStyle='#ffcb9b';c.font='bold 22px sans-serif';c.textAlign='center';c.fillText('!',e.x,e.y-80);}
  if(!this.sprites.drawEnemy(c,e,this.stageIndex,boss,this.time))this.drawClay(c,e.x,e.y,r,color,boss);
  c.fillStyle='#141424';c.fillRect(e.x-r,e.y+30,r*2,4);c.fillStyle=color;c.fillRect(e.x-r,e.y+30,r*2*Math.max(0,e.hp/e.maxHp),4);
  if(e.name){c.font='10px sans-serif';c.textAlign='center';c.fillStyle='#eee3d5';c.fillText(e.name,e.x,e.y+48);}c.restore();
 }

 drawDecor(c,st){const s=this.stageIndex;c.save();for(let i=0;i<8;i++){const x=95+i*156,y=145;c.fillStyle='#24253e';c.strokeStyle=st.color+'88';c.lineWidth=2;if(s===0){this.drawClay(c,x,y,25,'#88553f',false);}else if(s===1){c.fillStyle='#8da18f';c.beginPath();c.moveTo(x-30,y+10);c.lineTo(x-20,y-65);c.lineTo(x+25,y-75);c.lineTo(x+33,y+10);c.fill();}else if(s===2){c.fillStyle='#4d7587';c.beginPath();c.moveTo(x-40,y);c.lineTo(x-12,y-60);c.lineTo(x+12,y-40);c.lineTo(x+35,y+15);c.fill();}else if(s===3){c.fillStyle='#d9bdd4';c.fillRect(x-5,y-60,10,70);c.fillStyle='#f0d8a2';c.beginPath();c.arc(x,y-68,10,0,Math.PI*2);c.fill();}else if(s===4){c.fillStyle='#355152';c.fillRect(x-45,y-65,90,55);c.strokeRect(x-45,y-65,90,55);c.fillStyle='#d9ddbc';c.font='14px serif';c.textAlign='center';c.fillText(['배움','기억','이름','오늘'][i%4],x,y-32);}else{c.strokeStyle=st.color;c.beginPath();c.ellipse(x,y-25,28,45,Math.sin(this.time+i)*.3,0,Math.PI*2);c.stroke();}}c.restore();}
}






