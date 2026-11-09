// Structural details are geometry, so they remain visible from any orbit angle.
export function architecturalDetails({put,line,box,step}) {
  const face=(s,u,y,d)=>s===0?[u,y,d]:s===1?[d,y,-u]:s===2?[-u,y,-d]:[-d,y,u];
  function masonry(y,w,d,h,{mat='stone',opening=()=>false,taper=0,brick=.94,row=.32}={}) {
    for(let s=0;s<4;s++) {
      const width=s%2?d:w,depth=(s%2?w:d)/2;
      for(let yy=0;yy<h;yy+=step*.8) {
        const course=Math.floor(yy/row),v=yy%row;
        if(v<.035)continue;
        const half=width/2-taper*yy/h;
        for(let u=-half;u<=half;u+=step*.8) {
          const joint=((u+width/2+(course%2)*brick/2)%brick+brick)%brick;
          if(joint<.045||opening(u,yy,s))continue;
          const weather=.83+.16*Math.sin(course*2.17+Math.floor((u+width/2)/brick)*3.71);
          put(...face(s,u,y+yy,depth-taper*yy/h),mat,weather);
        }
      }
    }
  }
  function archFrame(s,depth,y,r,spring,mat='light') {
    for(let a=0;a<Math.PI;a+=.13) {
      for(let rr=r;rr<r+.30;rr+=.06)line(face(s,Math.cos(a)*rr,y+spring+Math.sin(a)*rr,depth),face(s,Math.cos(a+.105)*rr,y+spring+Math.sin(a+.105)*rr,depth),mat);
    }
    for(const sign of [-1,1])for(let yy=0;yy<spring;yy+=.32){
      line(face(s,sign*(r+.13),y+yy,depth),face(s,sign*(r+.13),y+Math.min(spring,yy+.27),depth),mat,2);
    }
  }
  function bracket(x,z,y,scale=1) {
    box(x,y,z,.42*scale,.18*scale,.42*scale,'red');
    for(let tier=0;tier<3;tier++) {
      const span=(.55+tier*.28)*scale,yy=y+(.19+tier*.23)*scale;
      for(let axis=0;axis<2;axis++) {
        for(let u=-span;u<=span;u+=Math.min(.065,step*.5)) {
          const lift=.14*Math.pow(Math.abs(u)/span,3)*scale;
          put(x+(axis===0?u:0),yy+lift,z+(axis===1?u:0),'jade');
          put(x+(axis===0?u:0),yy+lift+.10*scale,z+(axis===1?u:0),'gold',.85);
        }
        for(const sign of [-1,1])box(x+(axis===0?sign*span*.72:0),yy+.11*scale,z+(axis===1?sign*span*.72:0),.23*scale,.14*scale,.23*scale,'red');
      }
    }
  }
  function lattice(s,depth,center,y,w,h) {
    const p=(u,v)=>face(s,center+u,y+v,depth);
    for(const x of [-w/2,w/2])line(p(x,0),p(x,h),'red',3);
    for(const yy of [0,h*.26,h*.35,h])line(p(-w/2,yy),p(w/2,yy),'gold',2);
    // Open diamond lattice in the upper window; lower panels retain their frames.
    const base=h*.35,spacing=.34;
    for(let v=base-w;v<h+w;v+=spacing)for(const dir of [-1,1]) {
      for(let x=-w/2;x<w/2;x+=.07){const yy=v+dir*x;if(yy>base&&yy<h)put(...p(x,yy),'wood',1.35);}
    }
    for(const x of [-w*.28,0,w*.28])line(p(x,.12),p(x,h*.26-.1),'red',2);
  }
  function eaveBell(x,y,z) {
    line([x,y,z],[x,y-.4,z],'gold');
    for(let a=0;a<Math.PI*2;a+=.2)for(let v=0;v<.35;v+=.055){const r=.1+v*.25;put(x+Math.cos(a)*r,y-.4-v,z+Math.sin(a)*r,'gold');}
    line([x,y-.72,z],[x+.08,y-1.02,z],'gold');
  }
  return {masonry,archFrame,bracket,lattice,eaveBell,face};
}
