const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let score=0,gameOver=false;
const player={x:180,y:500,width:40,height:40,color:'#00e6d4'};
let obstacles=[],speed=2;

// توليد عقبات
function spawnObstacle(){
  const width = Math.random()*40+20;
  obstacles.push({x:Math.random()*(canvas.width-width),y:-50,width,height,color:'#ff4d4d'});
}
setInterval(spawnObstacle,1500);

// تحريك العقبات
function update(){
  obstacles.forEach(o=>o.y+=speed);
  obstacles = obstacles.filter(o=>o.y<canvas.height);
  // التحقق من الاصطدام
  obstacles.forEach(o=>{
    if(player.x < o.x+o.width && player.x+player.width>o.x && player.y<o.y+o.height && player.y+player.height>o.y){
      gameOver=true;
      saveScore();
    }
  });
}

// رسم اللعبة
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle=player.color;
  ctx.fillRect(player.x,player.y,player.width,player.height);
  obstacles.forEach(o=>{ctx.fillStyle=o.color;ctx.fillRect(o.x,o.y,o.width,o.height);});
}

// حلقة اللعبة
function loop(){
  if(!gameOver){
    update();
    draw();
    requestAnimationFrame(loop);
  }
}
loop();

// التحكم باللاعب
document.addEventListener('keydown',e=>{
  if(e.key==='ArrowLeft') player.x-=20;
  if(e.key==='ArrowRight') player.x+=20;
  if(player.x<0) player.x=0;
  if(player.x+player.width>canvas.width) player.x=canvas.width-player.width;
});

// إعادة اللعبة
document.getElementById('restartBtn').addEventListener('click',()=>{
  score=0;gameOver=false;obstacles=[];speed=2;loop();
});

// نقاط والرصيد
function saveScore(){
  const vip = document.getElementById('vipToggle').checked;
  fetch('/api/players',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'player1',score, vip})})
  .then(()=>fetch('/api/players').then(r=>r.json()).then(data=>{
    const playerData = data.find(p=>p.name==='player1');
    document.getElementById('score').innerText=playerData.score;
    document.getElementById('balance').innerText=playerData.balance.toFixed(2);
  }));
}
