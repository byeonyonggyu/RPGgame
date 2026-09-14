import {freshSave,validateSave} from '../data/stages.js';
export const SAVE_VERSION=1;
export function freshCampaign(character='sion',legacy=freshSave()){
 return {version:SAVE_VERSION,character,cycle:1,playSeconds:0,phase:'day',location:{room:'desk',spawn:'default'},player:null,inventory:{},equipment:{weapon:0,charm:null},world:{doors:[],switches:[],killed:[],visited:[],collected:[],choices:{}},rooms:{},quests:{},legacy:validateSave(legacy)};
}
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
export function validateCampaign(input){
 if(!object(input)||input.version!==SAVE_VERSION)throw new Error('지원하지 않는 저장 버전입니다.');
 const d=structuredClone(input);
 if(!['sion','hayeon'].includes(d.character)||!Number.isInteger(d.cycle)||d.cycle<1||d.cycle>999||!Number.isFinite(d.playSeconds)||d.playSeconds<0)throw new Error('캐릭터 또는 플레이 기록이 손상되었습니다.');
 if(!['day','night'].includes(d.phase)||!object(d.location)||!(/^(desk|[0-5]-(entry|gallery|archive|sanctum))$/).test(d.location.room))throw new Error('잘못된 방 위치입니다.');
 if(!object(d.world)||!object(d.rooms)||!object(d.quests)||!object(d.inventory)||!object(d.equipment))throw new Error('저장 필드가 누락되었습니다.');
 for(const key of ['doors','switches','killed','visited','collected'])if(!Array.isArray(d.world[key])||d.world[key].some(x=>typeof x!=='string'||x.length>120))throw new Error('잘못된 월드 플래그입니다.');
 if(!object(d.world.choices)||Object.values(d.world.choices).some(x=>typeof x!=='string'&&typeof x!=='boolean'))throw new Error('잘못된 대화 기록입니다.');
 if(![0,1,2].includes(d.equipment.weapon)||!(d.equipment.charm===null||Number.isInteger(d.equipment.charm)&&d.equipment.charm>=0&&d.equipment.charm<6))throw new Error('잘못된 장착 유물입니다.');
 for(const n of Object.values(d.inventory))if(!Number.isInteger(n)||n<0||n>999999)throw new Error('잘못된 인벤토리입니다.');
 if(d.player!==null){if(!object(d.player))throw new Error('잘못된 플레이어입니다.');for(const k of ['x','y','hp','maxHp','attack','focus','potions'])if(!Number.isFinite(d.player[k])||d.player[k]<0)throw new Error('잘못된 플레이어 스탯입니다.');if(d.player.x>1280||d.player.y>720||d.player.hp>d.player.maxHp)throw new Error('플레이어 범위 오류입니다.');}
 // Room snapshots contain data only: no projectiles, DOM handles, Sets or actor references.
 for(const [id,r] of Object.entries(d.rooms)){
  if(!/^[0-5]-(entry|gallery|archive|sanctum)$/.test(id)||!object(r)||!Array.isArray(r.nodes)||!Array.isArray(r.enemies)||!Array.isArray(r.drops))throw new Error('잘못된 방 상태입니다.');
  for(const actor of [...r.enemies,...(r.boss?[r.boss]:[])])if(!object(actor)||!['x','y','hp','maxHp'].every(k=>Number.isFinite(actor[k]))||actor.hp<0||actor.maxHp<=0||actor.hp>actor.maxHp||actor.x<0||actor.x>1280||actor.y<0||actor.y>720)throw new Error('잘못된 몬스터 상태입니다.');
  if(r.nodes.some(n=>!object(n)||typeof n.done!=='boolean'||!Number.isInteger(n.turn)||n.turn<0||n.turn>3)||r.drops.some(n=>!object(n)||!Number.isFinite(n.x)||!Number.isFinite(n.y)))throw new Error('잘못된 유물 상태입니다.');
 }
 if(Object.values(d.quests).some(q=>!object(q)||!object(q.counts)||typeof q.done!=='boolean'||Object.values(q.counts).some(n=>!Number.isInteger(n)||n<0)))throw new Error('잘못된 퀘스트 기록입니다.');
 d.legacy=validateSave(d.legacy);return d;
}
export async function digest(text){if(!globalThis.crypto?.subtle)throw new Error('보안 연결(HTTPS 또는 localhost)에서 저장을 사용해 주세요.');const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}
export class SaveManager {
 constructor({indexedDB=globalThis.indexedDB,name='yeowol-rpg',hash=digest}={}){this.factory=indexedDB;this.name=name;this.hash=hash;this.db=null;this.opening=null;this.queue=Promise.resolve();}
 open(){if(this.db)return Promise.resolve(this.db);if(this.opening)return this.opening;this.opening=new Promise((resolve,reject)=>{if(!this.factory){reject(new Error('이 환경에서는 IndexedDB 저장을 사용할 수 없습니다.'));return;}const request=this.factory.open(this.name,1);request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains('slots'))db.createObjectStore('slots',{keyPath:'slot'});};request.onerror=()=>reject(request.error);request.onblocked=()=>reject(new Error('다른 게임 탭을 닫고 다시 시도해 주세요.'));request.onsuccess=()=>{this.db=request.result;this.db.onversionchange=()=>this.close();resolve(this.db);};}).finally(()=>this.opening=null);return this.opening;}
 slot(id){if(!Number.isInteger(id)||id<1||id>3)throw new Error('슬롯은 1~3만 사용할 수 있습니다.');}
 async transaction(mode,action){const db=await this.open();return new Promise((resolve,reject)=>{const tx=db.transaction('slots',mode);let result;const req=action(tx.objectStore('slots'));req.onsuccess=()=>result=req.result;tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error||req.error);tx.onabort=()=>reject(tx.error||new Error('저장이 중단되었습니다.'));});}
 save(slot,data,reason='manual'){this.slot(slot);const snapshot=validateCampaign(data);const task=this.queue.catch(()=>{}).then(async()=>{const json=JSON.stringify(snapshot);if(json.length>16*1024*1024)throw new Error('저장 데이터가 허용 용량을 초과했습니다.');const record={slot,json,hash:await this.hash(json),updatedAt:Date.now(),reason,character:snapshot.character,cycle:snapshot.cycle,playSeconds:snapshot.playSeconds,room:snapshot.location.room};await this.transaction('readwrite',store=>reason==='new'||reason==='import'?store.add(record):store.put(record));return record;});this.queue=task;return task;}
 async list(){await this.queue.catch(()=>{});return this.transaction('readonly',store=>store.getAll());}
 async load(slot){this.slot(slot);await this.queue.catch(()=>{});const record=await this.transaction('readonly',store=>store.get(slot));if(!record)return null;if(await this.hash(record.json)!==record.hash)throw new Error('저장 무결성 검증에 실패했습니다. 원본 슬롯은 보존됩니다.');return validateCampaign(JSON.parse(record.json));}
 async remove(slot){this.slot(slot);await this.queue.catch(()=>{});return this.transaction('readwrite',store=>store.delete(slot));}
 close(){this.db?.close();this.db=null;}
}

