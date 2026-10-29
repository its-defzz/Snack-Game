const starsEl=document.getElementById('stars');
for(let i=0;i<40;i++){
  const s=document.createElement('div'); s.className='star';
  s.style.left=Math.random()*100+'%'; s.style.top=Math.random()*100+'%';
  s.style.width=s.style.height=(Math.random()*3+1)+'px';
  s.style.animationDelay=Math.random()*2+'s'; starsEl.appendChild(s);
}

const canvas=document.getElementById('game'), ctx=canvas.getContext('2d');
const grid=20, tile=20;
let snake, dir, nextDir, food, score, high=localStorage.getItem('snakeHigh')||0, level, speed, loopId, playing=false;

let audioCtx, musicOn=true, musicInterval, isAudioInit=false;
function initAudio(){
  if(isAudioInit) return;
  audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  isAudioInit=true;
}
function playTone(freq, dur, type='sine', vol=0.15){
  if(!audioCtx || !musicOn) return;
  const o=audioCtx.createOscillator(), g=audioCtx.createGain();
  o.type=type; o.frequency.value=freq; o.connect(g); g.connect(audioCtx.destination);
  g.gain.setValueAtTime(vol, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+dur);
  o.start(); o.stop(audioCtx.currentTime+dur);
}
function playEat(){ playTone(880,0.15,'sine',0.25); setTimeout(()=>playTone(1320,0.2,'sine',0.25),80); }
function playGameOver(){ playTone(220,0.5,'sawtooth',0.2); setTimeout(()=>playTone(110,0.8,'sawtooth',0.2),200); }
function playMove(){ playTone(400,0.05,'square',0.04); }

function startHappyMusic(){
  if(!musicOn || !audioCtx) return;
  clearInterval(musicInterval);
  const melody=[262,294,330,349,392,392,440,440,440,392,330,330,349,294,262,294,330,349,392,440,523,392,330];
  let idx=0;
  musicInterval=setInterval(()=>{
    if(!musicOn) return;
    playTone(melody[idx%melody.length],0.35, idx%4==0?'triangle':'sine', 0.08);
    idx++;
  },320);
}
function toggleMusic(){
  initAudio();
  musicOn=!musicOn;
  document.getElementById('musicBtn').textContent=musicOn?'🎵 Musik ON':'🔇 Musik OFF';
  document.getElementById('musicBtn').classList.toggle('muted',!musicOn);
  if(musicOn) startHappyMusic(); else clearInterval(musicInterval);
  if(musicOn && audioCtx.state==='suspended') audioCtx.resume();
}

document.getElementById('high').textContent=high;

function reset(){
  snake=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];
  dir={x:1,y:0}; nextDir={x:1,y:0};
  placeFood(); score=0; level=1; speed=110;
  updateUI();
}
function placeFood(){
  do{ food={x:Math.floor(Math.random()*grid), y:Math.floor(Math.random()*grid)}; }
  while(snake.some(s=>s.x===food.x&&s.y===food.y));
}
function updateUI(){
  document.getElementById('score').textContent=score;
  document.getElementById('level').textContent=level;
  document.getElementById('high').textContent=high;
}
function setDir(x,y){
  if(!playing) return;
  if(dir.x===-x && dir.y===-y) return;
  nextDir={x,y};
  playMove();
}
function gameLoop(){
  dir=nextDir;
  const head={x:snake[0].x+dir.x, y:snake[0].y+dir.y};
  if(head.x<0) head.x=grid-1; if(head.x>=grid) head.x=0;
  if(head.y<0) head.y=grid-1; if(head.y>=grid) head.y=0;
  if(snake.some(s=>s.x===head.x&&s.y===head.y)){
    gameOver(); return;
  }
  snake.unshift(head);
  if(head.x===food.x && head.y===food.y){
    score+=10;
    if(score>high){high=score; localStorage.setItem('snakeHigh',high);}
    if(score%50===0){level++; speed=Math.max(50,speed-10); clearInterval(loopId); loopId=setInterval(gameLoop,speed);}
    placeFood(); playEat();
  }else snake.pop();
  draw(); updateUI();
}
function draw(){
  ctx.clearRect(0,0,400,400);
  ctx.font='18px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('🍎', food.x*tile+10, food.y*tile+12);
  snake.forEach((seg,i)=>{
    if(i===0){
      ctx.fillStyle='#5a2a83';
      ctx.beginPath(); ctx.roundRect(seg.x*tile+1, seg.y*tile+1, 18, 18, 6); ctx.fill();
      ctx.fillStyle='white'; ctx.beginPath(); ctx.arc(seg.x*tile+7, seg.y*tile+7, 3, 0, Math.PI*2); ctx.arc(seg.x*tile+13, seg.y*tile+7, 3, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle='black'; ctx.beginPath(); ctx.arc(seg.x*tile+7, seg.y*tile+8,1.2,0,Math.PI*2); ctx.arc(seg.x*tile+13, seg.y*tile+8,1.2,0,Math.PI*2); ctx.fill();
    }else{
      const alpha=1 - i/snake.length*0.5;
      ctx.fillStyle=`rgba(139,92,246,${alpha})`;
      ctx.beginPath(); ctx.roundRect(seg.x*tile+2, seg.y*tile+2, 16, 16, 5); ctx.fill();
    }
  });
}
function startGame(){
  initAudio(); if(audioCtx && audioCtx.state==='suspended') audioCtx.resume();
  reset(); playing=true;
  document.getElementById('overlay').classList.add('hidden');
  clearInterval(loopId); loopId=setInterval(gameLoop,speed);
  if(musicOn) startHappyMusic();
  draw();
}
function gameOver(){
  playing=false; clearInterval(loopId); clearInterval(musicInterval); playGameOver();
  document.getElementById('ovTitle').textContent='Game Over! 😵';
  document.getElementById('ovMsg').textContent=`Skor kamu ${score} | High ${high}`;
  document.getElementById('overlay').classList.remove('hidden');
}
window.addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  if(k==='arrowup'||k==='w') setDir(0,-1);
  if(k==='arrowdown'||k==='s') setDir(0,1);
  if(k==='arrowleft'||k==='a') setDir(-1,0);
  if(k==='arrowright'||k==='d') setDir(1,0);
  if(k===' ') {e.preventDefault(); if(!playing) startGame();}
});
draw();