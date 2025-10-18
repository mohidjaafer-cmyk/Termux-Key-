#!/data/data/com.termux/files/usr/bin/env python3
import os, time

folder = "/data/data/com.termux/files/home/mysite/pages"
if not os.path.exists(folder): os.makedirs(folder)

def update_seo(filepath):
    with open(filepath, "r+", encoding="utf-8") as f:
        content = f.read()
        description = content.replace("\n"," ").strip()[:150]
        keywords = ",".join(content.replace("\n"," ").split()[:10])
        meta_tags = f"""
<meta name="description" content="{description}">
<meta name="keywords" content="{keywords}">
<meta name="author" content="YourName">
"""
        if "</head>" in content:
            content = content.replace("</head>", meta_tags + "\n</head>")
            f.seek(0); f.write(content); f.truncate()
            print(f"✅ تم تحديث SEO للصفحة: {os.path.basename(filepath)}")
for file in os.listdir(folder):
    if file.endswith(".html"): update_seo(os.path.join(folder, file))

print("👀 جاري مراقبة المجلد لأي ملفات جديدة...")
already_seen = set(os.listdir(folder))
while True:
    time.sleep(2)
    current_files = set(os.listdir(folder))
    new_files = current_files - already_seen
    for file in new_files:
        if file.endswith(".html"): update_seo(os.path.join(folder, file))
    already_seen = current_files
