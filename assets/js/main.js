const navToggle=document.querySelector('[data-nav-toggle]');
const navMenu=document.querySelector('[data-nav-menu]');
if(navToggle&&navMenu){
  navToggle.addEventListener('click',()=>{
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    navMenu.classList.toggle('open');
    if(navMenu.classList.contains('open')){
      navMenu.style.display='flex';
      if(!reduceMotion){
        navMenu.style.maxHeight = navMenu.scrollHeight + 'px';
        navMenu.style.opacity = '1';
      }
    }else{
      if(!reduceMotion){
        navMenu.style.maxHeight = '0px';
        navMenu.style.opacity = '0';
        setTimeout(()=>{ navMenu.style.display=''; navMenu.style.maxHeight=''; navMenu.style.opacity=''; }, 320);
      }else{
        navMenu.style.display='';
      }
    }
  });
}

document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    const href=a.getAttribute('href');
    if(href&&href.startsWith('#')){
      const el=document.querySelector(href);
      if(el){
        e.preventDefault();
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.scrollIntoView({behavior: reduceMotion ? 'auto' : 'smooth',block:'start'});
      }
    }
  });
});

const form=document.querySelector('#contact-form');
if(form){
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const data=Object.fromEntries(new FormData(form).entries());
    alert(`Thanks ${data.name||'there'}! We'll reply to ${data.email||'your inbox'} soon.`);
    form.reset();
  });
}

