import './main.js?v=bilibili-1';
import {setupNetworkMonitor} from './network.js?v=network-1';
import {setupPlayer} from './player.js?v=network-1';
const video=document.querySelector('video'),quality=document.querySelector('#video-quality');
const player=setupPlayer(video,quality,document.querySelector('#video-error'));
setupNetworkMonitor(video,quality,{summary:document.querySelector('#network-summary'),current:document.querySelector('#network-current'),device:document.querySelector('#network-device'),measurements:document.querySelector('#network-results'),retest:document.querySelector('#network-retest')},player);
