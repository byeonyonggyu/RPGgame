export const STAGES = [
 {name:'옹기관',sub:'점말 가마터',color:'#c67443',icon:'♨',boss:'점말의 가마귀',skill:'옹기 호신벽',key:'1',hint:'숨쉬는 옹기를 열면 독기가 걷혀. 쳇바퀴의 빛이 위에 왔을 때 손을 대봐!',objective:'숨쉬는 옹기 3개를 열어 독기를 정화하세요',nodes:['숨쉬는 옹기','회전 성형틀','가마의 숨길'],lore:'세상의 눈을 피해 흙을 빚던 이들의 숨결. 불길 너머에서, 만든 이의 마음을 기억해 주세요.',pattern:'가마 폭발 · 붉은 원 밖으로 회피',fragment:'점말 옹기토',archive:'저장과 발효를 위한 숨쉬는 그릇. 이 게임은 옹기의 통기성과 점말 가마터의 기억을 정화 기믹으로 재해석했습니다.'},
 {name:'부천향토역사관',sub:'고강동 움집 · 화유옹주 석실',color:'#74b9a4',icon:'◇',boss:'흑요의 제사장',skill:'선사의 쐐기',key:'2',hint:'거울의 빛을 Ⅰ → Ⅱ → Ⅲ 순서로 이어 주세요. 저는 이곳에 남은 화유의 잔향이랍니다.',objective:'번호 순서대로 거울을 맞춰 석실 봉인을 푸세요',nodes:['Ⅰ · 묘실 거울','Ⅱ · 빛의 반사면','Ⅲ · 석실 봉인'],lore:'거울과 수석이 공명하던 밤. 화유옹주의 잔향이 어두운 묘실에 작은 빛을 건넵니다.',pattern:'십자 번개 · 석기 방사 탄막',fragment:'선사 간돌칼',archive:'돌을 갈아 만든 간돌검과 부장품 거울을 모티브로, 선사시대의 기도와 옹주의 기억을 하나의 빛길로 구성했습니다.'},
 {name:'수석전시실',sub:'억겁의 풍화 · 산수의 미로',color:'#6aabc3',icon:'△',boss:'천년의 수석령',skill:'침묵의 무게',key:'3',hint:'물길 표식을 Ⅰ, Ⅱ, Ⅲ으로 맞춰. E를 누를 때마다 방향이 하나씩 돌아간다!',objective:'세 수석의 물길을 표시된 방향으로 회전하세요',nodes:['폭포석','산수경석','중앙 수로'],lore:'작은 돌 안에 산과 강이 깃들고, 억겁의 시간이 무게를 얻습니다. 흐르지 못한 물길을 다시 이어 주세요.',pattern:'낙석 예고 · 지진의 고리',fragment:'산수경석',archive:'수석은 자연석의 형태와 질감에서 산수의 아름다움을 발견하는 감상 대상입니다. 물길 퍼즐은 이를 바탕으로 한 창작입니다.'},
 {name:'유럽자기전시실',sub:'금빛 만찬 · 유약의 꿈',color:'#b993cf',icon:'♜',boss:'도자기 여왕',skill:'유약의 잔향',key:'4',hint:'찻잔은 낮은 음부터 울려야 해. Ⅰ → Ⅱ → Ⅲ, 이 순서를 기억해 둬!',objective:'찻잔을 낮은 음부터 울려 공명을 완성하세요',nodes:['Ⅱ · 찻잔','Ⅲ · 디너 세트','Ⅰ · 작은 종'],lore:'화려한 식탁 위의 자기 인형들이 실을 끊고 춤춥니다. 깨뜨리기보다 그 안에 울리는 노래에 귀를 기울여 주세요.',pattern:'회전 파편 폭풍 · 인형 소환',fragment:'마이센 자기',archive:'유럽 자기의 장식성과 식탁 문화를 환상적인 만찬장으로 해석했습니다. 도자기 여왕과 공명 퍼즐은 창작 설정입니다.'},
 {name:'교육전시실',sub:'서당에서 7080 교실까지',color:'#b5a65d',icon:'▤',boss:'엄격한 규율의 교장',skill:'졸업의 증표',key:'5',hint:'초록 종이 울릴 때 출석을 불러! 빨간 종에는 잠깐 기다리는 게 좋겠어.',objective:'초록 종소리에 맞춰 출석부 3개를 확인하세요',nodes:['첫 번째 출석부','칠판의 기억','마지막 종소리'],lore:'누군가에게는 두려웠고, 누군가에게는 그리웠던 교실. 완벽한 답보다 소중한 이름들을 불러 주세요.',pattern:'분필 부채 탄막 · 출석부 내려치기',fragment:'교실의 기억',archive:'서당과 근현대 교실을 잇는 기억을 모티브로 삼았습니다. 출석부와 종소리는 배움의 시간을 상징하는 게임 장치입니다.'},
 {name:'지하 통합 수장고',sub:'모든 시대가 모이는 심연',color:'#8974cc',icon:'✧',boss:'망각의 수장고 관리자',skill:'시공의 복원',key:'6',hint:'다섯 전시실의 유물을 모두 제자리에! 사람들의 기억이 마지막 빛이 되어 줄 거야.',objective:'다섯 핵심 유물을 제단에 돌려놓으세요',nodes:['옹기의 숨','선사의 기도','산수의 시간','유약의 노래','배움의 기억'],lore:'“역사는 잊혀지는 순간 끝난다.” 시온은 방명록 속 사람들의 감탄과 기억을 빛으로 엮어, 망각의 절망에 답합니다.',pattern:'시대의 탄막 · 망각의 낙석 · 최종 복원',fragment:'시간의 빛',archive:'유물은 누군가의 삶에서 왔으며, 오늘의 관람객을 만나 새로운 기억이 됩니다. 시공의 복원은 게임의 최종 창작 능력입니다.'}
];
export const SAVE_KEY='yeowol-museum-v2';
export const freshSave=()=>({version:2,cleared:[],fragments:[0,0,0,0,0,0],restored:[0,0,0,0,0,0],clues:[],started:false});
export function validateSave(value){
 if(!value||value.version!==2) return freshSave();
 const ints=a=>Array.from({length:6},(_,i)=>Math.max(0,Math.min(9999,Number.isInteger(a?.[i])?a[i]:0)));
 const ids=a=>[...new Set(Array.isArray(a)?a.filter(x=>Number.isInteger(x)&&x>=0&&x<6):[])];
 const cleared=ids(value.cleared).sort((a,b)=>a-b).filter((x,i)=>x===i);
 return {version:2,cleared,fragments:ints(value.fragments),restored:ints(value.restored).map(x=>Math.min(100,Math.floor(x/25)*25)),clues:ids(value.clues),started:!!value.started};
}
export function canEnter(save,index){return Number.isInteger(index)&&index>=0&&index<6&&(index===0||save.cleared.includes(index-1));}
export function stats(save){const count=save.restored.filter(x=>x===100).length;return {hp:100+count*15,attack:20+count*4};}
export function restoreRelic(save,index){if(index<0||index>5||save.fragments[index]<3||save.restored[index]>=100)return false;save.fragments[index]-=3;save.restored[index]+=25;return true;}
