// ---- intro animée : le globe tourne, s'arrête sur la France, la mascotte fait un clin d'œil,
// puis on plonge dans la carte et on arrive sur l'écran d'accueil (photo de ville). ----
// Une seule fois par jour. Un tap n'importe où passe l'animation. Lien de test : /?intro
// Ce fichier ne dépend de rien : il se superpose à la page et s'efface tout seul.
(function(){
  "use strict";
  var KEY="wz_intro_day", today=new Date().toISOString().slice(0,10), force=/[?&]intro(=|&|$)/.test(location.search);
  
  if(!force && window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var cvTest=document.createElement("canvas");
  if(!cvTest.getContext||!cvTest.getContext("2d")) return;
  try{ localStorage.setItem(KEY,today); }catch(e){}

  // on masque l'ancien écran de démarrage pendant l'intro (il continue son minuteur et se retire tout seul)
  var hideSplash=document.createElement("style");
  hideSplash.textContent="#splash-screen{visibility:hidden !important}";
  document.head.appendChild(hideSplash);

  var fr=/^fr/i.test(navigator.language||"fr");
  var box=document.createElement("div");
  box.id="wz-intro";
  box.setAttribute("role","presentation");
  box.style.cssText="position:fixed;inset:0;z-index:9999;background:#0B1526;opacity:1;transition:opacity .6s ease;touch-action:manipulation;cursor:pointer";
  var cv=document.createElement("canvas");
  cv.style.cssText="position:absolute;inset:0;width:100%;height:100%;display:block";
  var skip=document.createElement("button");
  skip.type="button";
  skip.textContent=fr?"Passer":"Skip";
  skip.setAttribute("aria-label",fr?"Passer l'animation":"Skip the animation");
  skip.style.cssText="position:absolute;top:max(14px,env(safe-area-inset-top));right:14px;border:0;background:rgba(255,255,255,.22);color:#fff;font:700 13px 'Plus Jakarta Sans',-apple-system,'Segoe UI',Roboto,Arial,sans-serif;padding:8px 14px;border-radius:999px;cursor:pointer";
  box.appendChild(cv);box.appendChild(skip);
  document.body.appendChild(box);
  var ctx=cv.getContext("2d");

  var D=Math.PI/180;
  function P(s){ // "lon,lat lon,lat ..."
    return s.trim().split(/\s+/).map(function(p){var a=p.split(',');return [+a[0],+a[1]];});
  }
  var WORLD=[
    // Eurasie
    P("-9,37 -9.5,39 -9,43.2 -1.8,43.4 -1.2,46 -4.7,48.5 -1.6,48.7 -1.9,49.7 0.2,49.4 1.6,50.9 3.5,51.4 4.8,53 8.5,53.6 8.6,55.5 10,57.6 10.6,55 12,54.2 14,54 19,54.4 21,56 23,59.5 28,60 30,60 23,60.5 21,63 25,65.5 22,66 17.5,62.5 19,60 16.5,57 14,55.5 12.5,56 11,59 8,58 5.5,59 5,62 10,64 14,67.5 20,70 28,71 40,67.5 44,68.5 60,69 70,73 80,73.5 100,77 112,74 130,71 140,72.5 160,70 170,70 180,68 180,65 177,64.5 170,60 163,60 160,54 156,51 155,58 143,59 137,54 141,52 140,48 133,43 130,42.5 129,35.5 126.5,34.5 126.5,37.5 125,39.5 121.5,39 122,37 119,37 121,32 122,30 119.5,25.5 116,22.5 110.5,21 108,21.5 106.5,19.5 109,15 108.5,11 105,8.7 105,10.5 100.5,13.5 99.5,10 100.5,7 103.5,1.5 101,3 98.5,8 98.5,16.5 94,18 92,22 90,22 87,21 80,15.5 80,10 77.5,8 76,10 73,17.5 72.5,21 68.5,23.5 66.5,25.5 61.5,25 57,25.7 56.5,27 52,27.8 50,30 48.5,30 48,29.5 50,26 51.5,24.5 54.5,24 56,26 56.5,24.5 58.5,23.5 59.5,22.5 55,17 52,16 45,13 43,13 42.5,16 39,21.5 35,28 32.5,30 34.5,31.5 35.8,34.5 36,36.5 31,36.8 28,36.7 26.5,38.5 26.5,40 29,41 32,41.7 37,41 41.5,41.5 41.5,42.5 37.5,45 35,45 33,46 31,46.5 29.5,45.5 28.7,43.5 28,41.5 26,40.8 23.5,40.3 24,38 22.5,36.5 21.5,38 19.5,40 19.5,42 13.5,45.5 12.3,44.5 16,41.5 18.5,40.2 16,38 15.7,40 12.5,41.5 10.5,43 8.5,44.3 7.5,43.8 4.8,43.4 3,43.1 3.1,42.4 -0.3,39.5 -0.8,37.6 -2,36.7 -5.4,36.1 -6.3,36.9"),
    // Afrique
    P("-17,21 -16,24 -13,27.7 -10,29.5 -9.8,31.5 -6.8,34 -5.9,35.8 -2,35.1 3,36.8 10,37.3 11,35 10,33.5 15,32.3 20,32 20,30.5 25,32 32.5,31.2 34,27 37,21 39,16 43,12.5 51,12 51,10.5 48,5 41,-2 39.5,-5 40.5,-11 40.5,-15 35,-21 35.5,-24 32.5,-26 32.8,-28.5 30,-31.5 27,-33.5 22,-34.2 18.4,-34.2 18,-31 15,-27 14.5,-22 11.8,-17 13.5,-12 12.3,-6 9,-1 9.5,3 8.5,4.5 5,6 1,6 -4,5.2 -7.5,4.4 -11.5,7 -13,9 -16,12 -17.5,14.7 -16.5,19"),
    P("49.3,-12 50.5,-15.5 47,-25 44,-24.5 43.5,-21 44.5,-16 47,-14.5"),
    // Amérique du Nord
    P("-168,65.5 -162,70 -155,71.3 -140,69.5 -128,70 -115,68 -95,72 -85,69.5 -82,66 -88,64 -94,60 -93,58 -85,55.5 -80,51.5 -79,55 -77,60 -72,61 -65,60 -62,57 -57,53 -60,50 -66,50 -71,47 -65,49.2 -61,46 -65,44 -70,43.5 -70,41.7 -74,40.5 -76,37 -76,35 -81,31 -80,26 -81.5,25 -83,29 -85,29.7 -89,30 -94,29.5 -97.5,27 -97.7,22 -95,18.5 -91,18.7 -90.5,21 -87,21.5 -88,16 -83.5,15 -83.5,11 -79.5,9.5 -77.5,8.5 -79,7.5 -80.5,7.3 -83,8.2 -85.7,10 -87.5,13 -92,14.5 -96,15.7 -105,19.5 -106,23 -110,27 -113,31 -114.8,31.8 -117,32.5 -120.5,34.5 -124,40 -124.5,43 -124,47 -123,49 -127,51 -131,54 -135,58 -140,60 -148,60.5 -152,59 -157,58 -163,55 -158,58.5 -162,60 -165,62 -162,64"),
    P("-73,78 -60,82 -30,83.5 -20,80 -20,74 -22,70 -32,68 -42,62 -44,60 -50,62 -54,67 -57,72 -68,76"),
    // Amérique du Sud
    P("-77.5,8.5 -72,12 -62,10.7 -60,8.5 -52,5 -50,0 -44,-2.5 -35,-5.5 -35,-9 -39,-14 -39,-18 -41,-22 -45,-23.5 -48.5,-26 -49,-29 -53,-34 -57,-35 -57,-38 -62,-39 -65,-41 -64,-43 -67,-46 -66,-48 -69,-51 -68.5,-52.5 -71,-54 -74,-52 -75.5,-47 -73.5,-40 -73.5,-37 -71.5,-30 -70.5,-18 -76,-14 -81,-6 -80.5,-1 -80,2 -77.5,4"),
    // Océanie
    P("114,-22 114,-26 115,-34 118,-35 124,-33.5 129,-31.5 135,-34.5 138,-35 140,-38 146,-39 150,-37 153,-31 153,-25 146,-19 145.5,-15 142.5,-10.7 141,-17 136,-12 131,-11.5 127,-14 123,-17 122,-19"),
    P("172.5,-34.5 175,-37 178,-37.7 175,-41.5 172.7,-40.5"),
    P("95.5,5.5 98,4 104,-1.5 106,-6 101,-3"),
    P("109,1.5 111,1.5 115,5 117,7 119,5 117.5,1 116,-4 111,-3 109,-1"),
    // Îles
    P("-5.7,50 1.4,51.2 1.7,52.7 0,53.5 -1.5,55 -2,57.5 -3.5,58.6 -5,58.6 -6,56.5 -5,55 -3,54.8 -4.5,53.3 -3,53.3 -5,51.7"),
    P("-10,51.7 -6,52 -6,54.5 -8,55.2 -10,54"),
    P("130,31 132,34 135,34 140,35 141,38 141.5,41 140,40 139.5,38 136.5,37 133,35.5 131,34.5"),
    P("140,42 141,45.4 145,43.5 142,42"),
    P("-24,65.5 -22,66.5 -15,66.3 -14,64.5 -19,63.4"),
    P("12.5,38 15.6,38.2 15,36.7"),
    P("8.2,41 9.7,41 9.5,39 8.5,39"),
    P("-180,-72 -120,-74 -60,-72 0,-70 60,-68 120,-66 180,-70 180,-90 -180,-90")
  ];
  var FRANCE=P("2.5,51.1 1.6,50.9 1.6,50.2 1.4,49.9 0.1,49.7 0.2,49.4 -0.2,49.3 -1.2,49.7 -1.9,49.7 -1.6,48.7 -2.7,48.6 -3.6,48.8 -4.7,48.5 -4.3,48 -4.5,47.8 -3,47.5 -2.5,47.3 -2.2,47.1 -1.9,46.7 -1.2,46.2 -1.1,45.6 -1.2,44.7 -1.4,43.5 -1.8,43.4 -0.7,43.2 0.7,42.8 1.7,42.5 3.1,42.45 3,43.1 4,43.5 4.8,43.4 5.4,43.3 6.2,43.1 6.9,43.5 7.5,43.8 7,44.4 6.9,45.1 7.1,45.9 6.8,46.4 6.1,46.2 6.4,46.5 7,47 7.6,47.6 7.6,48.3 8.2,48.97 6.4,49.5 5.8,49.5 4.9,50.1 4.2,49.97 3.6,50.4 2.6,50.8");
  var CORSE=P("8.6,42.3 9.4,42.6 9.5,41.4 9.2,41.4 8.7,41.9");
  function dens(poly,step){
    var o=[],n=poly.length;
    for(var i=0;i<n;i++){
      var a=poly[i],b=poly[(i+1)%n];
      var k=Math.max(1,Math.ceil(Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]))/step));
      for(var j=0;j<k;j++)o.push([a[0]+(b[0]-a[0])*j/k,a[1]+(b[1]-a[1])*j/k]);
    }
    return o;
  }
  WORLD=WORLD.map(function(p){return dens(p,3);});
  FRANCE=dens(FRANCE,.7); CORSE=dens(CORSE,.7);

  
  var W=0,H=0,U=0,dpr=1;
  function size(){
    dpr=Math.min(window.devicePixelRatio||1,1.5);
    W=box.clientWidth||window.innerWidth;H=box.clientHeight||window.innerHeight;
    U=Math.min(W,H*.58);
    cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
  }
  var OG=null,OGr=0,lon0=0,lat0=0,sp0=0,cp0=1,R=100,cx=0,cy=0;
  function setView(a,b,r){lon0=a;lat0=b;sp0=Math.sin(b*D);cp0=Math.cos(b*D);R=r;}
  function proj(lon,lat){
    var f=lat*D,l=(lon-lon0)*D,cf=Math.cos(f);
    var c=sp0*Math.sin(f)+cp0*cf*Math.cos(l);
    var x=cf*Math.sin(l),y=cp0*Math.sin(f)-sp0*cf*Math.cos(l);
    var vis=c>=0;
    if(!vis){var n=Math.hypot(x,y)||1e-6;x/=n;y/=n;}
    return [cx+R*x,cy-R*y,vis];
  }
  function poly(pts,fill,stroke,lw){
    var anyV=false,onS=false,i,p,path=[];
    for(i=0;i<pts.length;i++){p=proj(pts[i][0],pts[i][1]);path.push(p);if(p[2]){anyV=true;if(p[0]>-50&&p[0]<W+50&&p[1]>-50&&p[1]<H+50)onS=true;}}
    if(!anyV)return;
    if(R>U*1.6&&!onS)return;
    ctx.beginPath();
    for(i=0;i<path.length;i++){if(i)ctx.lineTo(path[i][0],path[i][1]);else ctx.moveTo(path[i][0],path[i][1]);}
    ctx.closePath();
    if(fill){ctx.fillStyle=fill;ctx.fill();}
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw||1;ctx.lineJoin="round";ctx.stroke();}
  }
  function graticule(step,alpha){
    ctx.strokeStyle="rgba(160,185,235,"+alpha+")";ctx.lineWidth=1;
    var lo,la,p,prev;
    for(lo=-180;lo<180;lo+=step){
      ctx.beginPath();prev=false;
      for(la=-80;la<=80;la+=8){p=proj(lo,la);if(p[2]){if(prev)ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1]);prev=true;}else prev=false;}
      ctx.stroke();
    }
    for(la=-60;la<=60;la+=step){
      ctx.beginPath();prev=false;
      for(lo=-180;lo<=180;lo+=8){p=proj(lo,la);if(p[2]){if(prev)ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1]);prev=true;}else prev=false;}
      ctx.stroke();
    }
  }
  function clamp(v,a,b){return v<a?a:v>b?b:v;}
  function seg(t,a,b){return clamp((t-a)/(b-a),0,1);}
  function smooth(x){return x*x*x*(x*(x*6-15)+10);}
  function bounce(x){var c1=1.9,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2);}

  // la vraie mascotte Whazup (forme blanche, yeux et bouche bleu nuit)
  var BODY=new Path2D("M0 -78 C -50 -78 -82 -42 -82 -2 C -82 38 -35 70 -10 90 L0 98 L10 90 C 35 70 82 38 82 -2 C 82 -42 50 -78 0 -78 Z");
  var MOUTH=new Path2D("M-28 14 C -16 32 16 32 28 14");
  var WINK=new Path2D("M20 -18 Q26 -12 32 -18");
  function mascot(x,y,s,wink,alpha){
    if(alpha<=0||s<=0)return;
    var k=s/98;
    ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.scale(k,k);ctx.translate(0,-98);
    ctx.translate(0,0);
    ctx.fillStyle="rgba(0,0,0,.22)";ctx.save();ctx.translate(3,6);ctx.fill(BODY);ctx.restore();
    ctx.fillStyle="#fff";ctx.fill(BODY);
    ctx.fillStyle="#14213D";
    ctx.beginPath();ctx.arc(-26,-18,10,0,7);ctx.fill();
    if(wink<.5){ctx.beginPath();ctx.ellipse(26,-18,10,10*(1-wink*1.6),0,0,7);ctx.fill();}
    else{ctx.strokeStyle="#14213D";ctx.lineWidth=5;ctx.lineCap="round";ctx.stroke(WINK);}
    ctx.strokeStyle="#14213D";ctx.lineWidth=7;ctx.lineCap="round";ctx.stroke(MOUTH);
    ctx.restore();
  }
  function winkAmt(t,a){var u=(t-a)/.4;if(u<=0||u>=1)return 0;return u<.3?u/.3:u>.7?(1-u)/.3:1;}

  var T_END=4.4,T_ZOOM0=2.6,T_ZOOM1=3.9,T_FADE=3.55;
  var FR_LON=2.4,FR_LAT=46.6;
  function render(t){
    ctx.setTransform(dpr,0,0,dpr,0,0);
    cx=W/2;cy=H*.47;
    var R0=Math.min(U*.42,H*.31),R1=U*4.2;
    var spin=1-Math.pow(1-seg(t,0,2.0),2);
    var lo=FR_LON-300*(1-spin),la=14+(FR_LAT-3-14)*spin;
    var z=smooth(seg(t,T_ZOOM0,T_ZOOM1));
    var r=R0*Math.pow(R1/R0,z);
    la=la+(FR_LAT-la)*z;
    setView(lo,la,r);
    var g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,"#0B1526");g.addColorStop(1,"#14213D");
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    var starA=1-z;
    if(starA>0){ctx.fillStyle="rgba(255,255,255,"+(.55*starA)+")";
      for(var i=0;i<46;i++){ctx.fillRect((Math.sin(i*91.7)*.5+.5)*W,(Math.sin(i*37.3+2)*.5+.5)*H,1.4,1.4);}
    }
    ctx.save();
    if(r>U*1.6){ctx.fillStyle="#1B3A6E";ctx.fillRect(0,0,W,H);}
    else{
      ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);
      if(!OG||OGr!==Math.round(r)){OG=ctx.createRadialGradient(cx-r*.35,cy-r*.4,r*.1,cx,cy,r);OG.addColorStop(0,"#2A4C86");OG.addColorStop(1,"#16315F");OGr=Math.round(r);}
      ctx.fillStyle=z>.6?"#1B3A6E":OG;ctx.fill();ctx.clip();
    }
    if(z<.35)graticule(30,.12);
    for(var k=0;k<WORLD.length;k++)poly(WORLD[k],"#4A6AA6","rgba(190,208,245,.55)",1);
    poly(FRANCE,"#E8604C","#FFD9D2",Math.max(1,Math.min(3,r/500)));
    poly(CORSE,"#E8604C","#FFD9D2",1.5);
    ctx.restore();
    var lim=1-z;
    if(lim>.01){
      ctx.save();ctx.globalAlpha=lim;
      var hg=ctx.createRadialGradient(cx,cy,r*.96,cx,cy,r*1.12);hg.addColorStop(0,"rgba(120,170,255,.45)");hg.addColorStop(1,"rgba(120,170,255,0)");
      ctx.fillStyle=hg;ctx.beginPath();ctx.arc(cx,cy,r*1.12,0,7);ctx.fill();ctx.restore();
    }
    // logo en haut : "Wha" blanc + "zup" corail, comme l'ancien écran de démarrage
    var bA=seg(t,.25,.9)*(1-seg(t,T_ZOOM0,T_ZOOM0+.5));
    if(bA>0){
      ctx.save();ctx.globalAlpha=bA;
      var fs=Math.round(U*.1);ctx.font="900 "+fs+"px Arial, Helvetica, sans-serif";ctx.textBaseline="middle";
      var w1=ctx.measureText("Wha").width,w2=ctx.measureText("zup").width,x0=W/2-(w1+w2)/2,yy=Math.max(H*.1,70);
      ctx.fillStyle="#fff";ctx.textAlign="left";ctx.fillText("Wha",x0,yy);ctx.fillStyle="#E8604C";ctx.fillText("zup",x0+w1,yy);
      ctx.restore();
    }
    // mascotte sur la France
    var fp=proj(2.4,46.9);
    var pA=seg(t,1.85,2.1),pOut=1-seg(t,T_ZOOM0,T_ZOOM0+.4);
    if(pA>0&&pOut>0){
      var ps=U*.1*bounce(pA),ring=seg(t,1.9,2.5),rr=U*.05+ring*U*.09;
      ctx.strokeStyle="rgba(255,255,255,"+(.6*(1-ring))+")";ctx.lineWidth=2;
      ctx.beginPath();ctx.ellipse(fp[0],fp[1],rr,rr*.4,0,0,7);ctx.stroke();
      mascot(fp[0],fp[1],ps,winkAmt(t,2.2),pOut);
    }
    // fondu final vers l'écran d'accueil (déjà affiché dessous)
    box.style.opacity=t>=T_FADE?String(1-smooth(seg(t,T_FADE,T_END))):"1";
  }

  var speed=.65,raf=0,t0=0,done=false;
  function finish(fast){
    if(done)return;done=true;
    cancelAnimationFrame(raf);
    // si l'ancien écran de démarrage est encore là, on le laisse réapparaître
    if(hideSplash.parentNode)hideSplash.parentNode.removeChild(hideSplash);
    box.style.transition="opacity "+(fast?".3":".5")+"s ease";
    box.style.opacity="0";
    box.style.pointerEvents="none";
    setTimeout(function(){if(box.parentNode)box.parentNode.removeChild(box);},fast?350:600);
  }
  function loop(now){
    var t=(now-t0)/1000*speed;
    if(t>=T_END){render(T_END);finish(false);return;}
    render(t);raf=requestAnimationFrame(loop);
  }
  // l'ancien écran de démarrage réapparaît dès qu'on quitte l'intro : on le rend visible tout de suite
  box.addEventListener("click",function(){finish(true);});
  skip.addEventListener("click",function(e){e.stopPropagation();finish(true);});
  window.addEventListener("resize",size);
  size();
  // on démarre à la prochaine image pour ne pas démarrer l'horloge pendant le chargement du script
  raf=requestAnimationFrame(function(now){t0=now;raf=requestAnimationFrame(loop);});
})();
