const canvas=document.getElementById('gameCanvas');
const ctx=canvas.getContext('2d');
let player={x:180,y:500,width:40,height:40,color:'#00e6d4'};
let obstacles=[],speed=2,score=0,gameOver=false;

// توليد العقبات
function spawnObstacle(){
  const width=Math.random()*40+20;
  obstacles.push({x:Math.random()*(canvas.width-width),y:-50,width,height:20,color:'#ff4d4d'});
}
setInterval(spawnObstacle,1500);

// تحريك العقبات والتحقق من الاصطدام
function update(){
  obstacles.forEach(o=>o.y+=speed);
  obstacles=obstacles.filter(o=>o.y<canvas.height);
  obstacles.forEach(o=>{
    if(player.x<o.x+o.width && player.x+player.width>o.x && player.y<o.y+o.height && player.y+player.height>o.y){
      gameOver=true;
      alert('انتهت اللعبة! نقاطك: '+score);
    }
  });
  if(!gameOver) score++;
  document.getElementById('score').innerText=score;
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

// التحكم بالكرة بالسحب باللمس
let touchStartX=null;
canvas.addEventListener('touchstart',e=>{
  const touch=e.touches[0];
  if(touch.clientX>=player.x && touch.clientX<=player.x+player.width &&
     touch.clientY>=player.y && touch.clientY<=player.y+player.height){
    touchStartX=touch.clientX;
  }
});
canvas.addEventListener('touchmove',e=>{
  if(touchStartX!==null){
    const touch=e.touches[0];
    let dx=touch.clientX-touchStartX;
    player.x+=dx;
    if(player.x<0) player.x=0;
    if(player.x+player.width>canvas.width) player.x=canvas.width-player.width;
    touchStartX=touch.clientX;
  }
});
canvas.addEventListener('touchend',()=>{touchStartX=null;});

// إعادة اللعبة
document.getElementById('restartBtn').addEventListener('click',()=>{
  score=0;gameOver=false;obstacles=[];speed=2;loop();
});
