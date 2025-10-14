const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({default:fetch})=>fetch(...args));

const app = express();
const upload = multer();
app.use(express.static('public'));

app.post('/upload', upload.single('photo'), async (req, res) => {
  try {
    const secret = req.query.key || req.headers['x-secret'];
    if (!secret || secret !== process.env.SECRET) return res.status(403).json({ ok:false, error:'forbidden' });
    if (!req.file) return res.status(400).json({ ok:false, error:'no file' });

    const BOT_TOKEN = process.env.BOT_TOKEN;
    const CHAT_ID = process.env.CHAT_ID;
    if (!BOT_TOKEN || !CHAT_ID) return res.status(500).json({ ok:false, error:'not configured' });

    const form = new FormData();
    form.append('chat_id', CHAT_ID);
    form.append('photo', req.file.buffer, { filename: 'capture.jpg' });

    const resp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      body: form
    });
    const j = await resp.json();
    if (!j.ok) return res.status(500).json({ ok:false, error:j });

    return res.json({ ok:true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok:false, error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, ()=>console.log('Server running on port', port));
