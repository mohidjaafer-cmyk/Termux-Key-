const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const restartBtn = document.getElementById('restartBtn');
const scoreDisplay = document.getElementById('score');
const balanceDisplay = document.getElementById('balance');

let player = {x:180, y:500, width:40, height:40, color:'#00e6d4'};
let obstacles = [];
let speed = 2;
let score = 0;
let gameOver = false;
let playerId = 'player_' + Math.floor(Math.random()*1000000);
let vip = false;

function spawnObstacle(){
  let width = Math.random()*60+20;
  obstacles.push({x:Math.random()*(canvas.width-width), y:0, width, height:20, color:'#ff4d4d'});
}
function update(){
  if(gameOver) return;
  // تحريك العقبات
  obstacles.forEach(ob=> ob.y += speed);
  obstacles = obstacles.filter(ob=> ob.y < canvas.height);
  // توليد عقبة جديدة
  if(Math.random()<0.02) spawnObstacle();
  // التحقق من الاصطدام
  obstacles.forEach(ob=>{
    if(player.x < ob.x+ob.width && player.x+player.width > ob.x && player.y < ob.y+ob.height && player.y+player.height > ob.y){
      gameOver=true;
      updateServer(0);
    }
  });
}
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle=player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
  obstacles.forEach(ob=>{
    ctx.fillStyle=ob.color;
    ctx.fillRect(ob.x, ob.y, ob.width, ob.height);
  });
}
function loop(){
  if(!gameOver){
    update();
    draw();
    score++;
    scoreDisplay.innerText = score;
    requestAnimationFrame(loop);
  }
}
function updateServer(increment){
  fetch('/api/update', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:playerId, scoreIncrement:increment})
  }).then(r=>r.json()).then(data=>{
    balanceDisplay.innerText = data.balance.toFixed(2);
  });
}

// تحريك اللاعب بالكيبورد (يمين/يسار)
document.addEventListener('keydown', e=>{
  if(e.key==='ArrowLeft') player.x-=20;
  if(e.key==='ArrowRight') player.x+=20;
});
restartBtn.addEventListener('click', ()=>{
  score=0;
  gameOver=false;
  obstacles=[];
  loop();
});

window.onload = ()=>{
  fetch('/api/player', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:playerId,vip})})
  .then(r=>r.json()).then(data=>{
    balanceDisplay.innerText=data.balance.toFixed(2);
  });
  loop();
};
