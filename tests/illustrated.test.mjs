import test from 'node:test';
import assert from 'node:assert/strict';
import {IllustratedDialogue} from '../js/rpg/IllustratedDialogue.js';
import {difficulty} from '../js/data/difficulty.js';

test('combat grows across stages, cleared regions and subsequent cycles',()=>{
 const first=difficulty(),later=difficulty(1,1),revisit=difficulty(0,3),again=difficulty(0,0,2);
 for(const p of [later,revisit,again]){assert.ok(p.hp>first.hp);assert.ok(p.damage>first.damage);assert.ok(p.cooldown<first.cooldown);assert.ok(p.bossHp>first.bossHp);}
 assert.equal(first.bossHp,510);assert.equal(first.volley,1);assert.equal(difficulty(3,3).volley,3);assert.ok(difficulty(5,6,99).cooldown>=.58);
});
test('illustrated inspection records only after branch and final page; disposal invalidates callbacks',()=>{
 const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,{});return elements.get(id);};
 let choices=[],records=0,closed=0;
 globalThis.document={getElementById:get,querySelectorAll:()=>choices};
 const r={character:{id:'sion',name:'시온'},data:{world:{collected:[]}},game:{stageIndex:0,dialog(html){choices=html.includes('data-story-choice')?[{dataset:{storyChoice:'0'}},{dataset:{storyChoice:'1'}}]:[];},closeDialog(){closed++;},updateHud(){},toast(){}},recordObservation(){records++;}};
 const d=new IllustratedDialogue(r);
 d.inspect({index:0,id:'test'});assert.equal(records,0);
 get('conversation-next').onclick();get('conversation-next').onclick();assert.equal(records,0);
 choices[1].onclick();assert.equal(records,0);
 get('conversation-next').onclick();assert.equal(records,0);
 const finish=get('conversation-next').onclick;finish();finish();assert.equal(records,1);assert.equal(closed,1);
 d.inspect({index:0,id:'test'});const stale=get('conversation-next').onclick;d.dispose();stale();assert.equal(records,1);
});
