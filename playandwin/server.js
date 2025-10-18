const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

const dataFile = path.join(__dirname, 'data.json');
if(!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify({players:[]}, null, 2));

function saveData(data){ fs.writeFileSync(dataFile, JSON.stringify(data,null,2)); }
function loadData(){ return JSON.parse(fs.readFileSync(dataFile)); }

// نقاط اللاعبين وتسجيل VIP
app.get('/api/players',(req,res)=>{ res.json(loadData().players); });
app.post('/api/players',(req,res)=>{
  const {name,score,vip} = req.body;
  if(!name || score == null) return res.status(400).send('Invalid');
  const data = loadData();
  let player = data.players.find(p=>p.name===name);
  if(!player){
    player = {name,score:0,vip:false,balance:0};
    data.players.push(player);
  }
  player.score += score;
  if(vip) player.vip = true;
  // حساب الرصيد لكل نقاط (مثال: 10k = 0.1$)
  let factor = player.vip ? 2 : 1;
  player.balance += (score/10000)*0.1*factor;
  saveData(data);
  res.send('OK');
});

app.listen(PORT,()=>console.log(`Server running on http://localhost:${PORT}`));
