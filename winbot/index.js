const { Telegraf, Markup } = require('telegraf')
const fs = require('fs')

// ضع هنا توكن البوت الحقيقي
const bot = new Telegraf('8396455619:AAGrEsqHVA4l6fU8I_TKCV0XjbqVIBR2uP0')

// قاعدة بيانات بسيطة
const dbFile = 'db.json'
if(!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, JSON.stringify({players: []}, null, 2))
function readDB(){ return JSON.parse(fs.readFileSync(dbFile)) }
function writeDB(data){ fs.writeFileSync(dbFile, JSON.stringify(data,null,2)) }

// بدء البوت
bot.start((ctx) => ctx.reply('👋 أهلا بك في WinBot!\nاكتب /play للعب اللعبة'))

// الأمر للعبة
bot.command('play', async (ctx) => {
    const data = readDB()
    let player = data.players.find(p=>p.id===ctx.from.id)
    if(!player){
        player = {id: ctx.from.id, balance: 100} // رصيد أولي
        data.players.push(player)
        writeDB(data)
    }

    ctx.reply(`🎮 اللعبة بدأت! رصيدك الحالي: $${player.balance}\nاختر مضاعفك:`, Markup.inlineKeyboard([
        [Markup.button.callback('x1.5', 'mult_1.5'), Markup.button.callback('x2', 'mult_2')],
        [Markup.button.callback('x3', 'mult_3'), Markup.button.callback('x5', 'mult_5')]
    ]))
})

// إدارة اللعب
bot.action(/mult_(.+)/, async (ctx) => {
    const mult = parseFloat(ctx.match[1])
    const data = readDB()
    const player = data.players.find(p=>p.id===ctx.from.id)
    if(!player) return ctx.reply('⚠️ الرجاء بدء اللعبة أولاً باستخدام /play')

    // توليد نتيجة اللعبة عشوائية
    const win = Math.random() > 0.5
    if(win){
        const gain = Math.floor(10*mult)
        player.balance += gain
        writeDB(data)
        await ctx.reply(`✅ فزت! رصيدك زاد $${gain}\nرصيدك الآن: $${player.balance}`)
    } else {
        const loss = Math.floor(10)
        player.balance -= loss
        writeDB(data)
        await ctx.reply(`❌ خسرت $${loss}\nرصيدك الآن: $${player.balance}`)
    }
})

// رصيد اللاعب
bot.command('balance', (ctx) => {
    const data = readDB()
    const player = data.players.find(p=>p.id===ctx.from.id)
    if(!player) return ctx.reply('💰 لا يوجد رصيد بعد.')
    ctx.reply(`💵 رصيدك الحالي: $${player.balance}`)
})

// إطلاق البوت
bot.launch()
console.log('🤖 WinBot جاهز وشغال!')
