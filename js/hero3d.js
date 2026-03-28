/* ============================================================
   js/hero3d.js — Globe 3D 100% responsive
   Desktop : droite du hero
   Tablette : droite, plus petit
   Mobile : centré sous le texte, bien proportionné
============================================================ */
(function () {
  ['hero-3d','hero-3d-bh','hero-3d-center','hero-3d-right','hero-wormhole','hero-globe'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });

  const hero = document.getElementById('hero');
  if (!hero) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'hero-globe';
  canvas.style.cssText = `
    position:absolute;
    pointer-events:none;
    z-index:2;
    opacity:0;
    transition:opacity 1.4s ease;
  `;
  hero.appendChild(canvas);
  setTimeout(() => { canvas.style.opacity = '1'; }, 1600);

  const ct  = canvas.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  let CX, CY, R;

  function setPosition() {
    const hw = window.innerWidth;
    const hh = hero.offsetHeight || window.innerHeight;
    let size, left, top;

    if (hw < 480) {
      // Petit mobile — petit globe centré en bas du hero
      size = Math.min(hw * 0.70, 280);
      left = '50%';
      top  = 'auto';
      canvas.style.bottom = '3rem';
      canvas.style.top    = 'auto';
      canvas.style.left   = '50%';
      canvas.style.transform = 'translateX(-50%)';
    } else if (hw < 768) {
      // Mobile large — globe centré en bas
      size = Math.min(hw * 0.65, 320);
      canvas.style.bottom = '2.5rem';
      canvas.style.top    = 'auto';
      canvas.style.left   = '50%';
      canvas.style.transform = 'translateX(-50%)';
    } else if (hw < 1024) {
      // Tablette — droite, centré verticalement
      size = Math.min(hw * 0.42, 380);
      canvas.style.bottom = 'auto';
      canvas.style.top    = '50%';
      canvas.style.left   = '58%';
      canvas.style.transform = 'translate(-50%, -50%)';
    } else {
      // Desktop
      size = Math.min(hw * 0.40, 520);
      canvas.style.bottom = 'auto';
      canvas.style.top    = '50%';
      canvas.style.left   = '65%';
      canvas.style.transform = 'translate(-50%, -50%)';
    }

    canvas.style.width  = size + 'px';
    canvas.style.height = size + 'px';
    canvas.width  = size * DPR;
    canvas.height = size * DPR;
    CX = canvas.width  / 2;
    CY = canvas.height / 2;
    R  = canvas.width  * 0.33;
  }

  setPosition();
  window.addEventListener('resize', setPosition);

  // Points sphère Fibonacci
  const NPTS = 160;
  const pts3d = Array.from({length: NPTS}, (_, i) => {
    const phi   = Math.acos(1 - 2*(i+0.5)/NPTS);
    const theta = Math.PI * (1+Math.sqrt(5)) * i;
    return {
      x: Math.sin(phi)*Math.cos(theta),
      y: Math.sin(phi)*Math.sin(theta),
      z: Math.cos(phi),
      pulse: Math.random()*Math.PI*2,
      pSpeed: Math.random()*0.02+0.008
    };
  });

  // Connexions
  const connections = [];
  for (let i=0; i<NPTS; i++) for (let j=i+1; j<NPTS; j++) {
    const dx=pts3d[i].x-pts3d[j].x, dy=pts3d[i].y-pts3d[j].y, dz=pts3d[i].z-pts3d[j].z;
    const d = Math.sqrt(dx*dx+dy*dy+dz*dz);
    if (d < 0.54) connections.push([i,j,d]);
  }

  // Orbiteurs
  const orbiters = Array.from({length: 5}, () => ({
    theta: Math.random()*Math.PI*2,
    phi:   Math.random()*Math.PI,
    speed: (0.003+Math.random()*0.004) * (Math.random()>.5?1:-1),
    orbitR: 1.22+Math.random()*0.28,
    size: (1.8+Math.random()*1.8)*DPR,
    trail: []
  }));

  let T=0, mx=0, my=0, rafId=null;

  document.addEventListener('mousemove', e => {
    mx = (e.clientX/(window.innerWidth||900) - .5)*2;
    my = (e.clientY/(window.innerHeight||600) - .5)*2;
  });
  // Touch parallax
  document.addEventListener('touchmove', e => {
    if (e.touches[0]) {
      mx = (e.touches[0].clientX/(window.innerWidth||400) - .5)*2;
      my = (e.touches[0].clientY/(window.innerHeight||700) - .5)*2;
    }
  }, {passive: true});

  function rotY(p,a){return{x:p.x*Math.cos(a)+p.z*Math.sin(a),y:p.y,z:-p.x*Math.sin(a)+p.z*Math.cos(a)};}
  function rotX(p,a){return{x:p.x,y:p.y*Math.cos(a)-p.z*Math.sin(a),z:p.y*Math.sin(a)+p.z*Math.cos(a)};}
  function proj(p){const s=R*1.8/(1.8+p.z*.5);return{sx:CX+p.x*s,sy:CY+p.y*s*.92,z:p.z};}

  function draw() {
    ct.clearRect(0,0,canvas.width,canvas.height);
    const aY = T*0.18+mx*0.25, aX = T*0.07+my*0.15;
    const tr = pts3d.map(p => {
      let r=rotY(p,aY); r=rotX(r,aX);
      r.pulse=p.pulse; r.pSpeed=p.pSpeed; return r;
    });
    const pr = tr.map(p => ({...proj(p), pulse:p.pulse, pSpeed:p.pSpeed}));

    // Glow central
    const g = ct.createRadialGradient(CX,CY,0,CX,CY,R*1.2);
    g.addColorStop(0,'rgba(168,255,62,0.07)');
    g.addColorStop(.5,'rgba(0,229,255,0.03)');
    g.addColorStop(1,'rgba(0,0,0,0)');
    ct.beginPath(); ct.arc(CX,CY,R*1.2,0,Math.PI*2); ct.fillStyle=g; ct.fill();

    // Connexions
    connections.forEach(([i,j,d]) => {
      const a=pr[i], b=pr[j];
      const vis=(tr[i].z+tr[j].z)/2;
      const alpha=(0.03+(vis+1)/2*0.22)*(1-d/0.54);
      if(alpha<0.02) return;
      ct.beginPath(); ct.moveTo(a.sx,a.sy); ct.lineTo(b.sx,b.sy);
      ct.strokeStyle=vis>.2?`rgba(168,255,62,${alpha})`:`rgba(0,229,255,${alpha*.7})`;
      ct.lineWidth=.6*DPR; ct.stroke();
    });

    // Points
    pr.forEach((p,i) => {
      const vis=(tr[i].z+1)/2; if(vis<.05) return;
      const sz=(.8+vis*2.2)*DPR*(0.8+0.2*Math.sin(T*2+p.pulse));
      const al=.15+vis*.85;
      if(vis>.7){
        const gg=ct.createRadialGradient(p.sx,p.sy,0,p.sx,p.sy,sz*4);
        gg.addColorStop(0,`rgba(168,255,62,${al*.5})`); gg.addColorStop(1,'rgba(168,255,62,0)');
        ct.beginPath(); ct.arc(p.sx,p.sy,sz*4,0,Math.PI*2); ct.fillStyle=gg; ct.fill();
      }
      ct.beginPath(); ct.arc(p.sx,p.sy,sz,0,Math.PI*2);
      ct.fillStyle=vis>.5?`rgba(168,255,62,${al})`:`rgba(0,229,255,${al*.6})`;
      ct.fill();
    });

    // Orbiteurs
    orbiters.forEach(o => {
      o.theta+=o.speed;
      let rp={x:Math.sin(o.phi)*Math.cos(o.theta)*o.orbitR,y:Math.cos(o.phi)*o.orbitR*.5,z:Math.sin(o.phi)*Math.sin(o.theta)*o.orbitR};
      rp=rotY(rp,aY); rp=rotX(rp,aX);
      const sp=proj(rp);
      o.trail.push({x:sp.sx,y:sp.sy}); if(o.trail.length>14) o.trail.shift();
      const vis=(rp.z+1)/2; if(vis<.1) return;
      for(let ti=1;ti<o.trail.length;ti++){
        const prog=ti/o.trail.length;
        ct.beginPath(); ct.moveTo(o.trail[ti-1].x,o.trail[ti-1].y); ct.lineTo(o.trail[ti].x,o.trail[ti].y);
        ct.strokeStyle=`rgba(0,229,255,${prog*vis*.4})`; ct.lineWidth=prog*1.5*DPR; ct.stroke();
      }
      const gg=ct.createRadialGradient(sp.sx,sp.sy,0,sp.sx,sp.sy,o.size*3);
      gg.addColorStop(0,`rgba(0,229,255,${vis*.9})`); gg.addColorStop(1,'rgba(0,229,255,0)');
      ct.beginPath(); ct.arc(sp.sx,sp.sy,o.size*3,0,Math.PI*2); ct.fillStyle=gg; ct.fill();
      ct.beginPath(); ct.arc(sp.sx,sp.sy,o.size,0,Math.PI*2);
      ct.fillStyle=`rgba(255,255,255,${vis*.9})`; ct.fill();
    });

    // Anneau équatorial
    ct.beginPath(); let first=true;
    for(let i=0;i<=80;i++){
      const a=i/80*Math.PI*2;
      let rp={x:Math.cos(a)*1.08,y:0,z:Math.sin(a)*1.08};
      rp=rotY(rp,aY); rp=rotX(rp,aX); const sp=proj(rp);
      if(first){ct.moveTo(sp.sx,sp.sy);first=false;}else ct.lineTo(sp.sx,sp.sy);
    }
    ct.strokeStyle='rgba(168,255,62,0.10)'; ct.lineWidth=.5*DPR; ct.stroke();

    T+=0.01;
    rafId=requestAnimationFrame(draw);
  }

  const obs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){if(!rafId)rafId=requestAnimationFrame(draw);}
      else{cancelAnimationFrame(rafId);rafId=null;}
    });
  },{threshold:0.1});
  obs.observe(hero);
})();