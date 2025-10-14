#!/data/data/com.termux/files/usr/bin/bash
# manage_server.sh
# سكربت لإدارة سيرفر ويب واحد في Termux مع إعادة تشغيل تلقائية و خيار ngrok

# --------- إعدادات افتراضية (عدلها حسب رغبتك) ----------
SITE_DIR="${HOME}/mywebsite"    # مجلد الموقع
PORT=8000
SERVER_TYPE="auto"              # node | python | php | auto
AUTO_NGROK="yes"                # yes/no
NGROK_PATH="${HOME}/.local/bin/ngrok"   # عدّل إذا مكانه غير كده
RESTART_DELAY=3                 # ثواني بين محاولات إعادة التشغيل
LOGFILE="${HOME}/server_manager.log"
WAKELOCK="yes"                  # yes/no -> يستخدم termux-wake-lock لو متاح
TMUX_SESSION="websrv"           # اسم جلسة tmux لو بتستخدم tmux
# -------------------------------------------------------

# وظائف مساعدة
log(){ echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOGFILE"; }

# تأكد من مجلد الموقع
if [ ! -d "$SITE_DIR" ]; then
  log "مجلد الموقع غير موجود: $SITE_DIR — إنشاؤه الآن"
  mkdir -p "$SITE_DIR"
fi

# وظيفة لإيجاد عملية تشغل البورت
find_pid_on_port(){
  # يعيد PID أو خالي
  ss -ltnp 2>/dev/null | awk -v p=":$PORT" '$4 ~ p {print $7}' | sed 's/.*,//' | tr -d '\r'
}

# إيقاف أي عملية على البورت
stop_existing(){
  PIDS=$(find_pid_on_port)
  if [ -n "$PIDS" ]; then
    for pid in $PIDS; do
      if [ "$pid" != "" ]; then
        log "إيقاف العملية PID=$pid المشغلة البورت $PORT"
        kill -9 "$pid" 2>/dev/null || kill "$pid" 2>/dev/null
      fi
    done
  fi
}

# اختيار نوع السيرفر إن كان auto
choose_server_type(){
  if [ "$SERVER_TYPE" = "auto" ]; then
    if command -v http-server >/dev/null 2>&1; then
      SERVER_TYPE="node"
    elif command -v php >/dev/null 2>&1; then
      SERVER_TYPE="php"
    else
      SERVER_TYPE="python"
    fi
    log "تم اختيار نوع السيرفر: $SERVER_TYPE"
  fi
}

# تشغيل ngrok (خلفية) ورجع URL إن وجد
start_ngrok(){
  if [ "$AUTO_NGROK" != "yes" ]; then
    log "ngrok معطل."
    return 1
  fi
  if [ -x "$NGROK_PATH" ]; then
    log "تشغيل ngrok على البورت $PORT..."
    # تشغيل ngrok في خلفية منفصلة مع حفظ PID
    nohup "$NGROK_PATH" http "$PORT" --log=stdout > "${HOME}/ngrok.log" 2>&1 &
    sleep 2
    # انتظر قليلاً ثم اقرأ رابط الـ forwarding من السجل
    sleep 2
    # نحاول استخراج عنوان https من سجل ngrok
    NG_URL=$(grep -m1 -Eo 'https://[a-z0-9.-]+\.ngrok\.io' "${HOME}/ngrok.log" 2>/dev/null || true)
    if [ -z "$NG_URL" ]; then
      # آخر محاولة عبر API المحلية (ngrok v2 قد لا يدعم هذه الواجهة)
      NG_URL="(ngrok يعمل — تحقق من $HOME/ngrok.log)"
    fi
    log "ngrok started: $NG_URL"
    return 0
  else
    log "ngrok غير موجود في: $NGROK_PATH"
    return 1
  fi
}

# تشغيل السيرفر نفسه (لا يُغلق)
run_server(){
  cd "$SITE_DIR" || return 1
  case "$SERVER_TYPE" in
    node)
      CMD=( "http-server" "-p" "$PORT" "-a" "0.0.0.0" )
      ;;
    php)
      CMD=( "php" "-S" "0.0.0.0:$PORT" )
      ;;
    python)
      CMD=( "python3" "-m" "http.server" "$PORT" )
      ;;
    *)
      log "نوع سيرفر غير معروف: $SERVER_TYPE"
      return 1
      ;;
  esac
  log "تشغيل السيرفر: ${CMD[*]} في $SITE_DIR"
  # تشغيل في الخلفية مع nohup
  nohup "${CMD[@]}" > "${HOME}/server_stdout.log" 2> "${HOME}/server_stderr.log" &
  SERVER_PID=$!
  sleep 1
  log "تم تشغيل السيرفر PID=$SERVER_PID"
  return 0
}

# حماية ضد sleep (إذا متاح termux-wake-lock)
acquire_wakelock(){
  if [ "$WAKELOCK" = "yes" ] && command -v termux-wake-lock >/dev/null 2>&1; then
    log "تفعيل wake-lock لمنع الجهاز من النوم"
    termux-wake-lock
  fi
}

release_wakelock(){
  if [ "$WAKELOCK" = "yes" ] && command -v termux-wake-unlock >/dev/null 2>&1; then
    log "إلغاء wake-lock"
    termux-wake-unlock
  fi
}

# الأداء: نبدأ التنفيذ
log "=== بدء manage_server.sh ==="
acquire_wakelock
choose_server_type

# حلقة إعادة التشغيل
while true; do
  stop_existing
  run_server
  sleep 2
  # تحقق أن السيرفر شغال على البورت
  NEWPID=$(find_pid_on_port)
  if [ -n "$NEWPID" ]; then
    log "السيرفر يعمل الآن (PID=$NEWPID)."
    # شغّل ngrok مرة واحدة إذا مطلوب
    if [ "$AUTO_NGROK" = "yes" ]; then
      start_ngrok || true
    fi
    # هنا ننتظر — سنفحص كل 10 ثواني هل العملية قائمة
    while true; do
      sleep 10
      STILL=$(find_pid_on_port)
      if [ -z "$STILL" ]; then
        log "السيرفر توقّف! سيتم إعادة التشغيل بعد $RESTART_DELAY ثانية."
        sleep "$RESTART_DELAY"
        break
      fi
    done
  else
    log "فشل تشغيل السيرفر — إعادة المحاولة بعد $RESTART_DELAY ثانية."
    sleep "$RESTART_DELAY"
  fi
done

# لن يتم الوصول هنا عادةً
release_wakelock
