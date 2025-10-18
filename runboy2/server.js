const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

const playersFile = path.join(__dirname, 'players.json');
if(!fs.existsSync(playersFile)) fs.writeFileSync(playersFile, '[]');

// إضافة لاعب جديد أو تحميل بياناته
app.post('/api/player', (req,res)=>{
  const {id,vip=false,score=0}=req.body;
  let data = JSON.parse(fs.readFileSync(playersFile));
  let player = data.find(p=>p.id===id);
  if(!player){
    player={id,vip,score, balance:0};
    data.push(player);
  }
  fs.writeFileSync(playersFile, JSON.stringify(data,null,2));
  res.json(player);
});

// تحديث نقاط اللاعب
app.post('/api/update', (req,res)=>{
  const {id,scoreIncrement} = req.body;
  let data = JSON.parse(fs.readFileSync(playersFile));
  let player = data.find(p=>p.id===id);
  if(player){
    player.score += scoreIncrement;
    // تحويل النقاط لرصيد بالدولار
    let multiplier = player.vip ? 0.0001*2 : 0.0001; // مثال
    player.balance = Math.floor(player.score * multiplier * 100)/100;
    fs.writeFileSync(playersFile, JSON.stringify(data,null,2));
    res.json(player);
  } else res.status(404).send('Player not found');
});

app.listen(PORT, ()=>console.log(`Server running on http://localhost:${PORT}`));
