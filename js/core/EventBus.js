export class EventBus {
 constructor(){this.listeners=new Map();}
 on(type,fn){const set=this.listeners.get(type)||new Set();set.add(fn);this.listeners.set(type,set);return ()=>{set.delete(fn);if(!set.size)this.listeners.delete(type);};}
 emit(type,payload){for(const fn of [...(this.listeners.get(type)||[])])fn(payload);}
 get size(){return [...this.listeners.values()].reduce((n,set)=>n+set.size,0);}
 clear(){this.listeners.clear();}
}
// A room owns its subscriptions; disposal is idempotent, including on failed transitions.
export class Scope {
 constructor(){this.cleanups=[];this.disposed=false;}
 own(cleanup){if(this.disposed)cleanup();else this.cleanups.push(cleanup);return cleanup;}
 dispose(){if(this.disposed)return;this.disposed=true;for(const cleanup of this.cleanups.splice(0).reverse())cleanup();}
}
