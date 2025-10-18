const { Telegraf } = require('telegraf');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const BOT_TOKEN = '8396455619:AAGrEsqHVA4l6fU8I_TKCV0XjbqVIBR2uP0';
const bot = new Telegraf(BOT_TOKEN);

const adapter = new FileSync('db.json');
const db = low(adapter);
db.defaults({ players: [], bets: {}, ownerBalance: 0, round: { running:false } }).write();

// دوال مساعدة
function getPlayer(id){
  let p = db.get('players').find({ id: String(id) }).value();
  if(!p){
    db.get('players').push({ id: String(id), balance: 0 }).write();
    p = db.get('players').find({ id: String(id) }).value();
  }
  return p;
}
function setPlayerBalance(id, amount){
  db.get('players').find({ id: String(id) }).assign({ balance: amount }).write();
}

// حالة الجولة
let interval = null;
function startRoundPublic(ctx){
  const round = db.get('round').value();
  if(round.running) return ctx.reply('🔁 جولة بالفعل شغّالة الآن.');
  const crashAt = (Math.random()*9+1);
  db.set('round', { running: true, multiplier:1.0, crashAt: parseFloat(crashAt.toFixed(2)), startedAt: Date.now(), chatId: ctx.chat.id }).write();
  db.set('bets', {}).write();
  ctx.reply(`🚀 جولة جديدة بدأت! ارفع رهانك الآن باستخدام /bet <amount>`);
  interval = setInterval(()=>{
    const r = db.get('round').value();
    if(!r.running){ clearInterval(interval); interval=null; return; }
    r.multiplier = parseFloat((r.multiplier*1.08).toFixed(2));
    db.set('round.multiplier', r.multiplier).write();
    if(r.multiplier >= r.crashAt){
      db.set('round.running', false).write();
      const bets = db.get('bets').value()||{};
      let ownerGain=0;
      Object.keys(bets).forEach(uid=>{
        const b=bets[uid];
        if(!b) return;
        if(b.cashedAt) return;
        ownerGain+=b.amount;
      });
      db.update('ownerBalance', n => (n||0)+ownerGain).write();
      bot.telegram.sendMessage(r.chatId, `💥 الجولة تعرّضت لـ crash عند x${r.crashAt}! الرهانات خسرت.`);
      clearInterval(interval); interval=null; return;
    }
    bot.telegram.sendMessage(r.chatId, `🔔 المضاعف الآن x${r.multiplier.toFixed(2)} — استخدم /cashout لسحب رهانك.`);
  }, 1000);
}

// أوامر البوت
bot.start(ctx=>{ getPlayer(ctx.from.id); ctx.reply('👋 مرحبًا! استخدم /help للاطّلاع على الأوامر.'); });
bot.help(ctx=>ctx.replyWithMarkdown(`*أوامر البوت:*
/bet <amount> — ضع رهان.
/balance — رصيدك.
/cashout — سحب الرهان.
/status — حالة الجولة.
/launch — ابدأ جولة.
/owner — رصيد المالك.`));

bot.command('bet', ctx=>{
  const args = ctx.message.text.split(' ').slice(1);
  const amount = parseFloat(args[0]);
  if(isNaN(amount)||amount<=0) return ctx.reply('❌ استخدم: /bet <مبلغ> (رقم أكبر من 0).');
  const round = db.get('round').value();
  if(!round.running) return ctx.reply('⚠️ لا توجد جولة حالية.');
  const bets=db.get('bets').value()||{};
  bets[String(ctx.from.id)]={amount:amount,cashedAt:null};
  db.set('bets',bets).write();
  ctx.reply(`✅ تم وضع رهان بقيمة ${amount}`);
});

bot.command('cashout', ctx=>{
  const round=db.get('round').value();
  if(!round.running) return ctx.reply('⚠️ لا توجد جولة شغالة.');
  const bets=db.get('bets').value()||{};
  const b=bets[String(ctx.from.id)];
  if(!b) return ctx.reply('❌ ليس لديك رهان نشط.');
  if(b.cashedAt) return ctx.reply('ℹ️ سحبت الرهان بالفعل.');
  const current=round.multiplier||1.0;
  b.cashedAt=current;
  const houseEdge=0.05;
  const payout=b.amount*current*(1-houseEdge);
  const player=getPlayer(ctx.from.id);
  setPlayerBalance(ctx.from.id,(player.balance||0)+payout);
  db.get('bets').assign({ [String(ctx.from.id)]:b }).write();
  ctx.reply(`💸 سحبت عند x${current.toFixed(2)} — رصيدك الآن ${(player.balance||0+payout).toFixed(2)}`);
});

bot.command('balance', ctx=>{ const p=getPlayer(ctx.from.id); ctx.reply(`💰 رصيدك: ${(p.balance||0).toFixed(4)}`); });
bot.command('status', ctx=>{ const r=db.get('round').value(); if(!r.running) return ctx.reply('🔴 لا توجد جولة حالية.'); ctx.reply(`🟢 المضاعف الحالي x${r.multiplier.toFixed(2)} — crash عند x${r.crashAt}`); });
bot.command('launch', startRoundPublic);
bot.command('owner', ctx=>ctx.reply(`🏦 رصيد صاحب البوت: ${db.get('ownerBalance').value()||0}`));

bot.launch().then(()=>console.log('🤖 CrashBot جاهز وشغال!')).catch(err=>console.error('launch err',err));
