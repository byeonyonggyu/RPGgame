import {Scope} from '../core/EventBus.js';
export function gateOpen(gate,data){if(!gate)return true;if(gate.ability!==undefined)return data.legacy.cleared.includes(gate.ability);if(gate.switch)return data.world.switches.includes(gate.switch);return false;}
export class AreaManager {
 constructor(map,bus,{capture,install,cleanup,fade}){this.map=map;this.bus=bus;this.capture=capture;this.install=install;this.cleanup=cleanup;this.fade=fade;this.current=null;this.scope=null;this.pending=null;this.serial=0;}
 async enter(id,spawn='default'){if(this.pending)throw new Error('이미 구역을 이동 중입니다.');const controller=new AbortController();const serial=++this.serial;this.pending=controller;try{this.bus.emit('area:loading',id);const room=await this.map.load(id,controller.signal);if(serial!==this.serial)return;const point=room.spawns[spawn];if(!point)throw new Error('스폰 지점이 없습니다: '+spawn);await this.fade(true);if(serial!==this.serial)return;this.capture();this.scope?.dispose();this.cleanup();this.current=room;this.scope=new Scope();this.install(room,point,this.scope);this.bus.emit('area:entered',room);await this.fade(false);return room;}finally{if(serial===this.serial){this.pending=null;await this.fade(false);}}}
 dispose(){this.serial++;this.pending?.abort();this.pending=null;this.scope?.dispose();this.scope=null;this.current=null;this.cleanup();this.map.clear();}
}
