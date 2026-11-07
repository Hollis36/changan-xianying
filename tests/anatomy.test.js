import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {makeArtwork} from '../src/exhibition/scene.js';
import {generateModel} from '../src/models.js';
import {anatomyParts,anatomySources} from '../src/exhibition/anatomy-data.js';
const renderer={getPixelRatio:()=>1,render:()=>{}};

test('teaching groups preserve every original point and can be restored after isolation',()=>{
 const art=makeArtwork(renderer);art.load('bell');
 assert.equal(art.scene.children.length,3);
 const count=art.scene.children.reduce((n,p)=>n+p.geometry.attributes.position.count,0);
 assert.equal(count,generateModel('bell',1.3,1384).positions.length/3);
 art.setStudy({enabled:true,spread:1,selected:1,isolate:true});
 for(const p of art.scene.children){assert.equal(p.visible,p.userData.partId===1);assert.equal(p.position.y,anatomyParts[p.userData.partId].offset);}
 art.setStudy({enabled:false});
 for(const p of art.scene.children){assert.equal(p.visible,true);assert.equal(p.position.y,0);assert.equal(p.material.uniforms.emphasis.value,1);}
 art.load('pagoda');art.setStudy({enabled:true,spread:1,selected:0,isolate:true});
 assert.ok(art.scene.children.every(p=>p.visible&&p.position.y===0));art.dispose();
});
test('picking resolves an actual visible point to the correct component after separation',()=>{
 const art=makeArtwork(renderer);art.load('bell');art.setStudy({enabled:true,spread:1,selected:2,isolate:true});
 art.pose({target:[0,0,0],position:[0,12,60]},1);art.scene.updateMatrixWorld(true);art.camera.updateMatrixWorld(true);
 const base=art.scene.children.find(p=>p.userData.partId===2),pos=base.geometry.attributes.position;
 const p=new THREE.Vector3().fromBufferAttribute(pos,0).add(base.position).project(art.camera);
 assert.equal(art.pickPart(p.x,p.y),2);art.dispose();
});
test('every teaching claim group has a published source and a model limitation',()=>{
 for(const part of anatomyParts){assert.ok(part.model.length>20);assert.ok(part.sources.length>=2);for(const key of part.sources){assert.ok(anatomySources[key]?.supports);assert.equal(new URL(anatomySources[key].url).protocol,'https:');}}
});
