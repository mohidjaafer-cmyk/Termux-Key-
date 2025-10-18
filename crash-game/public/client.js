const socket = io();
const balanceEl = document.getElementById('balance');
const phaseEl = document.getElementById('phase');
const multEl = document.getElementById('mult');
const timeleftEl = document.getElementById('timeleft');
const betsEl = document.getElementById('bets');
const logEl = document.getElementById('log');
const betAmt = document.getElementById('betAmt');
const placeBtn = document.getElementById('placeBtn');
const cashBtn = document.getElementById('cashBtn');
const nameInput = document.getElementById('name');

let myBet = null;

function log(msg){ const d = document.createElement('div'); d.textContent = msg; logEl.prepend(d); }

socket.on('connect', ()=> {
  socket.emit('request_state');
  socket.on('balance_update', b=> balanceEl.innerText = parseFloat(b).toFixed(2));
});

socket.on('state', s=>{
  phaseEl.innerText = s.phase;
  multEl.innerText = (s.multiplier).toFixed(2) + 'x';
  timeleftEl.innerText = s.timeLeft ? 'وقت الرهان: ' + s.timeLeft + 's' : '';
  // bets
  betsEl.innerHTML = '';
  s.bets.forEach(b=>{
    const li = document.createElement('li');
    li.textContent = b.name + ' • ' + b.amount + (b.cashedOut ? ' • مسحوب' : '');
    betsEl.appendChild(li);
  });
  // enable/disable buttons
  if(s.phase === 'betting'){ placeBtn.disabled = false; cashBtn.disabled = true; }
  else if(s.phase === 'running'){ placeBtn.disabled = true; cashBtn.disabled = myBet ? false : true; }
  else { placeBtn.disabled = true; cashBtn.disabled = true; }
});

socket.on('round_result', r=>{
  if(r.win) log('فزت! المبلغ المردود: ' + r.payout.toFixed(2));
  else log('خسرت رهانك.');
});

socket.on('error_msg', m=> log('خطأ: ' + m));
socket.on('balance_update', b=> balanceEl.innerText = parseFloat(b).toFixed(2));

placeBtn.addEventListener('click', ()=>{
  const amt = parseFloat(betAmt.value);
  if(!amt || amt <= 0){ alert('ضع مبلغاً صالحاً'); return; }
  socket.emit('place_bet', { amount: amt });
  myBet = amt;
  log('وضعت رهان: ' + amt);
});

cashBtn.addEventListener('click', ()=>{
  socket.emit('cashout');
  myBet = null;
  cashBtn.disabled = true;
  log('طلب سحب...');
});

nameInput.addEventListener('change', ()=> socket.emit('set_name', nameInput.value));
