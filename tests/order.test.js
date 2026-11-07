import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {pagodaLayers, gateView, rayWallDistance, orderTopics} from '../src/exhibition/order-data.js';
import {makeOrderOverlay} from '../src/exhibition/order-scene.js';

test('gate walls occlude rays while the central passage remains open',()=>{
 assert.equal(rayWallDistance([0,0],[0,-1],24),24);
 assert.equal(rayWallDistance([0,0],[1,0],24),2.6);
 assert.equal(rayWallDistance([0,-20],[0,-1],24),24);
 const middle=gateView(.5),inside=gateView(1);
 assert.ok(middle.area<inside.area);
 assert.ok(Math.abs(Math.abs(middle.boundary[0][0])-2.6)<1e-9);
 assert.ok(middle.boundary.every(p=>p.every(Number.isFinite)));
 assert.equal(gateView(-10).origin[1],20);
 assert.equal(gateView(10).origin[1],-20);
});
test('seven model layers preserve their order and decreasing width',()=>{
 assert.equal(pagodaLayers.length,7);
 for(let i=1;i<7;i++){
  assert.ok(pagodaLayers[i].width<pagodaLayers[i-1].width);
  assert.ok(pagodaLayers[i].y>pagodaLayers[i-1].y);
 }
 for(const id of ['bell','pagoda','gate']){
  assert.ok(orderTopics[id].scope.includes('模型'));
  assert.ok(orderTopics[id].sources.every(s=>new URL(s.url).protocol==='https:'));
 }
});
test('order overlays switch without accumulating objects and remove cleanly',()=>{
 const scene=new THREE.Scene(),overlay=makeOrderOverlay(scene);
 assert.equal(scene.children.length,0);
 for(const id of ['bell','pagoda','gate','bell']){
  overlay.show(id,0,.5);
  assert.equal(scene.children.length,1);
  scene.traverse(o=>{const a=o.geometry?.attributes.position;if(a)assert.ok([...a.array].every(Number.isFinite));});
 }
 overlay.hide();assert.equal(scene.children.length,0);
 overlay.show('pagoda',1,1);overlay.dispose();assert.equal(scene.children.length,0);
});
