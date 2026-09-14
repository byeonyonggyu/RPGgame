import { Game } from './engine/Game.js';
new Game(document.querySelector('#gameCanvas')).start();
if('serviceWorker' in navigator&&window.isSecureContext){navigator.serviceWorker.register('./sw.js').catch(()=>{/* Online gameplay remains available when offline storage is unavailable. */});}
