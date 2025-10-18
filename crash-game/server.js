const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, 'public')));

// Game state
let round = {
  id: 0,
  phase: 'waiting', // waiting -> betting -> running -> crashed
  multiplier: 1.00,
  crashAt: null,
  timeLeft: 0,
  bets: {} // socketId -> {name, amount, cashedOut:false}
};

const BETTING_SECONDS = 10;
const TICK_MS = 100;

function newRound() {
  round.id++;
  round.phase = 'betting';
  round.multiplier = 1.00;
  round.crashAt = calculateCrash();
  round.timeLeft = BETTING_SECONDS;
  round.bets = {};
  broadcastState();
  // countdown betting
  const betInterval = setInterval(()=>{
    round.timeLeft -= 1;
    if(round.timeLeft <= 0){
      clearInterval(betInterval);
      startRun();
    } else broadcastState();
  }, 1000);
}

function calculateCrash(){
  // simple random crash formula (demo only)
  // produce a multiplier >= 1.00, most small, some big
  const r = Math.random();
  // transform to heavier tail
  const m = Math.max(1.0, +(1 + Math.floor((1/(1-r))*100)/100));
  // cap for demo
  return Math.min(m, 100.00);
}

function startRun(){
  round.phase = 'running';
  round.multiplier = 1.00;
  const start = Date.now();
  const runInterval = setInterval(()=>{
    // increase multiplier exponentially for excitement
    const elapsed = (Date.now() - start) / 1000;
    round.multiplier = +(1 + elapsed * 0.5 + Math.pow(elapsed,1.2)/10).toFixed(2);
    // Check crash
    if(round.multiplier >= round.crashAt){
      round.phase = 'crashed';
      round.multiplier = round.crashAt;
      clearInterval(runInterval);
      // resolve bets: mark losers (if they didn't cashout)
      for(const sid in round.bets){
        const b = round.bets[sid];
        if(!b.cashedOut){
          // lost: nothing awarded (demo)
          io.to(sid).emit('round_result', {win:false, payout:0, balanceChange:0});
        }
      }
      // start next round after short delay
      setTimeout(newRound, 4000);
    } else {
      // broadcast live update
      broadcastState();
    }
  }, TICK_MS);
  broadcastState();
}

function broadcastState(socket){
  const publicBets = Object.values(round.bets).map(b=>({name:b.name, amount:b.amount, cashedOut:b.cashedOut, payout:b.payout||0}));
  const payload = {
    id: round.id,
    phase: round.phase,
    multiplier: round.multiplier,
    crashAt: round.phase === 'crashed' ? round.crashAt : null,
    timeLeft: round.timeLeft,
    bets: publicBets
  };
  if(socket) socket.emit('state', payload);
  else io.emit('state', payload);
}

io.on('connection', socket=>{
  // give socket a demo balance (stored in memory)
  socket.data.balance = 50.00; // demo starting balance
  socket.data.name = 'عشّاق';

  // send current state
  broadcastState(socket);

  socket.on('set_name', name=>{
    socket.data.name = String(name).slice(0,24);
  });

  socket.on('place_bet', data=>{
    const amount = parseFloat(data.amount);
    if(isNaN(amount) || amount <= 0) return socket.emit('error_msg','مبلغ غير صالح');
    if(round.phase !== 'betting') return socket.emit('error_msg','لم يعد مسموحاً بالرهان الآن');
    if(amount > socket.data.balance) return socket.emit('error_msg','رصيدك غير كافٍ');
    // register bet
    socket.data.balance -= amount;
    round.bets[socket.id] = { name: socket.data.name, amount, cashedOut:false, payout:0 };
    broadcastState();
    socket.emit('balance_update', socket.data.balance);
  });

  socket.on('cashout', ()=>{
    if(round.phase !== 'running') return socket.emit('error_msg','لا يمكنك سحب الآن');
    const bet = round.bets[socket.id];
    if(!bet) return socket.emit('error_msg','لم تضع رهاناً');
    if(bet.cashedOut) return socket.emit('error_msg','قد سحبت بالفعل');
    const mult = round.multiplier;
    // payout equals amount * multiplier
    const payout = +(bet.amount * mult).toFixed(2);
    bet.cashedOut = true;
    bet.payout = payout;
    // credit player balance (demo)
    socket.data.balance += payout;
    socket.emit('round_result', { win:true, payout, balanceChange: payout });
    socket.emit('balance_update', socket.data.balance);
    broadcastState();
  });

  socket.on('request_state', ()=> broadcastState(socket));

  socket.on('disconnect', ()=> {
    // remove unresolved bet (refund if betting phase)
    if(round.phase === 'betting' && round.bets[socket.id]){
      socket.data.balance += round.bets[socket.id].amount;
    }
    delete round.bets[socket.id];
    broadcastState();
  });
});

// start first round after server up
server.listen(PORT, ()=> {
  console.log('Server running on http://localhost:' + PORT);
  // create initial round
  setTimeout(newRound, 1000);
});
