import {ARTIFACTS} from '../data/artifacts.js';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LESSONS=[
 ['그릇의 표면만 보지 말고, 무엇을 담고 누가 꺼내 썼을지 떠올려 보게. 같은 흙도 쓰임에 따라 형태가 달라지지.','옹기 제작은 흙을 준비하고 형태를 빚은 뒤 문양과 유약, 굽기로 이어지네. 뒤섞인 전시를 고치려면 이 순서를 기억하게.'],
 ['이 전시실에는 서로 다른 시대의 출토품이 함께 있네. 재료와 흔적을 살피고 선사시대의 생활과 조선 후기의 기억을 구분해 보게.','화유옹주 묘 출토품은 부천에 남은 사람의 기억으로 읽어야 하네. 거울의 빛을 이을 때도 먼저 전시 기록의 순서를 확인하게.'],
 ['수석은 돌 안에 작은 풍경을 발견하는 감상이네. 보는 방향이 달라지면 산등성이가 골짜기로 보이기도 하지.','물길의 힌트는 표면의 굴곡에 있네. 좌대를 돌려 윤곽을 비교하고, 흐름이 이어지는 방향을 찾아보게.'],
 ['잔 하나도 식탁의 일부이지. 인형의 자세, 접시의 문양, 잔의 형태를 함께 읽으면 사라진 만찬의 구성이 드러날 걸세.','전시의 공명은 무작정 힘을 주어 얻는 게 아니네. 서로 닮은 문양을 찾아 순서를 맞추고, 깨진 조각이 돌아갈 자리를 생각하게.'],
 ['성적표의 숫자보다 먼저 이름을 읽어 보게. 공부방과 문방구에는 배우던 사람의 하루가 남아 있지.','교실의 종은 행동할 때와 기다릴 때를 알려 주네. 분필 자국과 시간표의 순서를 살펴 잊힌 수업을 다시 이어 보게.'],
 ['지금까지의 조각은 따로 떨어진 보물이 아니었네. 생활, 자연, 장식, 배움이 함께 모여 이 박물관의 이야기가 되지.','마지막 관리자는 잊히는 것을 두려워하네. 기록실의 원본과 관람객의 기억을 이어, 누군가 아직 듣고 있다는 걸 보여주게.']
];
export class IllustratedDialogue {
 constructor(rpg){this.rpg=rpg;this.session=0;}
 open(pages,{title='유물의 목소리',artifact=null,onFinish=()=>{}}={}){const token=++this.session;let index=0,finished=false;const g=this.rpg.game,c=this.rpg.character;
  const finish=()=>{if(finished||token!==this.session)return;finished=true;g.closeDialog();onFinish();};
  const render=()=>{if(token!==this.session)return;const page=pages[index],hero=page.speaker==='hero';g.dialog(`<section class="illustrated-dialogue"><div class="dialogue-scene-bg"></div><div class="dialogue-caption"><small>MUSEUM FIELD CONVERSATION</small><h2>${esc(title)}</h2></div><img class="conversation-portrait protagonist ${hero?'speaking':'listening'}" src="./assets/${c.lobbyArt||c.id+'-lobby-portrait.png'}" alt="${c.name}"><img class="conversation-portrait curator ${hero?'listening':'speaking'}" src="./assets/curator-doyun-portrait.png" alt="도윤 · 선임 학예사">${artifact!==null?`<div class="conversation-artifact artifact-case-art" style="--case-x:${((artifact+6)%4)/3*100}%;--case-y:${Math.floor((artifact+6)/4)/2*100}%"></div>`:''}<div class="conversation-box"><div class="conversation-speaker">${hero?c.name:'도윤'}<small>${hero?'유물 조사 담당':'부천시립박물관 · 선임 학예사'}</small><span>${index+1} / ${pages.length}</span></div><p aria-live="polite">${esc(page.text)}</p><div class="conversation-actions">${page.choices?page.choices.map((choice,i)=>`<button data-story-choice="${i}">${esc(choice.label)}</button>`).join(''):`<button id="conversation-next" class="primary">${index===pages.length-1?'이야기를 기록하기':'다음 이야기'} <span>▶</span></button>`}<button data-close class="conversation-close">나중에 듣기</button></div></div></section>`);
   if(page.choices)document.querySelectorAll('[data-story-choice]').forEach(b=>b.onclick=()=>{if(token!==this.session)return;const choice=page.choices[Number(b.dataset.storyChoice)];choice.action?.();if(choice.reply){pages.splice(index+1,0,{speaker:'curator',text:choice.reply});}index++;index>=pages.length?finish():render();});else $('conversation-next').onclick=()=>{if(token!==this.session)return;index++;index>=pages.length?finish():render();};
  };render();
 }
 inspect(point){const r=this.rpg,s=r.game.stageIndex,a=ARTIFACTS[s],entry=a.observations[point.index],done=r.data.world.collected.includes(point.id);this.open([
  {speaker:'hero',text:`선생님, ‘${entry[0]}’을 찾았어요. 이 유물에서 무엇부터 살펴보면 좋을까요?`},
  {speaker:'curator',text:`좋은 질문이네. ${entry[1]} ${a.fact}`},
  {speaker:'hero',text:'눈에 보이는 모습과, 그 안에 남은 이야기를 함께 기록해야겠네요.',choices:[{label:'쓰임과 만든 과정을 더 알고 싶어요.',reply:LESSONS[s][0]},{label:'지금 전시를 복원할 단서는 무엇인가요?',reply:LESSONS[s][1]}]},
  {speaker:'curator',text:done?'이미 남긴 관찰도 다시 읽으면 새로운 단서가 보이는 법이지. 다음 전시대로 가 보게.':`이제 자네의 관찰을 조사 일지에 남기게. 이 회랑의 전시대 세 곳을 살피고 조명을 되돌리면, ${a.short}의 기억을 정화할 길이 열릴 걸세.`}
 ],{title:entry[0],artifact:s,onFinish:()=>{r.recordObservation(point);r.game.updateHud();r.game.toast(done?'유물의 이야기를 다시 살펴봤습니다.':'학예사와 함께 관찰 일지를 기록했습니다.');}});}
 quest(q){this.open([{speaker:'hero',text:`‘${q.name}’ 의뢰를 받았는데, 왜 이 작업이 필요한가요?`},{speaker:'curator',text:`${q.description} ${LESSONS[q.reward.stage][0]}`},{speaker:'hero',text:'그렇다면 유물의 원래 자리와, 그 유물을 기억하는 사람을 함께 찾아야겠네요.'},{speaker:'curator',text:`그렇지. ${LESSONS[q.reward.stage][1]} 돌아오면 안내 데스크에서 조사한 이야기를 들려주게.`}],{title:q.name,artifact:q.reward.stage});}
 desk(){const r=this.rpg;if(!r.active){r.hub.registrationNotice();return;}const reports=Object.keys(r.data.inventory).filter(k=>/^archive-/.test(k)&&!r.data.quests[k]?.done),fresh=!r.data.quests.welcome?.done;this.open([
 {speaker:'curator',text:fresh?'어서 오게. 나는 이곳의 선임 학예사 도윤이네. 유물을 원래 모습으로 돌리는 일은 그 물건이 살아온 이야기를 듣는 데서 시작하지.':reports.length?`돌아왔군. 기록실에서 가져온 원본 ${reports.length}건을 함께 살펴보세. 어떤 사람의 기억이 남아 있었나?`:'조사는 잘 되어 가나? 힘으로 원념을 누르기 전에, 무엇을 잃어버린 유물인지 살펴보게.'},
 {speaker:'hero',text:fresh?'제 첫 조사는 무엇인가요?':'기록한 흔적과 전시대의 설명을 대조해 보려고 해요.'},
 {speaker:'curator',text:fresh?'점말 옹기 전시대 세 곳을 살펴보게. 형태와 쓰임, 만드는 과정을 기록하고 전시 조명을 복구해 주게. 점동이도 길을 도와줄 걸세.':'좋은 태도네. 전시실이 정화될수록 균열의 수호자들도 더 거칠게 반응하고 있네. 회피할 여유를 남기고, 원거리 공격부터 살피게.'},
 {speaker:'hero',text:'유물을 어떤 마음으로 대할지 기록해 둘게요.',choices:[{label:'만든 이의 마음을 위로하겠습니다.',action:()=>r.data.world.choices.approach='comfort',reply:'그 마음을 잊지 말게. 거친 불길 뒤에도 누군가의 소중한 그릇이 있었으니.'},{label:'남겨진 기록을 꼼꼼히 연구하겠습니다.',action:()=>r.data.world.choices.approach='study',reply:'관찰과 기록은 훌륭한 시작이지. 발견한 사실과 자네의 상상을 구분해 적도록 하게.'}]},
 {speaker:'curator',text:reports.length?'자네가 찾아온 전시 기록을 확인했네. 이 이야기는 이제 박물관의 의뢰 일지에 남을 걸세.':'의뢰 일지를 펼치면 필요한 관찰과 복원 순서를 확인할 수 있네. 궁금한 의뢰는 내게 다시 물어보게.'}
 ],{title:'안내 데스크 · 도윤의 조사 수업',onFinish:()=>{r.event('talk','curator');r.event('choice','approach');r.desk();}});}
 dispose(){this.session++;}
}
