export function evaluateCondition(tree,counts,world){if(tree.all)return tree.all.every(t=>evaluateCondition(t,counts,world));if(tree.any)return tree.any.some(t=>evaluateCondition(t,counts,world));if(tree.flag)return world.choices[tree.flag]===tree.value;return (counts[tree.id]||0)>=(tree.count||1);}
function leaves(tree){return tree.all?tree.all.flatMap(leaves):tree.any?tree.any.flatMap(leaves):tree.event?[tree]:[];}
export class QuestManager {
 constructor(bus,definitions,data,onReward){this.bus=bus;this.definitions=definitions;this.data=data;this.onReward=onReward;this.off=bus.on('game:event',event=>this.track(event));}
 eligible(q){return !q.requires||q.requires.every(id=>this.data.quests[id]?.done);}
 track(event){for(const q of this.definitions){const state=this.data.quests[q.id]??={counts:{},done:false};if(state.done)continue;for(const leaf of leaves(q.condition)){if(event.type===leaf.event&&(!leaf.target||(Array.isArray(leaf.target)?leaf.target.includes(event.target):leaf.target===event.target))&&(!leaf.phase||event.phase===leaf.phase)&&(!leaf.after||(state.counts[leaf.after]||0)>0))state.counts[leaf.id]=Math.min(leaf.count||1,(state.counts[leaf.id]||0)+(event.amount||1));}}let changed;do{changed=false;for(const q of this.definitions){const state=this.data.quests[q.id];if(!state.done&&this.eligible(q)&&evaluateCondition(q.condition,state.counts,this.data.world)){state.done=true;changed=true;this.onReward(q.reward,q);this.bus.emit('quest:complete',q);}}}while(changed);}
 dispose(){this.off();}
}

