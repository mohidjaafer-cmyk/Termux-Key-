const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let score = 0;
let balance = 0;
let attempts = 0;
let gameOver = false;
let speed = 2;
let vip = false;

// الكرة
const ball = {x:180, y:500, radius:20, color:'#00e6d4'};

// العقبة (جدار)
let wall = {x:Math.random()*360, y:0, width:40, height:20, color:'#ff4d4d'};

// تحريك الكرة
document.addEventListener('keydown', e=>{
  if(e.key==='ArrowLeft') ball.x-=20;
  if(e.key==='ArrowRight') ball.x+=20;
  if(ball.x<0) ball.x=0;
  if(ball.x+ball.radius*2>canvas.width) ball.x=canvas.width-ball.radius*2;
});

// توليد حركة الجدار
function update(){
  wall.y += speed;
  if(wall.y > canvas.height){
    wall.y = 0;
    wall.x = Math.random()*(canvas.width-wall.width);
    score++;
    speed += 0.1; // زيادة السرعة تدريجياً
  }
  if(ball.x < wall.x + wall.width && ball.x + ball.radius*2 > wall.x &&
     ball.y < wall.y + wall.height && ball.y + ball.radius*2 > wall.y){
    gameOver = true;
    attempts++;
    if(attempts < 2 || vip) saveScore();
    else alert('للاستمرار اشترك VIP!');
  }
}

// رسم الكرة والجدار
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = ball.color;
  ctx.beginPath();
  ctx.arc(ball.x+ball.radius, ball.y+ball.radius, ball.radius, 0, Math.PI*2);
  ctx.fill();

  ctx.fillStyle = wall.color;
  ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
}

// حلقة اللعبة
function loop(){
  if(!gameOver){
    update();
    draw();
    requestAnimationFrame(loop);
  }
}
document.getElementById('restartBtn').addEventListener('click', ()=>{
  if(attempts>=2 && !vip){
    alert('اشتراك VIP مطلوب للعب مجدداً!');
    return;
  }
  score=0;gameOver=false;wall.y=0;speed=2;loop();
});

// حفظ النقاط والرصيد
function saveScore(){
  vip = document.getElementById('vipToggle').checked;
  const factor = vip ? 2 : 1;
  balance += (score/10000)*0.1*factor;
  document.getElementById('score').innerText = score;
  document.getElementById('balance').innerText = balance.toFixed(2);
}
