import test from 'node:test';
import assert from 'node:assert/strict';
import {SHARE_URL,setupShare} from '../src/exhibition/share.js';
test('Pages sharing uses a fixed public URL and survives clipboard denial',async t=>{
 const nodes=new Map();let denied=false,copied='';
 const node=id=>{if(!nodes.has(id))nodes.set(id,Object.assign(new EventTarget(),{textContent:'',value:'',hidden:false,open:false,focus(){this.focused=true;},select(){this.selected=true;},querySelector(){return node('summary');},showModal(){this.open=true;},close(){this.open=false;this.dispatchEvent(new Event('close'));}}));return nodes.get(id);};
 const globals={document:{getElementById:node},navigator:{clipboard:{async writeText(value){if(denied)throw Error('denied');copied=value;}}}};
 for(const [key,value] of Object.entries(globals)){const old=Object.getOwnPropertyDescriptor(globalThis,key);Object.defineProperty(globalThis,key,{value,configurable:true});t.after(()=>{if(old)Object.defineProperty(globalThis,key,old);else delete globalThis[key];});}
 setupShare();node('copyShare').dispatchEvent(new Event('click'));await Promise.resolve();
 assert.equal(copied,SHARE_URL);assert.equal(new URL(copied).search,'');assert.equal(node('shareDialog').open,true);assert.match(node('shareMessage').textContent,/已复制/);
 denied=true;node('retryShare').dispatchEvent(new Event('click'));await Promise.resolve();
 assert.equal(node('shareLink').value,SHARE_URL);assert.equal(node('shareLink').selected,true);assert.match(node('shareMessage').textContent,/选中/);
 node('closeShare').dispatchEvent(new Event('click'));assert.equal(node('summary').focused,true);
});
