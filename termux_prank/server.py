from flask import Flask, request, send_from_directory, jsonify, abort
import os, io, datetime, werkzeug

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, 'uploads')
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')

os.makedirs(UPLOAD_DIR, exist_ok=True)

app = Flask(__name__, static_folder='public', static_url_path='')

SECRET = os.environ.get('SECRET', 'mytest123')

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
    filename = werkzeug.utils.secure_filename(f.filename or 'capture.jpg')
    ts = datetime.datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
    outname = f"{ts}_{filename}"
    outpath = os.path.join(UPLOAD_DIR, outname)
    f.save(outpath)
    public_url = f"/uploads/{outname}"
    return jsonify(ok=True, file=outname, url=public_url)

@app.route('/uploads/<path:fname>')
def serve_upload(fname):
    return send_from_directory(UPLOAD_DIR, fname)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)
