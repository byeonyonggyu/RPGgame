import {STAGES} from './stages.js';
import {ARTIFACTS} from './artifacts.js';
export const CHARACTERS=[
 {id:'sion',name:'시온',role:'거울을 든 학예사',description:'균형 잡힌 생존력과 거울 연속탄. 잊힌 시간을 비추는 이야기의 중심.',hp:0,attack:0,speed:1,weapon:0,color:'#bba7ff',art:'sion-animation.png',lobbyArt:'sion-lobby-portrait.png'},
 {id:'hayeon',name:'하연',role:'자기의 기억을 잇는 복원사',description:'시온의 조사에 동행하는 복원사. 생명은 낮지만 발걸음과 정화력이 높고 자기꽃 산탄으로 시작합니다.',hp:-15,attack:4,speed:1.12,weapon:1,color:'#a4e8ff',art:'hayeon-animation.png',lobbyArt:'hayeon-lobby-portrait.png'}
];
const event=(id,type,target,count=1,phase)=>({id,event:type,target,count,...(phase?{phase}:{})});
export const QUESTS=[
 {id:'welcome',name:'점말 옹기의 첫 전시 목록',description:'안내 데스크에서 도윤 학예사 또는 점동이에게 옹기 전시 정리 의뢰를 받고, 유물을 대하는 마음을 선택하세요.',condition:{all:[event('talk','talk',['jeomdong','curator'],1,'day'),{any:[{flag:'approach',value:'comfort'},{flag:'approach',value:'study'}]}]},reward:{stage:0,amount:3}},
 ...STAGES.flatMap((st,i)=>[
 {id:`trail-${i}`,name:ARTIFACTS[i].trail,description:`${ARTIFACTS[i].short} 전시대 3곳을 관찰해 기록하고 전시 조명 제어대를 작동하세요.`,requires:i?[`boss-${i-1}`]:['welcome'],condition:{all:[event('observations','inspect',String(i),3),event('switch','switch',`${i}-gallery:switch`)]},reward:{stage:i,amount:3}},
 {id:`boss-${i}`,name:ARTIFACTS[i].boss,description:`${ARTIFACTS[i].short}의 전시 순서를 복원하고 ${st.boss}의 원념을 정화하세요.`,requires:[`trail-${i}`],condition:{all:[event('placed','place',String(i),i===5?5:3),event('boss','boss',String(i))]},reward:{stage:i,amount:5}},
 {id:`archive-${i}`,name:ARTIFACTS[i].archive,description:`유물 능력으로 기록실을 열어 ${ARTIFACTS[i].short}의 전시 기록을 회수한 뒤 안내 데스크에 보고하세요.`,requires:[`boss-${i}`],condition:{all:[event('memory','collect',`archive-${i}`),{...event('report','talk',['jeomdong','curator'],1,'day'),after:'memory'}]},reward:{stage:i,amount:6}}
 ]),
 {id:'museum',name:'모든 시대의 방명록',description:'여섯 기록실의 원본을 모으고 마지막 관리자를 위로하세요.',condition:{all:[...STAGES.map((_,i)=>event(`a${i}`,'collect',`archive-${i}`)),event('final','boss','5')]},reward:{stage:5,amount:12}}
];
export const DIALOGUES={
 jeomdong:{start:'hello',nodes:{hello:{speaker:'점동이',text:'옹기도 사람도, 제 이야기를 들어 주는 이를 기다리는 거여. 오늘은 어떤 마음으로 들어갈 텐가?',choices:[{text:'만든 이의 마음을 먼저 위로할게.',flag:'approach',value:'comfort',next:'comfort'},{text:'남은 기록을 살펴 진실을 찾을게.',flag:'approach',value:'study',next:'study'}]},comfort:{speaker:'점동이',text:'좋구먼. 불길을 견딜 옹기 호신벽을 얻으면 옹기관의 막힌 기록실로 돌아가 봐. 아직 들려줄 이야기가 있거든.',choices:[{text:'함께 기억해 줄게.',flag:'jeomdongTrust',value:true}]},study:{speaker:'점동이',text:'스위치로 열린 길은 다음에도 그대로여. 안내 데스크와 수장고 텐트에서 기록을 남기는 건 잊지 말고.',choices:[{text:'연구 일지에 남겨 둘게.',flag:'researchPromise',value:true}]}}},
 hwayu:{start:'mirror',nodes:{mirror:{speaker:'화유옹주의 잔향',text:'거울이 보여 주는 것은 얼굴만이 아니랍니다. 기억을 지키실 건가요, 세상에 전하실 건가요?',choices:[{text:'잊힌 이름을 지키겠습니다.',flag:'mirrorVow',value:'protect',next:'end'},{text:'박물관을 찾는 이들에게 전하겠습니다.',flag:'mirrorVow',value:'share',next:'end'}]},end:{speaker:'화유옹주의 잔향',text:'그 마음이라면 빛은 길을 잃지 않을 거예요. 석실의 거울을 순서대로 이어 주세요.',choices:[{text:'거울을 향해 나아간다.'}]}}}
};
