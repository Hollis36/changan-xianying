import * as THREE from 'three';
import {bellColumns,pagodaLayers,gateView} from './order-data.js';
import {galleryColors} from './theme.js';

export function makeOrderOverlay(scene){
 const root=new THREE.Group();root.name='mathematical-relations';
 function clear(){
  root.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});
  root.clear();
 }
 function line(points,opacity=.7,color=galleryColors.accent){
  const geometry=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));
  const material=new THREE.LineBasicMaterial({color,transparent:true,opacity,depthTest:false,depthWrite:false});
  const object=new THREE.Line(geometry,material);object.renderOrder=5;root.add(object);
 }
 function dot(point,radius=.16){
  const dot=new THREE.Mesh(new THREE.SphereGeometry(radius,12,8),new THREE.MeshBasicMaterial({color:galleryColors.accent,depthTest:false}));
  dot.position.fromArray(point);dot.renderOrder=6;root.add(dot);
 }
 function square(width,y,opacity){const h=width/2;line([[-h,y,h],[h,y,h],[h,y,-h],[-h,y,-h],[-h,y,h]],opacity);}
 function show(id,step=0,progress=0){
  clear();if(!root.parent)scene.add(root);
  const t=Math.max(0,Math.min(1,progress));
  if(id==='bell'){
   for(const x of bellColumns){line([[x,7,8.3],[x,12.4,8.3]],step===0?.9:.45);dot([x,12.4,8.3]);}
   if(step===0){
    line([[-8.15,6.2,8.3],[8.15,6.2,8.3]],.65);
    for(const x of bellColumns)line([[x,5.95,8.3],[x,6.45,8.3]],.8);
   }else{
    line(bellColumns.map(x=>[x,12.4,8.3]),1);
    for(const z of [-8.15,8.15])line([[-8.15,12.4,z],[8.15,12.4,z]],.75);
    for(const x of [-8.15,8.15])line([[x,12.4,-8.15],[x,12.4,8.15]],.75);
   }
  }else if(id==='pagoda'){
   const selected=Math.round(t*6);
   pagodaLayers.forEach((layer,i)=>{
    square(layer.width,layer.y,i===selected?1:.24);
    if(i===selected){line([[-layer.width/2,layer.y,layer.width/2+.35],[layer.width/2,layer.y,layer.width/2+.35]],1);dot([layer.width/2,layer.y,layer.width/2],.19);}
   });
   if(step===1){
    for(const sign of [-1,1])line(pagodaLayers.map(l=>[sign*l.width/2,l.y,l.width/2]),.85);
   }
  }else if(id==='gate'){
   const view=gateView(t),origin=[0,.2,view.origin[1]];
   const points=view.boundary.map(([x,z])=>[x,.2,z]);
   const vertices=[];for(let i=0;i<points.length-1;i++)vertices.push(...origin,...points[i],...points[i+1]);
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
   const fill=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:galleryColors.accent,transparent:true,opacity:.09,side:THREE.DoubleSide,depthTest:false,depthWrite:false}));fill.renderOrder=4;root.add(fill);
   line([origin,...points,origin],.55);line([[0,.22,22],[0,.22,-22]],.28);dot(origin,.28);
  }
 }
 function hide(){clear();root.removeFromParent();}
 return {show,hide,dispose:hide};
}