// Reveal-on-scroll using IntersectionObserver
(function(){
  document.documentElement.classList.add('js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const shouldReduce = reduceMotion.matches;
  const targets = document.querySelectorAll('.reveal');
  if(!targets.length) return;
  if(shouldReduce){
    targets.forEach(el=>el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  },{ threshold: 0.12, rootMargin: '0px 0px -10% 0px' });
  targets.forEach(el=>{
    io.observe(el);
    const rect = el.getBoundingClientRect();
    if(rect.top < window.innerHeight && rect.bottom > 0){
      el.classList.add('is-visible');
    }
  });
})();

// Theme toggling with persistence
(function(){
  const THEMES = ['neon','ocean','sunset','forest','light'];
  const root = document.documentElement;
  const saved = localStorage.getItem('theme');
  if(saved){ root.setAttribute('data-theme', saved); }
  function cycleTheme(){
    const current = root.getAttribute('data-theme') || THEMES[0];
    const idx = THEMES.indexOf(current);
    const next = THEMES[(idx + 1) % THEMES.length];
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    const btn = document.querySelector('[data-theme-toggle]');
    if(btn){ btn.textContent = `Theme: ${next}`; }
  }
  const btn = document.querySelector('[data-theme-toggle]');
  if(btn){
    const initial = root.getAttribute('data-theme') || THEMES[0];
    btn.textContent = `Theme: ${initial}`;
    btn.addEventListener('click', cycleTheme);
  }
})();

// Mini-game (runs only if #miniGame exists)
(function(){
  const canvas = document.getElementById('miniGame');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('miniScore');
  const startBtn = document.getElementById('miniStartBtn');
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const W = canvas.width;
  const H = canvas.height;
  let rafId = null;
  let running = false;
  let last = 0;
  let score = 0;

  const player = { x: 24, y: H/2, r: 10, vy: 0 };
  const keys = { up:false, down:false };
  const orbs = [];
  const spikes = [];

  function reset(){
    score = 0;
    scoreEl.textContent = '0';
    player.y = H/2; player.vy = 0;
    orbs.length = 0; spikes.length = 0;
    spawnTimers.orb = 0; spawnTimers.spike = 0;
  }

  const spawnTimers = { orb:0, spike:0 };

  function spawnOrb(){
    orbs.push({ x: W+10, y: 20 + Math.random()*(H-40), r: 6 + Math.random()*4, vx: 2.2 });
  }
  function spawnSpike(){
    const h = 12 + Math.random()*22;
    spikes.push({ x: W+10, y: H - h, w: 12, h, vx: 2.6 });
  }

  function update(dt){
    // gravity-like vertical motion
    if(keys.up) player.vy -= 0.15; if(keys.down) player.vy += 0.15;
    player.vy *= 0.98; player.y += player.vy; if(player.y < 10) player.y = 10; if(player.y > H-10) player.y = H-10;

    // orbs
    for(let i=orbs.length-1;i>=0;i--){
      const o = orbs[i]; o.x -= o.vx;
      if(dist(player.x,player.y,o.x,o.y) < player.r + o.r){
        score += 10; scoreEl.textContent = String(score); orbs.splice(i,1); continue;
      }
      if(o.x < -20) orbs.splice(i,1);
    }

    // spikes
    for(let i=spikes.length-1;i>=0;i--){
      const s = spikes[i]; s.x -= s.vx;
      if(circleRectCollide(player.x,player.y,player.r,s.x,s.y,s.w,s.h)){
        gameOver(); return;
      }
      if(s.x < -20) spikes.splice(i,1);
    }

    // spawn
    spawnTimers.orb += dt; spawnTimers.spike += dt;
    if(spawnTimers.orb > 900){ spawnOrb(); spawnTimers.orb = 0; }
    if(spawnTimers.spike > 1400){ spawnSpike(); spawnTimers.spike = 0; }
  }

  function render(){
    ctx.clearRect(0,0,W,H);
    // subtle grid bg
    ctx.globalAlpha = 0.15; ctx.strokeStyle = '#ffffff10';
    for(let x=0;x<W;x+=24){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for(let y=0;y<H;y+=24){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    ctx.globalAlpha = 1;
    // player
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--highlight').trim() || '#4fd1c5';
    ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI*2); ctx.fill();
    // orbs
    ctx.fillStyle = '#ffd166';
    orbs.forEach(o=>{ ctx.beginPath(); ctx.arc(o.x,o.y,o.r,0,Math.PI*2); ctx.fill(); });
    // spikes
    ctx.fillStyle = '#ff4d6d';
    spikes.forEach(s=>{ ctx.fillRect(s.x, s.y, s.w, s.h); });
  }

  function loop(ts){
    if(!running) return;
    const dt = Math.min(50, ts - last);
    last = ts;
    if(!reduceMotion){ update(dt); render(); }
    else { // reduced motion: slower updates, no bg grid
      update(dt*0.5); render();
    }
    rafId = requestAnimationFrame(loop);
  }

  function start(){
    reset(); running = true; startBtn.textContent = 'PAUSE'; last = performance.now();
    cancelAnimationFrame(rafId); rafId = requestAnimationFrame(loop);
  }
  function pause(){ running = false; startBtn.textContent = 'START'; cancelAnimationFrame(rafId); }
  function gameOver(){ pause(); startBtn.textContent = 'RETRY'; }

  function dist(x1,y1,x2,y2){ const dx=x1-x2, dy=y1-y2; return Math.hypot(dx,dy); }
  function circleRectCollide(cx,cy,cr,rx,ry,rw,rh){
    const closestX = Math.max(rx, Math.min(cx, rx+rw));
    const closestY = Math.max(ry, Math.min(cy, ry+rh));
    const dx = cx - closestX, dy = cy - closestY;
    return (dx*dx + dy*dy) <= cr*cr;
  }

  startBtn.addEventListener('click', ()=>{ running ? pause() : start(); });
  document.addEventListener('keydown', e=>{ if(e.key==='ArrowUp' || e.key==='w') keys.up=true; if(e.key==='ArrowDown'|| e.key==='s') keys.down=true; });
  document.addEventListener('keyup', e=>{ if(e.key==='ArrowUp' || e.key==='w') keys.up=false; if(e.key==='ArrowDown'|| e.key==='s') keys.down=false; });
  window.addEventListener('blur', ()=>{ if(running){ pause(); }});
})();

(function(){
  const path=window.location.pathname;
  const isHome=/(^\/$|index\.html$)/.test(path);
  if(!isHome)return;
  if(sessionStorage.getItem('sl_age_shown')==='1')return;
  sessionStorage.setItem('sl_age_shown','1');

  const bd=document.createElement('div');
  bd.className='modal-backdrop';
  bd.innerHTML=`<div class="modal">
    <h3>Policy Notice</h3>
    <p>Please confirm to continue.</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn" id="age-yes">Yes</button>
      <button class="btn ghost" id="age-no">No</button>
    </div>
  </div>`;
  document.body.appendChild(bd);
  bd.style.display='flex';

  function close(){
    bd.style.display='none';
    bd.remove();
  }

  const yes=bd.querySelector('#age-yes');
  const no=bd.querySelector('#age-no');
  if(yes) yes.addEventListener('click',close);
  if(no) no.addEventListener('click',close);
})();
(function(){
  const path=window.location.pathname;
  const isHome=/(^\/$|lander\.html$)/.test(path);
  if(!isHome)return;
  if(sessionStorage.getItem('sl_age_shown')==='1')return;
  sessionStorage.setItem('sl_age_shown','1');

  const bd=document.createElement('div');
  bd.className='modal-backdrop';
  bd.innerHTML=`<div class="modal">
    <h3>Policy Notice</h3>
    <p>Please confirm to continue.</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn" id="age-yes">Yes</button>
      <button class="btn ghost" id="age-no">No</button>
    </div>
  </div>`;
  document.body.appendChild(bd);
  bd.style.display='flex';

  function close(){
    bd.style.display='none';
    bd.remove();
  }

  const yes=bd.querySelector('#age-yes');
  const no=bd.querySelector('#age-no');
  if(yes) yes.addEventListener('click',close);
  if(no) no.addEventListener('click',close);
})();
