/* cube.js — Sphère holographique About — NOM: IYAD HADJOUR */
(function () {
  const canvas = document.getElementById('cube-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = 420, H = 420, CX = W/2, CY = H/2, R = 105;
  canvas.width = W; canvas.height = H;
  let angle = 0, rafId = null;

  function draw(t) {
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = '#050505';
    ctx.fillRect(0,0,W,H);

    // Grille de fond
    ctx.strokeStyle = 'rgba(168,255,62,0.04)';
    ctx.lineWidth = 0.5;
    for(let i=0;i<W;i+=24){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,H);ctx.stroke();}
    for(let i=0;i<H;i+=24){ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(W,i);ctx.stroke();}

    // Glow externe
    const glowGrad = ctx.createRadialGradient(CX,CY,R*0.7,CX,CY,R*2.2);
    glowGrad.addColorStop(0,'rgba(168,255,62,0.07)');
    glowGrad.addColorStop(0.5,'rgba(0,229,255,0.03)');
    glowGrad.addColorStop(1,'rgba(0,0,0,0)');
    ctx.beginPath();ctx.arc(CX,CY,R*2.2,0,Math.PI*2);ctx.fillStyle=glowGrad;ctx.fill();

    // Anneaux arrière
    drawRings(t,'back');

    // Corps sphère
    const grad = ctx.createRadialGradient(CX-R*0.35,CY-R*0.35,R*0.05,CX,CY,R);
    grad.addColorStop(0,'rgba(35,70,35,0.95)');
    grad.addColorStop(0.4,'rgba(12,35,15,0.98)');
    grad.addColorStop(1,'rgba(2,8,3,1.0)');
    ctx.beginPath();ctx.arc(CX,CY,R,0,Math.PI*2);ctx.fillStyle=grad;ctx.fill();

    // Latitudes
    ctx.save();
    ctx.beginPath();ctx.arc(CX,CY,R-0.5,0,Math.PI*2);ctx.clip();
    for(let i=1;i<10;i++){
      const y=CY-R+(i/10)*R*2;
      const hw=Math.sqrt(Math.max(0,R*R-(y-CY)*(y-CY)));
      ctx.beginPath();ctx.ellipse(CX,y,hw,hw*0.22,0,0,Math.PI*2);
      ctx.strokeStyle=`rgba(168,255,62,${0.07+0.04*Math.sin(t*0.6+i*0.4)})`;
      ctx.lineWidth=0.6;ctx.stroke();
    }
    for(let i=0;i<7;i++){
      const a=(i/7)*Math.PI*2+t*0.25;
      const scX=Math.abs(Math.cos(a));
      if(scX<0.05)continue;
      ctx.beginPath();ctx.ellipse(CX,CY,scX*R,R,0,0,Math.PI*2);
      ctx.strokeStyle=`rgba(0,229,255,${scX*0.07})`;ctx.lineWidth=0.5;ctx.stroke();
    }
    ctx.restore();

    // Spéculaire
    const specGrad=ctx.createRadialGradient(CX-R*0.4,CY-R*0.38,0,CX-R*0.15,CY-R*0.15,R*0.6);
    specGrad.addColorStop(0,'rgba(168,255,62,0.20)');
    specGrad.addColorStop(0.5,'rgba(168,255,62,0.06)');
    specGrad.addColorStop(1,'rgba(0,0,0,0)');
    ctx.beginPath();ctx.arc(CX,CY,R,0,Math.PI*2);ctx.fillStyle=specGrad;ctx.fill();

    // Atmosphère
    const atmGrad=ctx.createRadialGradient(CX,CY,R*0.86,CX,CY,R*1.10);
    atmGrad.addColorStop(0,'rgba(0,229,255,0)');
    atmGrad.addColorStop(0.6,'rgba(0,229,255,0.10)');
    atmGrad.addColorStop(1,'rgba(0,229,255,0)');
    ctx.beginPath();ctx.arc(CX,CY,R*1.10,0,Math.PI*2);ctx.fillStyle=atmGrad;ctx.fill();

    // Ombre
    const shadowGrad=ctx.createRadialGradient(CX+R*0.28,CY+R*0.28,0,CX,CY,R);
    shadowGrad.addColorStop(0,'rgba(0,0,0,0)');
    shadowGrad.addColorStop(0.4,'rgba(0,0,0,0.3)');
    shadowGrad.addColorStop(1,'rgba(0,0,0,0.72)');
    ctx.beginPath();ctx.arc(CX,CY,R,0,Math.PI*2);ctx.fillStyle=shadowGrad;ctx.fill();

    // Contour
    ctx.beginPath();ctx.arc(CX,CY,R,0,Math.PI*2);
    ctx.strokeStyle='rgba(168,255,62,0.22)';ctx.lineWidth=1;ctx.stroke();

    // Anneaux avant
    drawRings(t,'front');

    // Lune
    drawMoon(t);

    // Particules
    drawParticles(t);

    // HUD
    ctx.font='bold 11px "Space Mono",monospace';
    ctx.textAlign='center';
    ctx.fillStyle='rgba(168,255,62,0.9)';
    ctx.fillText('IYAD HADJOUR', CX, CY+4);
    ctx.font='8px "Space Mono",monospace';
    ctx.fillStyle='rgba(255,255,255,0.28)';
    ctx.fillText('WEB DEV — PARIS', CX, CY+18);

    ctx.font='7px "Space Mono",monospace';
    ctx.textAlign='left';
    ctx.fillStyle='rgba(0,229,255,0.38)';
    ctx.fillText(`LAT ${(Math.sin(t*0.3)*45).toFixed(1)}°`, 8, 15);
    ctx.fillText(`LON ${((t*18)%360).toFixed(1)}°`, 8, 27);

    ctx.textAlign='right';
    ctx.fillStyle='rgba(168,255,62,0.45)';
    ctx.fillText('OPEN TO WORK', W-8, H-8);

    // Scan line
    const scanY=((t*28)%H);
    const scanGrad=ctx.createLinearGradient(0,scanY-12,0,scanY+12);
    scanGrad.addColorStop(0,'rgba(168,255,62,0)');
    scanGrad.addColorStop(0.5,'rgba(168,255,62,0.05)');
    scanGrad.addColorStop(1,'rgba(168,255,62,0)');
    ctx.fillStyle=scanGrad;ctx.fillRect(0,scanY-12,W,24);

    // Coins HUD
    [[0,0,1,1],[W,0,-1,1],[W,H,-1,-1],[0,H,1,-1]].forEach(([cx2,cy2,sx,sy])=>{
      const cs=14;
      ctx.strokeStyle='rgba(168,255,62,0.28)';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(cx2+sx*cs,cy2);ctx.lineTo(cx2,cy2);ctx.lineTo(cx2,cy2+sy*cs);ctx.stroke();
    });

    ctx.save();ctx.setLineDash([2,5]);
    ctx.strokeStyle='rgba(168,255,62,0.12)';ctx.lineWidth=0.5;
    ctx.beginPath();ctx.moveTo(0,CY);ctx.lineTo(W,CY);ctx.stroke();
    ctx.beginPath();ctx.moveTo(CX,0);ctx.lineTo(CX,H);ctx.stroke();
    ctx.restore();
  }

  function drawRings(t,side){
    const rings=[
      {rx:R*1.42,ry:R*0.26,color:'rgba(168,255,62,',lw:3.5,alpha:0.18},
      {rx:R*1.62,ry:R*0.30,color:'rgba(0,229,255,',lw:1.8,alpha:0.11},
      {rx:R*1.80,ry:R*0.33,color:'rgba(168,255,62,',lw:1.2,alpha:0.07},
    ];
    rings.forEach((ring,ri)=>{
      const sA=side==='back'?Math.PI:0;
      const eA=side==='back'?Math.PI*2:Math.PI;
      const a=ring.alpha+0.04*Math.sin(t*0.5+ri);
      const grd=ctx.createLinearGradient(CX-ring.rx,CY,CX+ring.rx,CY);
      grd.addColorStop(0,ring.color+(a*0.4)+')');
      grd.addColorStop(0.4,ring.color+a+')');
      grd.addColorStop(0.6,ring.color+(a*0.7)+')');
      grd.addColorStop(1,ring.color+(a*0.4)+')');
      ctx.beginPath();ctx.ellipse(CX,CY,ring.rx,ring.ry,0,sA,eA);
      ctx.strokeStyle=grd;ctx.lineWidth=ring.lw;ctx.stroke();
    });
  }

  function drawMoon(t){
    const orbitRx=R*1.68,orbitRy=R*0.30;
    const ma=t*0.55;
    const mx2=CX+Math.cos(ma)*orbitRx;
    const my2=CY+Math.sin(ma)*orbitRy;
    const mr=9;
    const moonGlow=ctx.createRadialGradient(mx2,my2,0,mx2,my2,mr*2.8);
    moonGlow.addColorStop(0,'rgba(0,229,255,0.12)');moonGlow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.beginPath();ctx.arc(mx2,my2,mr*2.8,0,Math.PI*2);ctx.fillStyle=moonGlow;ctx.fill();
    const moonGrad=ctx.createRadialGradient(mx2-mr*0.3,my2-mr*0.3,0,mx2,my2,mr);
    moonGrad.addColorStop(0,'rgba(0,229,255,0.7)');moonGrad.addColorStop(1,'rgba(0,60,90,0.95)');
    ctx.beginPath();ctx.arc(mx2,my2,mr,0,Math.PI*2);ctx.fillStyle=moonGrad;ctx.fill();
    ctx.strokeStyle='rgba(0,229,255,0.55)';ctx.lineWidth=0.8;ctx.stroke();
  }

  function drawParticles(t){
    for(let i=0;i<18;i++){
      const fi=i*1.618;
      const pa=fi*2.4+t*0.18;
      const pr2=R*(1.25+0.6*Math.abs(Math.sin(fi*3.1)));
      const px=CX+Math.cos(pa)*pr2;
      const py=CY+Math.sin(pa)*pr2*0.38;
      const ps=0.8+0.6*Math.abs(Math.sin(t+fi));
      const pa2=0.15+0.15*Math.abs(Math.sin(t*0.9+fi*1.7));
      if(pr2>R+8){
        ctx.beginPath();ctx.arc(px,py,ps,0,Math.PI*2);
        ctx.fillStyle=i%2===0?`rgba(168,255,62,${pa2})`:`rgba(0,229,255,${pa2})`;
        ctx.fill();
      }
    }
  }

  function animate(ts){
    angle=ts*0.001;draw(angle);rafId=requestAnimationFrame(animate);
  }

  const observer=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){if(!rafId)rafId=requestAnimationFrame(animate);}
      else{cancelAnimationFrame(rafId);rafId=null;}
    });
  },{threshold:0.1});

  const aboutSection=document.getElementById('about');
  if(aboutSection)observer.observe(aboutSection);
  else rafId=requestAnimationFrame(animate);
})();