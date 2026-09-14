export class DialogueSystem {
 constructor(bus,data,definitions){this.bus=bus;this.data=data;this.definitions=definitions;this.current=null;}
 start(id){const dialogue=this.definitions[id];if(!dialogue)throw new Error('대화를 찾을 수 없습니다.');this.current={id,node:dialogue.start};this.bus.emit('game:event',{type:'talk',target:id,phase:this.data.phase});return this.node();}
 node(){return this.current?this.definitions[this.current.id].nodes[this.current.node]:null;}
 choose(index){const choice=this.node()?.choices[index];if(!choice)throw new Error('유효하지 않은 선택지입니다.');if(choice.flag)this.data.world.choices[choice.flag]=choice.value;this.bus.emit('game:event',{type:'choice',target:choice.flag,phase:this.data.phase});if(choice.next)this.current.node=choice.next;else this.current=null;return this.node();}
 dispose(){this.current=null;}
}
