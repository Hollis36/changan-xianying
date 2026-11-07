import test from 'node:test';
import assert from 'node:assert/strict';
import { generateModel, landmarks } from '../src/models.js';

test('an exhibition palette changes colors without moving or relabelling any building', () => {
  const palette=Object.fromEntries(['stone','brick','jade','red','gold','wood','light'].map(key=>[key,[.2,.3,.4]]));
  for(const {id} of landmarks){
    const original=generateModel(id,.15,1384), themed=generateModel(id,.15,1384,palette);
    assert.deepEqual(themed.positions,original.positions);
    assert.deepEqual(themed.partIds,original.partIds);
    assert.ok(themed.colors.some((v,i)=>v!==original.colors[i]),'palette must change point colors');
    assert.ok(themed.colors.every(v=>Number.isFinite(v)&&v>=0&&v<=1));
    assert.deepEqual(generateModel(id,.15,1384).colors,original.colors);
  }
});

test('all three landmarks produce finite, bounded point clouds with matching colors', () => {
  for (const item of landmarks) {
    const model = generateModel(item.id, 0.25);
    assert.ok(model.positions.length > 12000);
    assert.equal(model.positions.length, model.colors.length);
    assert.ok(model.positions.every(Number.isFinite));
    assert.ok(model.colors.every(v => v >= 0 && v <= 1));
    assert.ok(model.positions.every(v => Math.abs(v) < 60));
  }
});
test('point clouds are reproducible and distinct for each building', () => {
  const a = generateModel('bell', 0.2);
  const b = generateModel('bell', 0.2);
  assert.deepEqual(a.positions, b.positions);
  assert.notDeepEqual(a.positions, generateModel('pagoda', 0.2).positions);
});
test('the bell tower base preserves the central arched passage', () => {
  const { positions } = generateModel('bell', 0.6);
  let filledOpening = 0;
  for (let i = 0; i < positions.length; i += 3) {
    const [x,y,z] = positions.slice(i,i+3);
    if (Math.abs(x) < 1.8 && y > 0.1 && y < 3.7 && Math.abs(z - 12) < 0.03) filledOpening++;
  }
  assert.equal(filledOpening, 0);
});
test('Yongning Gate has front and rear passages but solid end walls', () => {
  const {positions}=generateModel('gate',.4);
  let endWall=0,blockedDoor=0;
  for(let i=0;i<positions.length;i+=3){
    const x=positions[i],y=positions[i+1],z=positions[i+2];
    if(Math.abs(x-22)<.03&&Math.abs(z)<1.5&&y>.3&&y<2.5)endWall++;
    if(Math.abs(z-6.5)<.03&&Math.abs(x)<1.5&&y>.3&&y<2.5)blockedDoor++;
  }
  assert.ok(endWall>50,'east wall should retain masonry');
  assert.equal(blockedDoor,0,'main gate remains open');
});

test('bell component labels cover every point and survive the deterministic shuffle', () => {
  const a=generateModel('bell',.3),b=generateModel('bell',.3);
  assert.ok(a.partIds instanceof Uint8Array);
  assert.equal(a.partIds.length,a.positions.length/3);
  assert.deepEqual(a.partIds,b.partIds);
  const counts=[0,0,0];
  for(let i=0;i<a.partIds.length;i++){
    const part=a.partIds[i],y=a.positions[i*3+1];
    assert.ok(part>=0&&part<=2);
    counts[part]++;
    if(part===0)assert.ok(y>11,'roof group must not contain masonry or lower columns');
    if(part===1)assert.ok(y>6.8&&y<26,'woodwork must stay within the pavilion');
    if(part===2)assert.ok(y<7.1,'base group must not contain upper structures');
  }
  assert.ok(counts.every(n=>n>1000));
});
