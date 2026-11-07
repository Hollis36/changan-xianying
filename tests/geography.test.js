import test from 'node:test';
import assert from 'node:assert/strict';
import {places,project,pixelsPerKm,kmPerDegreeLat,distanceKm} from '../src/exhibition/geography/data.js';

test('geographic anchors fit the map, with north above and east to the right',()=>{
 const [bell,gate,pagoda]=places.map(p=>project(p.lon,p.lat));
 for(const [x,y] of [bell,gate,pagoda])assert.ok(x>100&&x<1700&&y>360&&y<1830);
 assert.ok(bell[1]<gate[1]&&gate[1]<pagoda[1]);
 assert.ok(Math.abs(bell[0]-gate[0])<1&&pagoda[0]>bell[0]+250);
});
test('map scale and published distance labels agree with geographic positions',()=>{
 const a=project(108.94,34.25),b=project(108.94,34.25+1/kmPerDegreeLat);
 assert.ok(Math.abs(a[1]-b[1]-pixelsPerKm)<1e-6);
 assert.equal(distanceKm(places[0],places[1]).toFixed(1),'0.9');
 assert.equal(distanceKm(places[1],places[2]).toFixed(1),'4.0');
});
