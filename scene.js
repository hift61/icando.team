'use strict';
// An art-directed scroll scene, not a scale model of the solar system.
(() => {
 const canvas=document.getElementById('universe'),screen=canvas.getContext('2d',{alpha:false});
 const buffer=document.createElement('canvas'),ctx=buffer.getContext('2d',{alpha:false});
 const starfield=document.createElement('canvas'),sc=starfield.getContext('2d');
 if(!screen||!ctx||!sc)return;
 const progressDot=document.getElementById('progress-dot');
 const parachute=document.getElementById('progress-parachute');
 const progressTrack=progressDot.parentElement;
 const waypoints=Array.from(document.querySelectorAll('.journey-stop')).map(link=>({link,section:document.getElementById(link.dataset.section),offset:0}));
 let maxScroll=1,trackHeight=0,markerAnchor=36,layoutDirty=true,activeWaypoint=null,lastDeployment='';
 function positionWaypoints(){
  maxScroll=Math.max(1,document.documentElement.scrollHeight-h);
  trackHeight=progressTrack.clientHeight;
  markerAnchor=progressDot.offsetHeight*.75;
  for(const waypoint of waypoints){
   waypoint.offset=waypoint.section.getBoundingClientRect().top+scrollY;
   const top=`${Math.min(1,waypoint.offset/maxScroll)*100}%`;
   if(waypoint.link.style.top!==top)waypoint.link.style.top=top;
  }
 }
 let w=0,h=0,dpr=0,frame=0,starCount=0;
 const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
 const lerp=(a,b,t)=>a+(b-a)*t;
 const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
 function random(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
 // Keep the same scene when browser chrome or the viewport changes size.
 const starRandom=random(112),terrainRandom=random(218);
 const stars=Array.from({length:1000},()=>({x:starRandom(),y:starRandom(),r:.3+Math.pow(starRandom(),5)*1.5,alpha:.25+starRandom()*.6,blue:starRandom()>.5,depth:starRandom()}));
 const terrain=Array.from({length:5},(_,layer)=>Array.from({length:101},(_,i)=>.35*Math.sin(i*.19+layer)+.15*Math.sin(i*.73+layer*2)+.35+terrainRandom()*.1));
 function cacheStars(){
  starfield.width=buffer.width;starfield.height=buffer.height;
  sc.setTransform(dpr,0,0,dpr,0,0);
  for(let i=0;i<starCount;i++){
   const star=stars[i],x=star.x*w,y=star.y*h;
   sc.fillStyle=`rgba(${star.blue?'173,198,234':'236,226,207'},${star.alpha})`;
   sc.beginPath();sc.arc(x,y,star.r,0,Math.PI*2);sc.fill();
   if(star.r>1.3){sc.strokeStyle='#e2e9f544';sc.lineWidth=.5;sc.beginPath();sc.moveTo(x-star.r*3,y);sc.lineTo(x+star.r*3,y);sc.moveTo(x,y-star.r*3);sc.lineTo(x,y+star.r*3);sc.stroke();}
  }
 }
 function color(a,b,t){return a.map((v,i)=>Math.round(lerp(v,b[i],t)));}
 const rgb=a=>`rgb(${a.join(',')})`;
 function radial(x,y,r,stops){const g=ctx.createRadialGradient(x,y,0,x,y,r);for(const [at,c]of stops)g.addColorStop(at,c);ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
 function disc(x,y,r,base,highlight){
  ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.clip();
  const g=ctx.createRadialGradient(x-r*.48,y-r*.38,r*.1,x+r*.24,y+r*.15,r*1.1);
  g.addColorStop(0,highlight);g.addColorStop(.42,base);g.addColorStop(.83,'#121b29');g.addColorStop(1,'#02050c');
  ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore();
 }
 function planet(x,y,r,type){
  if(type==='saturn'){
   ctx.save();ctx.translate(x,y);ctx.rotate(-.35);
   ctx.strokeStyle='#c9b49a66';ctx.lineWidth=r*.37;ctx.beginPath();ctx.ellipse(0,0,r*1.85,r*.47,0,Math.PI,Math.PI*2);ctx.stroke();
   ctx.restore();disc(x,y,r,'#8b8174','#e0ceb0');
   ctx.save();ctx.translate(x,y);ctx.rotate(-.35);ctx.strokeStyle='#bca98e88';ctx.lineWidth=r*.3;ctx.beginPath();ctx.ellipse(0,0,r*1.85,r*.47,0,0,Math.PI);ctx.stroke();ctx.strokeStyle='#e8d1ad55';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,0,r*2.1,r*.53,0,0,Math.PI);ctx.stroke();ctx.restore();
  }else{
   disc(x,y,r,type==='mars'?'#a85b42':'#456f9b',type==='mars'?'#e9af7e':'#b0d4e1');
   ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.clip();ctx.fillStyle=type==='mars'?'#65392c33':'#abcddd22';
   for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(x-r*.1,y-r*.6+i*r*.28,r*.85,r*.08,-.2,0,Math.PI*2);ctx.fill();}ctx.restore();
  }
 }
 const earth=document.createElement('canvas');earth.width=earth.height=1024;
 const ec=earth.getContext('2d');
 function earthTexture(){
  const rnd=random(84);const g=ec.createLinearGradient(0,0,1024,1024);g.addColorStop(0,'#385d78');g.addColorStop(.45,'#21496b');g.addColorStop(1,'#071b34');ec.fillStyle=g;ec.fillRect(0,0,1024,1024);
  ec.fillStyle='#657c62';
  for(const [cx,cy,rx,ry]of [[210,200,140,190],[310,520,90,170],[610,190,245,100],[710,460,130,175],[830,730,105,70]]){
   ec.beginPath();for(let i=0;i<100;i++){const a=i/100*Math.PI*2,noise=.87+.12*Math.sin(a*3+cx)+.06*Math.cos(a*7+cy)+.035*Math.sin(a*13),x=cx+Math.cos(a)*rx*noise,y=cy+Math.sin(a)*ry*noise;i?ec.lineTo(x,y):ec.moveTo(x,y);}ec.closePath();ec.fill();
  }
  for(let i=0;i<1600;i++){ec.fillStyle=`rgba(175,197,175,${rnd()*.12})`;ec.beginPath();ec.ellipse(rnd()*1024,rnd()*1024,4+rnd()*25,1+rnd()*5,-.4,0,Math.PI*2);ec.fill();}
  ec.filter='blur(4px)';
  for(let i=0;i<450;i++){const x=rnd()*1100-40,y=rnd()*1024;ec.fillStyle=`rgba(228,239,243,${.08+rnd()*.28})`;ec.beginPath();ec.ellipse(x,y,20+rnd()*100,2+rnd()*13,-.3,0,Math.PI*2);ec.fill();}ec.filter='none';
 }
 earthTexture();
 function drawEarth(t){
  if(t>=.79)return;
  const approach=smooth(.04,.7,t),radius=Math.max(w*.8,h*.78)*(1+approach*.7);
  const top=lerp(h*1.07,h*.05,approach),cx=w*.48,cy=top+radius;
  ctx.save();ctx.globalAlpha=1-smooth(.64,.79,t);
  const halo=ctx.createRadialGradient(cx,cy,radius*.96,cx,cy,radius*1.045);
  halo.addColorStop(0,'#0b203c00');halo.addColorStop(.4,'#458fb56b');halo.addColorStop(.52,'#8ecdebd9');halo.addColorStop(.63,'#3c99d93b');halo.addColorStop(1,'#1876cf00');
  ctx.fillStyle=halo;ctx.beginPath();ctx.arc(cx,cy,radius*1.045,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.clip();ctx.drawImage(earth,cx-radius,cy-radius,radius*2,radius*2);
  const shade=ctx.createLinearGradient(0,top,w,h);shade.addColorStop(0,'#05162a18');shade.addColorStop(.45,'#02112155');shade.addColorStop(1,'#020811ee');ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);
  ctx.restore();
 }
 function cloud(x,y,size,opacity){
  ctx.save();ctx.globalAlpha=opacity;
  for(let i=0;i<7;i++){
   const cx=x+(i-3)*size*.22,cy=y+Math.sin(i*1.6)*size*.065,r=size*(.17+.05*Math.sin(i+2));
   const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,'#fffdf1bb');g.addColorStop(.5,'#eaf2f67a');g.addColorStop(1,'#eaf2f600');
   ctx.save();ctx.translate(cx,cy);ctx.scale(1,.55);ctx.fillStyle=g;ctx.translate(-cx,-cy);ctx.fillRect(cx-r,cy-r,r*2,r*2);ctx.restore();
  }ctx.restore();
 }
 function drawGround(t){
  const p=smooth(.67,1,t);if(p===0)return;
  ctx.save();ctx.globalAlpha=p;
  const horizon=lerp(h*1.02,h*.51,p);
  radial(w*.68,horizon,w*.5,[[0,'#fff3d650'],[1,'#fff3d600']]);
  for(let layer=0;layer<5;layer++){
   const offset=layer*.066*h,amplitude=(.055+layer*.025)*h*p;
   ctx.beginPath();ctx.moveTo(-20,h);
   for(let i=0;i<=100;i++){
    const x=i/100*w,noise=terrain[layer][i],y=horizon+offset-amplitude*(noise*.6+Math.sin(i*.085+layer)*.4);
    ctx.lineTo(x,y);
   }ctx.lineTo(w+20,h);ctx.closePath();
   const colors=['#7b9f9e','#688e87','#557b6d','#3d6151','#294736'];ctx.fillStyle=colors[layer];ctx.fill();
  }
  const fog=ctx.createLinearGradient(0,horizon-h*.2,0,h);fog.addColorStop(0,'#d5e7db00');fog.addColorStop(.3,'#d5e7db4a');fog.addColorStop(.64,'#d5e7db00');fog.addColorStop(1,'#132b2420');ctx.fillStyle=fog;ctx.fillRect(0,horizon-h*.2,w,h);
  // Near-surface tree silhouettes enter only at the end of the descent.
  const near=smooth(.91,1,t);ctx.globalAlpha=near*.65;const rnd=random(43);
  for(let i=0;i<Math.ceil(w/28);i++){
   const x=rnd()*w,y=h*(.86+rnd()*.14),size=(10+rnd()*35)*near;
   ctx.fillStyle='#15382b';ctx.beginPath();ctx.moveTo(x,y-size);ctx.lineTo(x-size*.24,y);ctx.lineTo(x+size*.24,y);ctx.closePath();ctx.fill();ctx.fillRect(x-1,y,2,size*.13);
  }ctx.restore();
 }
 function draw(){
  frame=0;
  resize();
  if(layoutDirty){positionWaypoints();layoutDirty=false;}
  const scroll=clamp(scrollY,0,maxScroll),t=scroll/maxScroll;
  const air=smooth(.42,.83,t),low=smooth(.78,1,t);
  const top=color(color([3,6,15],[27,92,142],air),[99,155,178],low);
  const bottom=color(color([6,12,25],[135,194,213],air),[211,224,198],low);
  const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,rgb(top));sky.addColorStop(1,rgb(bottom));ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  const space=1-smooth(.35,.68,t);
  if(space>0){
  ctx.save();ctx.globalAlpha=space;
  // A faint galactic haze leaves plenty of dark negative space.
  ctx.save();ctx.translate(w*.55,h*.43-t*h*.65);ctx.rotate(-.36);ctx.scale(1,.28);radial(0,0,w*.7,[[0,'#66799e18'],[.55,'#59688d0c'],[1,'#59688d00']]);ctx.restore();
  // Move a cached starfield on physical pixel boundaries to avoid scintillation.
  ctx.drawImage(starfield,0,-Math.round(t*h*.8*dpr)/dpr,w,h);
  const sunX=w*.69,sunY=h*.29-t*h*.65,sunR=Math.max(10,Math.min(w,h)*.017);
  radial(sunX,sunY,sunR*10,[[0,'#fff1bc60'],[.12,'#ffc76c44'],[.35,'#e77a3220'],[1,'#e77a3200']]);
  // Fill an explicit circle, so the solid gradient edge cannot form a square.
  ctx.save();
  ctx.beginPath();ctx.arc(sunX,sunY,sunR,0,Math.PI*2);ctx.clip();
  const sunGradient=ctx.createRadialGradient(sunX-sunR*.15,sunY-sunR*.15,0,sunX,sunY,sunR);
  sunGradient.addColorStop(0,'#fffde2');sunGradient.addColorStop(.6,'#ffe3a7');sunGradient.addColorStop(1,'#eba64d');
  ctx.fillStyle=sunGradient;ctx.fillRect(sunX-sunR,sunY-sunR,sunR*2,sunR*2);
  ctx.restore();
  planet(w*.84,h*.56-t*h*.82,Math.max(13,Math.min(w,h)*.03),'saturn');
  planet(w*.27,h*.44-t*h*.73,Math.max(6,Math.min(w,h)*.013),'mars');
  planet(w*.5,h*.18-t*h*.62,Math.max(4,Math.min(w,h)*.009),'blue');
  ctx.restore();
  }
  drawEarth(t);
  const clouds=smooth(.5,.83,t);
  if(clouds>0){
   const drift=(t-.55)*h*1.15;
   cloud(w*.24,h*.85-drift,w*.65,clouds*.7);
   cloud(w*.77,h*1.17-drift,w*.8,clouds*.8);
   cloud(w*.42,h*1.56-drift,w*.9,clouds*.7);
   cloud(w*.15,h*.47-(t-.7)*h*.18,w*.38,low*.5);
  }
  drawGround(t);
  // A light vignette keeps the header readable at every altitude.
  const vignette=ctx.createLinearGradient(0,0,0,h*.22);vignette.addColorStop(0,'#03091638');vignette.addColorStop(1,'#03091600');ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h*.22);
  // Publish only the completed scene; keep the previous image while rendering.
  if(canvas.width!==buffer.width)canvas.width=buffer.width;
  if(canvas.height!==buffer.height)canvas.height=buffer.height;
  screen.setTransform(1,0,0,1,0,0);
  screen.drawImage(buffer,0,0);
  progressDot.style.transform=`translateY(${t*trackHeight-markerAnchor}px)`;
  // Scale canopy and suspension lines around their shared attachment above the can.
  const deployment=smooth(.05,.9,t);
  const canopyTransform=`translate(24 43) scale(${lerp(.1,1,deployment).toFixed(3)} ${lerp(.3,1,deployment).toFixed(3)}) translate(-24 -43)`;
  if(parachute&&canopyTransform!==lastDeployment){
   parachute.setAttribute('transform',canopyTransform);
   lastDeployment=canopyTransform;
  }
  let active=waypoints[0];
  for(const waypoint of waypoints)if(scroll+Math.min(h*.3,180)>=waypoint.offset)active=waypoint;
  if(active!==activeWaypoint){
   for(const waypoint of waypoints){
    const current=waypoint===active;
    waypoint.link.classList.toggle('is-active',current);
    if(current)waypoint.link.setAttribute('aria-current','location');else waypoint.link.removeAttribute('aria-current');
   }
   activeWaypoint=active;
  }
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(draw);}
 function resize(){
  // Bound GPU memory on large/Retina displays; text and icons keep native resolution.
  const nextDpr=Math.min(devicePixelRatio||1,2,Math.sqrt(4000000/(innerWidth*innerHeight)));
  if(w===innerWidth&&h===innerHeight&&dpr===nextDpr)return;
  w=innerWidth;h=innerHeight;dpr=nextDpr;
  // Resize the back buffer first; the visible image stays intact until presentation.
  const width=Math.round(w*dpr),height=Math.round(h*dpr);
  if(buffer.width!==width)buffer.width=width;
  if(buffer.height!==height)buffer.height=height;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  starCount=Math.min(stars.length,Math.floor(w*h/1100));
  cacheStars();
  layoutDirty=true;
 }
 const layout=()=>{layoutDirty=true;schedule();};
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',layout,{passive:true});schedule();
 if('ResizeObserver' in window)new ResizeObserver(layout).observe(document.getElementById('journey'));
 addEventListener('load',layout,{once:true});
})();
