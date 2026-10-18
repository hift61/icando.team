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
 const starRandom=random(112);
 const stars=Array.from({length:1000},()=>({x:starRandom(),y:starRandom(),r:.3+Math.pow(starRandom(),5)*1.5,alpha:.25+starRandom()*.6,blue:starRandom()>.5,depth:starRandom()}));
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
 // Ground study based on the club's Goheung launch-site reference photographs.
 // Paint this detailed scenery once, rather than rebuilding it during scrolling.
 const ground=document.createElement('canvas');ground.width=1600;ground.height=1000;
 const gc=ground.getContext('2d');
 function groundTexture(){
  const g=gc,rnd=random(291);
  function polygon(points,fill){g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=fill;g.fill();}
  function line(points,color,width=1){g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.strokeStyle=color;g.lineWidth=width;g.stroke();}
  // Broad, softly shaded clouds above a low, open horizon.
  for(const [x,y,s]of [[80,220,1.25],[480,150,1.1],[1170,255,1.4]]){
   g.save();g.translate(x,y);g.scale(s,s);
   g.beginPath();g.moveTo(-180,60);g.bezierCurveTo(-155,20,-105,25,-80,35);g.bezierCurveTo(-95,-30,-20,-63,20,-20);g.bezierCurveTo(55,-70,150,-42,150,12);g.bezierCurveTo(230,-12,260,40,225,65);g.bezierCurveTo(100,88,-50,83,-180,60);
   const shade=g.createLinearGradient(0,-50,0,85);shade.addColorStop(0,'#f7f9f4b3');shade.addColorStop(.65,'#e5eceba6');shade.addColorStop(1,'#839ca345');g.fillStyle=shade;g.fill();g.restore();
  }
  g.fillStyle='#809ba2';g.beginPath();g.moveTo(0,608);g.bezierCurveTo(110,589,140,606,210,593);g.bezierCurveTo(265,585,272,570,325,578);g.bezierCurveTo(385,582,397,598,456,592);g.bezierCurveTo(510,586,550,558,593,569);g.bezierCurveTo(660,594,714,575,768,593);g.bezierCurveTo(850,581,880,607,962,595);g.bezierCurveTo(1115,573,1160,605,1245,579);g.bezierCurveTo(1390,556,1440,591,1600,574);g.lineTo(1600,643);g.lineTo(0,643);g.closePath();g.fill();
  g.fillStyle='#536f71';g.beginPath();g.moveTo(0,618);
  for(let i=0;i<=100;i++){const x=i*16,y=612-Math.sin(i*.17)*7-Math.sin(i*.53)*4-rnd()*5;g.lineTo(x,y);}g.lineTo(1600,646);g.lineTo(0,646);g.closePath();g.fill();
  const grass=g.createLinearGradient(0,616,0,700);grass.addColorStop(0,'#6b8551');grass.addColorStop(1,'#879259');g.fillStyle=grass;g.fillRect(0,619,1600,88);
  // A distant tree belt stays low, unlike the former mountain-and-forest scene.
  for(let i=0;i<190;i++){const x=i*9,height=4+rnd()*12;g.fillStyle=i%3?'#405b45':'#50694b';g.beginPath();g.ellipse(x,622-height*.35,7+rnd()*9,height,0,0,Math.PI*2);g.fill();}
  polygon([[0,658],[1600,649],[1600,675],[0,687]],'#b4b6a8');
  const concrete=g.createLinearGradient(0,660,0,1000);concrete.addColorStop(0,'#cccabd');concrete.addColorStop(1,'#aca99d');g.fillStyle=concrete;g.fillRect(0,676,1600,324);
  polygon([[0,688],[178,684],[528,1000],[0,1000]],'#888b86');
  // Expansion joints and a faded taxiway stripe give the apron its depth.
  for(const x of [-2200,-1400,-600,200,1000,1800,2600])line([[800+(x-800)*.08,672],[x,1000]],'#726f6559',1.15);
  for(const y of [688,717,764,834,935])line([[0,y+10],[1600,y-7]],'#76766b45',1.05);
  g.strokeStyle='#c6a75f99';g.lineWidth=3;g.beginPath();g.moveTo(286,681);g.bezierCurveTo(240,720,435,735,644,744);g.bezierCurveTo(920,758,1320,807,1600,878);g.stroke();
  line([[0,671],[545,668]],'#ecebe0b3',2);
  for(let i=0;i<1100;i++){const x=rnd()*1600,y=682+rnd()*318;g.fillStyle=i%2?'#f2ede31c':'#4b514719';g.fillRect(x,y,.5+rnd()*2,.5+rnd()*1.2);}
  for(let i=0;i<12;i++){const x=42+i*33,y=677-i*.2;g.fillStyle='#d2bd69';g.fillRect(x,y-12,3,12);g.fillStyle='#4c5146';g.fillRect(x,y-8,3,4);}
  // White peaked tents, with open sides and equipment tables beneath.
  function tent(x,y,size){
   g.save();g.translate(x,y);g.scale(size,size);
   polygon([[-63,8],[63,8],[70,64],[-61,64]],'#374b456b');
   for(const px of [-63,0,63])line([[px,5],[px,64]],'#d4dddb',2);
   g.fillStyle='#e9eeeb';g.beginPath();g.moveTo(-70,7);g.quadraticCurveTo(-17,-6,0,-64);g.quadraticCurveTo(20,-9,70,7);g.quadraticCurveTo(0,18,-70,7);g.fill();
   g.fillStyle='#c4d0cf';g.beginPath();g.moveTo(0,-64);g.quadraticCurveTo(26,-13,70,7);g.lineTo(0,11);g.closePath();g.fill();
   line([[-70,7],[0,11],[70,7]],'#eef3ef',2);
   g.fillStyle='#455854';g.fillRect(-42,39,78,5);for(const px of [-35,28])line([[px,44],[px,63]],'#7c8b83',2);
   g.fillStyle='#344847';g.fillRect(-26,23,17,16);g.fillRect(10,28,14,11);g.restore();
  }
  tent(1370,633,.72);tent(1291,639,.86);tent(1190,646,1);
  // Foreground launch rig: silver lattice mast, small white rocket and wheeled base.
  g.save();g.translate(1020,0);g.lineCap='round';g.lineJoin='round';
  polygon([[-74,862],[29,872],[210,972],[121,992],[-76,893]],'#4653542e');
  for(const x of [-61,-30]){line([[x,286],[x,798]],'#9baeb4',5);line([[x-1,286],[x-1,798]],'#e6edeb',2);}
  for(let y=300;y<780;y+=35){line([[-61,y],[-30,y],[-61,y+35]],'#d4dfdf',2.5);line([[-61,y],[-30,y+35]],'#b3c3c7',1.5);}
  line([[-61,286],[-30,286]],'#d4dfdf',3);
  line([[-61,297],[-89,278],[-94,263]],'#596c74',3);polygon([[-100,258],[-85,255],[-84,267],[-98,270]],'#354750');
  // All support tubes meet the control-box chassis, as in the photographs.
  const feet=[[-192,906],[188,923],[90,975]];
  for(const [x,y]of feet){line([[-13,821],[x,y-8]],'#91a5aa',7);line([[-14,820],[x,y-9]],'#e2e9e5',3.5);line([[-20,795],[x*.83,y-24],[x,y-8]],'#e1e8e6',2.5);line([[x,y-17],[x,y+2]],'#8e9e9d',3);g.fillStyle='#788d8c';g.beginPath();g.ellipse(x,y+3,9,3,0,0,Math.PI*2);g.fill();}
  for(const [x,y]of [[-48,871],[29,883],[51,866]]){g.fillStyle='#334044';g.beginPath();g.ellipse(x,y,6,10,0,0,Math.PI*2);g.fill();g.strokeStyle='#a16c66';g.lineWidth=2;g.stroke();}
  polygon([[-60,785],[-38,770],[58,782],[38,797]],'#edf0ea');
  polygon([[38,797],[58,782],[58,863],[38,878]],'#adbcc0');
  polygon([[-60,785],[38,797],[38,878],[-60,865]],'#d7dfe0');
  line([[-60,785],[38,797],[38,878],[-60,865],[-60,785]],'#8e9fa5',1);
  line([[-43,795],[-43,859]],'#9aabb0',.8);line([[22,804],[22,870]],'#a4b3b7',.8);
  for(const x of [-52,30])for(const y of [806,830,855]){g.fillStyle='#778c94';g.beginPath();g.arc(x,y+(x>0?7:0),1.3,0,Math.PI*2);g.fill();}
  polygon([[-26,779],[27,785],[44,797],[-41,789]],'#495f66');
  // Ogive nose, cylindrical body and three stabilising fins.
  const rocket=g.createLinearGradient(-9,0,15,0);rocket.addColorStop(0,'#b2c3c9');rocket.addColorStop(.45,'#f3f5ed');rocket.addColorStop(1,'#d0dcdf');
  g.fillStyle=rocket;g.beginPath();g.moveTo(-7,651);g.quadraticCurveTo(-7,603,3,566);g.quadraticCurveTo(16,605,14,651);g.closePath();g.fill();g.fillRect(-7,650,21,126);
  line([[-7,651],[14,651]],'#9aaeb7',1);line([[-7,661],[14,661]],'#c1cdd0',.8);
  polygon([[-7,746],[-24,781],[-5,776]],'#d9e1e0');polygon([[13,746],[32,786],[12,777]],'#becdd1');polygon([[1,750],[1,788],[6,790],[6,752]],'#eef1eb');
  g.fillStyle='#a76662';g.beginPath();g.arc(3,673,3.2,0,Math.PI*2);g.fill();g.fillStyle='#466e8e';g.beginPath();g.arc(4,675,2.2,0,Math.PI*2);g.fill();
  g.save();g.translate(2,691);g.rotate(Math.PI/2);g.fillStyle='#445b6d';g.font='600 7px sans-serif';g.fillText('CANSAT',0,0);g.restore();
  g.strokeStyle='#475755';g.lineWidth=1.8;g.beginPath();g.moveTo(47,831);g.bezierCurveTo(98,879,161,843,157,886);g.bezierCurveTo(150,907,77,896,118,875);g.stroke();
  g.fillStyle='#bb925b';g.fillRect(132,879,17,7);g.restore();
 }
 groundTexture();
 function drawGround(t){
  const p=smooth(.7,1,t);if(p===0)return;
  const scale=Math.max(w/ground.width,h/ground.height)*(1+p*.06);
  const width=ground.width*scale,height=ground.height*scale;
  const x=clamp(w*(w<h?.55:.64)-1020*scale,w-width,0);
  const y=h-height+(1-p)*h*.55;
  ctx.save();ctx.globalAlpha=p;ctx.drawImage(ground,x,y,width,height);ctx.restore();
 }
 function draw(){
  frame=0;
  resize();
  if(layoutDirty){positionWaypoints();layoutDirty=false;}
  const scroll=clamp(scrollY,0,maxScroll),t=scroll/maxScroll;
  const air=smooth(.42,.83,t),low=smooth(.78,1,t);
  const top=color(color([3,6,15],[27,92,142],air),[110,157,188],low);
  const bottom=color(color([6,12,25],[135,194,213],air),[199,217,224],low);
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
