import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../site/'+name,import.meta.url),'utf8');
test('homepage embeds the published film without duplicate native download or route probes',async()=>{
 const [html,js]=await Promise.all([read('index.html'),read('main.js')]);
 const frame=html.match(/<iframe\b[^>]+>/)?.[0];assert.ok(frame);
 const url=new URL(frame.match(/src="([^"]+)"/)[1].replaceAll('&amp;','&'));
 assert.equal(url.origin,'https://player.bilibili.com');assert.equal(url.searchParams.get('bvid'),'BV1hm4p6XErc');
 assert.equal(url.searchParams.get('autoplay'),'0');assert.equal(url.searchParams.get('danmaku'),'0');
 assert.match(frame,/title="[^"]+"/);assert.match(frame,/allowfullscreen/);
 assert.doesNotMatch(html,/<video|<source/);assert.doesNotMatch(js,/setupNetworkMonitor|setupPlayer|fetch\(/);
 assert.match(html,/href="direct.html#film"/);assert.match(html,/https:\/\/www.bilibili.com\/video\/BV1hm4p6XErc\//);
 assert.match(html,/href="[^"]+changan-xianying-4k\.mp4">下载 4K 原片/);
});
test('fallback remains independently usable with quality, route selection and sharing',async()=>{
 const [html,js]=await Promise.all([read('direct.html'),read('direct.js')]);
 assert.match(html,/<video/);assert.doesNotMatch(html,/<iframe/);
 for(const id of ['video-quality','network-summary','network-retest','share','share-dialog'])assert.ok(html.includes(`id="${id}"`));
 assert.match(js,/import '.\/main.js\?v=bilibili-1'/);assert.match(js,/setupNetworkMonitor\(/);assert.match(js,/setupPlayer\(/);
 assert.match(html,/href="\.\/#film"/);
});
