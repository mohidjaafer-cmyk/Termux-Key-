<li class="news-item ad-item">
</li>
const FEEDS_EN = [
];
const FEEDS_AR = [
];
const FEEDS_CRYPTO = [
];
const CORS_PROXY = url => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
const newsList = document.getElementById('news-list');
async function loadFeeds(urls){
}
async function loadNews(){
}
document.addEventListener('DOMContentLoaded', loadNews);
cd ~/myads
netlify deploy --prod
curl -I https://technowads.netlify.app
curl -s https://technowads.netlify.app | grep -i "adsterra"
netlify sites:list
netlify status
curl -I https://adsterratools.com/static/banners/referral/728x90.png
cd ~/myads
# استبدال أي رابط قديم بالإعلان الجديد
# استبدل الرابط الجديد بالرابط الصالح من حسابك في Adsterra
NEW_AD_LINK="https://adsterra.com/static/banners/referral/728x90.png"
# استبدال جميع الروابط القديمة في index.html
sed -i "s|https://adsterratools.com/static/banners/referral/728x90.png|$NEW_AD_LINK|g" index.html
netlify deploy --prod
curl -s https://technowads.netlify.app | grep -i "adsterra"
mkdir -p ~/playandwin && cd ~/playandwin
<div class="container">
</div>
cd ~/playandwin
cat > index.html <<'HTML'
<div class="container">
  <h1 class="brand">Mr.Jo</h1>
  <section class="card">
    <h2>الدردشة المشفرة</h2>
    <ul id="chatList"></ul>
    <textarea id="chatInput" placeholder="اكتب رسالتك هنا"></textarea>
    <button id="sendBtn">إرسال</button>
  </section>
</div>
HTML

body {
}
.container {
}
.brand {
}
.card {
}
ul {
}
li {
}
textarea {
}
button {
}
cd ~/playandwin
cat > style.css <<'CSS'
body {
  margin: 0;
  font-family: "Noto Kufi Arabic", Arial, sans-serif;
  background: linear-gradient(180deg,#041226,#071226);
  color: #e6eef6;
  display: flex;
  justify-content: center;
}
.container {
  max-width: 500px;
  width: 95%;
  margin: 20px auto;
  padding: 10px;
}
.brand {
  text-align: center;
  font-size: 26px;
  color: #00e6d4;
  margin-bottom: 20px;
  font-weight: bold;
}
.card {
  background: rgba(255,255,255,0.02);
  padding: 14px;
  border-radius: 10px;
  margin-top: 12px;
  border: 1px solid rgba(255,255,255,0.03);
}
ul {
  list-style: none;
  padding: 0;
  max-height: 300px;
  overflow-y: auto;
}
li {
  padding: 4px;
  border-bottom: 1px dashed rgba(255,255,255,0.05);
}
textarea {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  margin: 6px 0;
  background: rgba(255,255,255,0.05);
  color: inherit;
  border: 1px solid rgba(255,255,255,0.1);
}
button {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: none;
  background: #00e6d4;
  color: #001820;
  cursor: pointer;
  font-weight: 700;
}
CSS

# 1️⃣ ندخل المجلد الرئيسي
cd ~
# 2️⃣ نفتح ملف التشغيل التلقائي
nano .bashrc
exit
