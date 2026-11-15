(function () {
  'use strict';

  // 0. Cấu hình kết nối Firebase Realtime Database (Dự án: hnue-warmlink)
  const firebaseConfig = {
    apiKey: "AIzaSyCV3MdX8zQ1bPpYocMphIDubr_KpZnmnEc",
    authDomain: "hnue-warmlink.firebaseapp.com",
    databaseURL: "https://hnue-warmlink-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "hnue-warmlink",
    storageBucket: "hnue-warmlink.firebasestorage.app",
    messagingSenderId: "462605682082",
    appId: "1:462605682082:web:812168b291174b181c1efb",
    measurementId: "G-ELBFFLS61V"
  };

  let rtdb = null;
  if (typeof firebase !== 'undefined' && firebaseConfig.apiKey) {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      rtdb = firebase.database();
    } catch (err) {
      console.error('Lỗi khởi tạo Firebase:', err);
    }
  }

  // Mã định danh duy nhất cho từng thiết bị người dùng
  const UID_KEY = 'hnue_warmlink_device_uid';
  let myUid = localStorage.getItem(UID_KEY);
  if (!myUid) {
    myUid = 'user_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
    localStorage.setItem(UID_KEY, myUid);
  }

  // 1. Tọa độ chuẩn các khu vực tại Trường Đại học Sư phạm Hà Nội
  const HNUE_LANDMARKS = [
    { name: 'Ký túc xá ĐHSP Hà Nội (Nhà B2)', lat: 21.0389, lng: 105.7819 },
    { name: 'Giảng đường Nhà K', lat: 21.0376, lng: 105.7835 },
    { name: 'Thư viện Trường ĐHSP Hà Nội', lat: 21.0369, lng: 105.7828 },
    { name: 'Giảng đường Nhà C & Nhà D3', lat: 21.0381, lng: 105.7844 },
    { name: 'Khoa Giáo dục Đặc biệt', lat: 21.0364, lng: 105.7841 }
  ];

  // 2. State ứng dụng lưu trên LocalStorage
  const STORAGE_KEY = 'hnue_warmlink_production_v2';
  const defaultState = {
    studentName: 'Nguyễn Minh Anh',
    studentEmail: 'minhanh.k72@hnue.edu.vn',
    studentFaculty: 'Khoa CNTT',
    points: 175,
    helps: 7,
    weeklySparks: 342,
    ktxSparks: 128,
    cnttPoints: 1420,
    area: 'Ký túc xá ĐHSP Hà Nội (Nhà B2)',
    group: 'Y tế & Đời sống',
    message: 'Mình đang sốt nhẹ ở KTX B2, nhờ bạn mua giúp vỉ thuốc hạ sốt và hộp cháo.',
    history: [
      {
        title: 'Hỗ trợ mua thuốc hạ sốt tại KTX B2',
        partner: 'Trần Hoàng Nam (K73 GD Đặc biệt)',
        time: 'Hôm qua • 21:15',
        code: 'QR-8841'
      },
      {
        title: 'Đồng hành di chuyển lên tầng 3 Nhà K',
        partner: 'Lê Thu Hà (K72 Ngữ văn)',
        time: '12/11/2026 • 13:45',
        code: 'QR-8790'
      }
    ]
  };

  let appState = Object.assign({}, defaultState);
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      appState = Object.assign({}, defaultState, saved);
    }
  } catch (e) {}

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (e) {}
  }

  // 3. Toast thông báo
  const mobileToast = document.getElementById('mobileToast');
  let toastTimer = null;
  function notify(msg) {
    mobileToast.textContent = msg;
    mobileToast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => mobileToast.classList.remove('show'), 3600);
  }

  // 4. Hệ thống định vị GPS & đồng bộ thời gian thực qua Firebase
  const gpsState = {
    isLive: false,
    lat: 21.0389,
    lng: 105.7819,
    accuracy: 12,
    watchId: null,
    beaconOn: false
  };

  const remoteBeacons = {};
  const remoteSosSignals = {};
  let lastNotifiedSosKey = '';

  function syncMyBeaconToCloud() {
    if (!rtdb) return;
    const myBeaconRef = rtdb.ref('beacons/' + myUid);
    if (gpsState.beaconOn) {
      myBeaconRef.onDisconnect().remove();
      myBeaconRef.set({
        uid: myUid,
        name: appState.studentName,
        faculty: appState.studentFaculty,
        lat: gpsState.lat,
        lng: gpsState.lng,
        isLiveGps: gpsState.isLive,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
      });
    } else {
      myBeaconRef.remove();
    }
  }

  // Lắng nghe dữ liệu người dùng thật từ Firebase Realtime Database
  if (rtdb) {
    // 1. Lắng nghe các "Người Thắp Lửa" đang bật vị trí
    rtdb.ref('beacons').on('value', (snap) => {
      const data = snap.val() || {};
      const now = Date.now();
      Object.keys(remoteBeacons).forEach((k) => delete remoteBeacons[k]);

      Object.keys(data).forEach((uid) => {
        if (uid === myUid) return;
        const item = data[uid];
        if (item && typeof item.lat === 'number' && (!item.updatedAt || now - item.updatedAt < 900000)) {
          const initials = (item.name || 'SV')
            .split(' ')
            .slice(-2)
            .map((w) => w[0] || '')
            .join('')
            .toUpperCase();

          remoteBeacons[uid] = {
            id: uid,
            uid: uid,
            isRealUser: true,
            initials: initials || 'SV',
            name: item.name + ' (Trực tuyến)',
            faculty: item.faculty || 'Cộng đồng HNUE',
            skill: 'Người Thắp Lửa đang trực tuyến',
            rating: '5.0★',
            realLat: item.lat,
            realLng: item.lng,
            confirmed: false
          };
        }
      });

      renderRadarAndNearbyList();
    });

    // 2. Lắng nghe tín hiệu SOS khẩn cấp từ các thiết bị khác
    rtdb.ref('sos_signals').on('value', (snap) => {
      const data = snap.val() || {};
      const now = Date.now();
      Object.keys(remoteSosSignals).forEach((k) => delete remoteSosSignals[k]);

      let newestSos = null;
      Object.keys(data).forEach((uid) => {
        if (uid === myUid) return;
        const sos = data[uid];
        if (sos && (!sos.createdAt || now - sos.createdAt < 1800000)) {
          remoteSosSignals[uid] = sos;
          if (!newestSos || (sos.createdAt || 0) > (newestSos.createdAt || 0)) {
            newestSos = sos;
          }
        }
      });

      if (newestSos) {
        const key = newestSos.uid + '_' + (newestSos.createdAt || '');
        if (key !== lastNotifiedSosKey) {
          lastNotifiedSosKey = key;
          const dist = haversineMeters(gpsState.lat, gpsState.lng, newestSos.lat, newestSos.lng);
          notify(`🆘 ${newestSos.name} cách bạn ~${dist}m đang cần hỗ trợ (${newestSos.group})!`);
        }
      }

      renderIncomingSosList();
    });
  }

  const nearbyPeers = [
    {
      id: 'vol-1',
      initials: 'HN',
      name: 'Trần Hoàng Nam',
      faculty: 'K73 GD Đặc biệt',
      skill: 'Sơ cứu & Hỗ trợ di chuyển',
      rating: '5.0★',
      dNorth: 62,
      dEast: 54,
      confirmed: false
    },
    {
      id: 'vol-2',
      initials: 'TH',
      name: 'Lê Thu Hà',
      faculty: 'K72 Khoa Ngữ văn',
      skill: 'Mua thuốc & Đồ thiết yếu',
      rating: '4.9★',
      dNorth: -135,
      dEast: 120,
      confirmed: false
    },
    {
      id: 'vol-3',
      initials: 'ĐK',
      name: 'Thẻ Đắc Khánh',
      faculty: 'K72 Khoa CNTT',
      skill: 'Kỹ thuật & Tài liệu học tập',
      rating: '5.0★',
      dNorth: 210,
      dEast: -175,
      confirmed: false
    },
    {
      id: 'vol-4',
      initials: 'PL',
      name: 'Phạm Khánh Linh',
      faculty: 'K73 Khoa Toán - Tin',
      skill: 'Đồng hành giảng đường',
      rating: '4.8★',
      dNorth: -290,
      dEast: -240,
      confirmed: false
    }
  ];

  function offsetLatLng(baseLat, baseLng, dNorthMeters, dEastMeters) {
    const R = 6378137;
    const newLat = baseLat + (dNorthMeters / R) * (180 / Math.PI);
    const newLng = baseLng + (dEastMeters / (R * Math.cos((Math.PI * baseLat) / 180))) * (180 / Math.PI);
    return { lat: newLat, lng: newLng };
  }

  function haversineMeters(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  function getBearingDeg(lat1, lng1, lat2, lng2) {
    const toRad = (d) => (d * Math.PI) / 180;
    const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
    const x =
      Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
      Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  }

  function bearingToDirection(deg) {
    const dirs = ['Bắc', 'Đông Bắc', 'Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc'];
    return dirs[Math.round(deg / 45) % 8];
  }

  function detectNearestHnuePlace(lat, lng) {
    let best = null;
    let minDist = Infinity;
    HNUE_LANDMARKS.forEach((lm) => {
      const d = haversineMeters(lat, lng, lm.lat, lm.lng);
      if (d < minDist) {
        minDist = d;
        best = lm;
      }
    });
    if (best && minDist <= 1200) {
      return `${best.name} (cách ~${minDist}m)`;
    }
    return `Tọa độ hiện tại (${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E)`;
  }

  let selectedPeerId = 'vol-1';
  let currentMaxDist = 500;

  function updateGpsDisplays() {
    const latStr = gpsState.lat.toFixed(5) + '° N';
    const lngStr = gpsState.lng.toFixed(5) + '° E';
    const accStr = `±${Math.round(gpsState.accuracy)}m`;

    const headerGpsBtn = document.getElementById('headerGpsBtn');
    const headerGpsLabel = document.getElementById('headerGpsLabel');
    headerGpsBtn.classList.toggle('is-live', gpsState.isLive);
    headerGpsLabel.textContent = gpsState.isLive ? `GPS: ${accStr}` : 'GPS: Sẵn sàng';

    const btn1 = document.getElementById('enableRealGpsBtn1');
    const txt1 = document.getElementById('enableRealGpsText1');
    const btn2 = document.getElementById('enableRealGpsBtn2');
    const txt2 = document.getElementById('enableRealGpsText2');

    if (gpsState.isLive) {
      btn1.classList.add('is-active');
      txt1.textContent = 'Đang định vị';
      btn2.classList.add('is-active');
      txt2.textContent = 'GPS Live';
      document.getElementById('gpsCoordsDisplay1').textContent = `📡 GPS: ${latStr} | ${lngStr} (${accStr})`;
      const detectedName = detectNearestHnuePlace(gpsState.lat, gpsState.lng);
      document.getElementById('gpsDetectedPlace1').textContent = `📍 ${detectedName}`;
      document.getElementById('radarGpsTitle').textContent = `📡 Tâm định vị: ${detectedName}`;
    } else {
      btn1.classList.remove('is-active');
      txt1.textContent = 'Bật GPS thật';
      btn2.classList.remove('is-active');
      txt2.textContent = 'Bật GPS';
      document.getElementById('gpsCoordsDisplay1').textContent = `Tọa độ HNUE: ${latStr} | ${lngStr}`;
    }

    document.getElementById('radarGpsExact').textContent = `Lat: ${latStr} | Lng: ${lngStr} (${accStr})`;
    syncMyBeaconToCloud();
    renderIncomingSosList();
    renderRadarAndNearbyList();
  }

  function activateRealGeolocation() {
    if (!('geolocation' in navigator)) {
      notify('⚠ Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }

    notify('📡 Đang lấy tọa độ GPS từ thiết bị của bạn...');
    if (gpsState.watchId !== null) {
      navigator.geolocation.clearWatch(gpsState.watchId);
    }

    gpsState.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const firstTime = !gpsState.isLive;
        gpsState.isLive = true;
        gpsState.lat = pos.coords.latitude;
        gpsState.lng = pos.coords.longitude;
        gpsState.accuracy = pos.coords.accuracy || 15;

        const areaSelect = document.getElementById('hnueAreaSelect');
        areaSelect.value = 'Vị trí GPS thực tế hiện tại của bạn';
        updateGpsDisplays();

        if (firstTime) {
          notify('✓ Đã bật GPS thật! Đang quét cộng đồng xung quanh bán kính 500m.');
        }
      },
      (err) => {
        gpsState.isLive = false;
        updateGpsDisplays();
        if (err.code === 1) {
          notify('⚠ Vui lòng cấp quyền Vị trí (Location) trong cài đặt trình duyệt để quét GPS.');
        } else {
          notify('⚠ Chưa nhận được tín hiệu vệ tinh GPS. Hãy bật Dịch vụ vị trí trên thiết bị.');
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }

  document.getElementById('headerGpsBtn').addEventListener('click', activateRealGeolocation);
  document.getElementById('enableRealGpsBtn1').addEventListener('click', activateRealGeolocation);
  document.getElementById('enableRealGpsBtn2').addEventListener('click', activateRealGeolocation);
  document.getElementById('refreshRadarBtn').addEventListener('click', activateRealGeolocation);

  const volunteerBeaconSwitch = document.getElementById('volunteerBeaconSwitch');
  volunteerBeaconSwitch.addEventListener('click', () => {
    gpsState.beaconOn = !gpsState.beaconOn;
    volunteerBeaconSwitch.classList.toggle('on', gpsState.beaconOn);
    syncMyBeaconToCloud();

    if (gpsState.beaconOn) {
      if (!gpsState.isLive) activateRealGeolocation();
      notify('🔥 Đã bật “Người Thắp Lửa”! Vị trí của bạn đang chia sẻ trực tiếp cho mọi người xung quanh.');
    } else {
      notify('Đã tắt trạng thái trực tuyến Người Thắp Lửa.');
    }
  });

  setInterval(() => {
    nearbyPeers.forEach((p) => {
      p.dNorth += (Math.random() - 0.5) * 3;
      p.dEast += (Math.random() - 0.5) * 3;
    });
    if (gpsState.beaconOn) syncMyBeaconToCloud();
    if (document.getElementById('page-radar-500m').classList.contains('active')) {
      renderRadarAndNearbyList();
    }
  }, 6000);

  // Hiển thị các yêu cầu SOS thật từ người dùng khác gửi lên Firebase
  function renderIncomingSosList() {
    const container = document.getElementById('incomingSosContainer');
    if (!container) return;

    const list = Object.values(remoteSosSignals)
      .map((sos) => {
        const distM = haversineMeters(gpsState.lat, gpsState.lng, sos.lat, sos.lng);
        const bearing = getBearingDeg(gpsState.lat, gpsState.lng, sos.lat, sos.lng);
        const dirText = bearingToDirection(bearing);
        return Object.assign({}, sos, { distM, dirText });
      })
      .sort((a, b) => a.distM - b.distM);

    if (!list.length) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = list
      .map(
        (sos) => `
        <div class="vol-card" style="border-color: var(--rose-500); background: var(--rose-50);">
          <div class="vol-card-top">
            <div>
              <div class="vol-title" style="color: var(--rose-600);">🆘 ${sos.name} cần hỗ trợ</div>
              <div class="vol-sub" style="color: var(--navy-900); font-weight: 700;">${sos.group} • ${sos.area}</div>
              <div class="vol-sub" style="color: var(--slate-700); margin-top: 4px;">“${sos.message}”</div>
              <div class="vol-gps-meta">GPS: ${sos.lat.toFixed(5)}°N, ${sos.lng.toFixed(5)}°E • Hướng ${sos.dirText}</div>
            </div>
            <span class="vol-dist-tag" style="background: #fff; color: var(--rose-600);">${sos.distM}m</span>
          </div>
          <div class="vol-card-actions" style="grid-template-columns: 1fr;">
            <button type="button" class="btn-confirm-qr" data-sos-uid="${sos.uid}">
              💬 Tiếp nhận hỗ trợ &amp; Nhắn tin ngay
            </button>
          </div>
        </div>
      `
      )
      .join('');

    container.querySelectorAll('[data-sos-uid]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sos = list.find((x) => x.uid === btn.getAttribute('data-sos-uid'));
        if (sos) {
          openSafeChat({
            id: sos.uid,
            uid: sos.uid,
            isRealUser: true,
            name: sos.name,
            faculty: sos.faculty || 'Cộng đồng HNUE',
            distM: sos.distM,
            dirText: sos.dirText
          });
        }
      });
    });
  }

  // 5. Render Radar 500m + Bản đồ GPS + Danh sách tình nguyện viên
  function getAllCombinedPeers() {
    const all = Object.values(remoteBeacons);
    nearbyPeers.forEach((p) => all.push(p));
    return all;
  }

  function renderRadarAndNearbyList() {
    const blipsLayer = document.getElementById('dynamicRadarBlipsLayer');
    const mapPinsLayer = document.getElementById('dynamicMapPinsLayer');
    const listContainer = document.getElementById('nearbyVolunteersList');

    const enriched = getAllCombinedPeers()
      .map((peer) => {
        const coords =
          typeof peer.realLat === 'number'
            ? { lat: peer.realLat, lng: peer.realLng }
            : offsetLatLng(gpsState.lat, gpsState.lng, peer.dNorth, peer.dEast);
        const distM = haversineMeters(gpsState.lat, gpsState.lng, coords.lat, coords.lng);
        const bearing = getBearingDeg(gpsState.lat, gpsState.lng, coords.lat, coords.lng);
        const dirText = bearingToDirection(bearing);
        const walkMin = Math.max(1, Math.round(distM / 75));
        return Object.assign({}, peer, {
          lat: coords.lat,
          lng: coords.lng,
          distM,
          bearing,
          dirText,
          walkMin
        });
      })
      .filter((p) => p.distM <= currentMaxDist)
      .sort((a, b) => {
        if (a.isRealUser && !b.isRealUser) return -1;
        if (!a.isRealUser && b.isRealUser) return 1;
        return a.distM - b.distM;
      });

    document.getElementById('nearbyCountBadge').textContent = `${enriched.length} người xung quanh`;

    let radarHtml = '';
    let mapHtml = '';
    let cardsHtml = '';

    enriched.forEach((p) => {
      const ratio = Math.min(0.92, p.distM / 500);
      const rad = (p.bearing * Math.PI) / 180;
      const leftPct = 50 + Math.sin(rad) * ratio * 44;
      const topPct = 50 - Math.cos(rad) * ratio * 44;
      const isSel = p.id === selectedPeerId ? 'is-selected' : '';
      const dotStyle = p.isRealUser
        ? 'background: #10b981; box-shadow: 0 0 16px #10b981;'
        : '';

      radarHtml += `
        <div class="dynamic-vol-blip ${isSel}" data-peer-id="${p.id}" style="left: ${leftPct.toFixed(1)}%; top: ${topPct.toFixed(1)}%;">
          <div class="blip-dot" style="${dotStyle}"></div>
          <span class="blip-label">${p.name.replace(' (Trực tuyến)', '').split(' ').slice(-2).join(' ')} • ${p.distM}m</span>
        </div>
      `;

      mapHtml += `
        <div class="dynamic-vol-blip ${isSel}" data-peer-id="${p.id}" style="left: ${leftPct.toFixed(1)}%; top: ${topPct.toFixed(1)}%;">
          <div class="blip-dot" style="background: #10b981; box-shadow: 0 0 12px #10b981;"></div>
          <span class="blip-label" style="border-color: #34d399;">${p.name} (${p.distM}m - ${p.dirText})</span>
        </div>
      `;

      cardsHtml += `
        <div class="vol-card ${p.id === selectedPeerId ? 'is-highlighted' : ''}" id="card-${p.id}">
          <div class="vol-card-top">
            <div class="vol-left">
              <div class="vol-badge-avatar" style="${p.isRealUser ? 'background: var(--emerald-100); color: var(--emerald-700);' : ''}">${p.initials}</div>
              <div>
                <div class="vol-title">${p.name} <span style="font-size: 0.7rem; color: var(--amber-700);">${p.rating}</span></div>
                <div class="vol-sub">${p.faculty} • ${p.skill}</div>
                <div class="vol-gps-meta">GPS: ${p.lat.toFixed(5)}°N, ${p.lng.toFixed(5)}°E • Hướng ${p.dirText}</div>
              </div>
            </div>
            <span class="vol-dist-tag">${p.distM}m (~${p.walkMin}p)</span>
          </div>

          <div class="vol-card-actions">
            <button type="button" class="btn-chat-vol" data-chat-id="${p.id}">
              💬 Nhắn tin
            </button>
            <button type="button" class="btn-confirm-qr ${p.confirmed ? 'is-confirmed' : ''}" data-qr-id="${p.id}">
              ${p.confirmed ? '✓ Đã xác thực +25đ' : '📷 Xác nhận QR (+25đ)'}
            </button>
          </div>
        </div>
      `;
    });

    blipsLayer.innerHTML = radarHtml;
    mapPinsLayer.innerHTML = mapHtml;
    listContainer.innerHTML =
      cardsHtml ||
      `<div class="ui-card" style="text-align: center; font-size: 0.8rem; color: var(--slate-500);">Chưa có người hỗ trợ trong bán kính &lt;${currentMaxDist}m. Bạn hãy chọn mức 500m để mở rộng phạm vi tìm kiếm.</div>`;

    document.querySelectorAll('.dynamic-vol-blip').forEach((el) => {
      el.addEventListener('click', () => {
        selectedPeerId = el.getAttribute('data-peer-id');
        renderRadarAndNearbyList();
        const cardEl = document.getElementById('card-' + selectedPeerId);
        if (cardEl) cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });

    document.querySelectorAll('.btn-chat-vol').forEach((btn) => {
      btn.addEventListener('click', () => {
        const peer = enriched.find((x) => x.id === btn.getAttribute('data-chat-id'));
        if (peer) openSafeChat(peer);
      });
    });

    document.querySelectorAll('.btn-confirm-qr').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-qr-id');
        const peer = nearbyPeers.find((x) => x.id === targetId) || remoteBeacons[targetId];
        if (!peer) return;
        if (peer.confirmed) {
          window.location.hash = '#/chung-nhan';
          return;
        }
        peer.confirmed = true;
        appState.points += 25;
        appState.helps += 1;
        appState.weeklySparks += 1;
        appState.ktxSparks += 1;
        appState.cnttPoints += 25;

        const now = new Date();
        const timeStr = `Hôm nay • ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        appState.history.unshift({
          title: `${appState.group} tại ${appState.area}`,
          partner: `${peer.name} (${peer.faculty})`,
          time: timeStr,
          code: 'QR-' + Math.floor(1000 + Math.random() * 9000)
        });

        // Xóa tín hiệu SOS của mình trên Firebase sau khi đã được hỗ trợ xong
        if (rtdb) {
          rtdb.ref('sos_signals/' + myUid).remove();
        }

        saveState();
        syncAllUserUI();
        renderRadarAndNearbyList();
        notify(`🎉 Đã xác thực hỗ trợ cùng ${peer.name}! +25 Điểm Ấm đã cộng vào thẻ của bạn.`);
        setTimeout(() => {
          window.location.hash = '#/chung-nhan';
        }, 900);
      });
    });
  }

  // Chuyển đổi Radar 500m / Bản đồ GPS
  const modeRadarBtn = document.getElementById('modeRadarBtn');
  const modeGpsMapBtn = document.getElementById('modeGpsMapBtn');
  const radarViewPanel = document.getElementById('radarViewPanel');
  const gpsMapViewPanel = document.getElementById('gpsMapViewPanel');

  modeRadarBtn.addEventListener('click', () => {
    modeRadarBtn.classList.add('active');
    modeGpsMapBtn.classList.remove('active');
    radarViewPanel.style.display = 'block';
    gpsMapViewPanel.classList.remove('active');
  });

  modeGpsMapBtn.addEventListener('click', () => {
    modeGpsMapBtn.classList.add('active');
    modeRadarBtn.classList.remove('active');
    radarViewPanel.style.display = 'none';
    gpsMapViewPanel.classList.add('active');
  });

  document.querySelectorAll('#radiusFilterPills .radius-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#radiusFilterPills .radius-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      currentMaxDist = parseInt(pill.getAttribute('data-max-dist'), 10);
      renderRadarAndNearbyList();
    });
  });

  // 6. Đồng bộ giao diện người dùng & lịch sử
  function syncAllUserUI() {
    const isHnueEmail = appState.studentEmail.toLowerCase().endsWith('@hnue.edu.vn');
    document.getElementById('headerVerifiedBadge').textContent = isHnueEmail ? '✓ @hnue.edu.vn' : '✓ Đã xác thực';
    document.getElementById('headerStudentName').textContent = appState.studentName;
    document.getElementById('headerStudentFaculty').textContent = appState.studentFaculty;
    document.getElementById('headerPointsBadge').textContent = appState.points + 'đ';

    document.getElementById('walletStudentName').textContent = appState.studentName;
    document.getElementById('walletStudentMeta').textContent = `${appState.studentEmail} • ${appState.studentFaculty}`;
    document.getElementById('walletScoreNumber').textContent = appState.points;

    document.getElementById('certHolderName').textContent = appState.studentName;
    document.getElementById('sheetHolderName').textContent = appState.studentName.toUpperCase();
    document.getElementById('sheetHolderMeta').textContent = `${appState.studentFaculty} • ${appState.studentEmail}`;
    document.getElementById('sheetPointsValue').textContent = appState.points + ' Điểm Ấm';
    document.getElementById('certTotalHelps').textContent = appState.helps + ' lượt hỗ trợ';

    const pct = Math.min(100, (appState.points / 200) * 100);
    document.getElementById('sv5tProgressBar').style.width = pct + '%';
    document.getElementById('sv5tProgressNote').textContent =
      appState.points >= 200
        ? '★ Đã đạt chuẩn tiêu chí “Đạo đức tốt” – Sinh viên 5 tốt cấp Trường!'
        : `Còn ${200 - appState.points} Điểm Ấm để đạt chuẩn tiêu chí “Đạo đức tốt” cấp Trường`;

    document.getElementById('weeklySparksCount').textContent = appState.weeklySparks;
    document.getElementById('ktxSparkCounter').textContent = `${appState.ktxSparks} đốm lửa`;
    document.getElementById('cnttScoreRank').textContent = `${appState.cnttPoints.toLocaleString('vi-VN')} Điểm Ấm`;

    const histEl = document.getElementById('verifiedHistoryList');
    histEl.innerHTML = appState.history
      .map(
        (h) => `
        <div class="history-item">
          <div>
            <div style="font-weight: 700; color: var(--navy-900);">${h.title}</div>
            <div style="font-size: 0.7rem; color: var(--slate-500);">Cùng: ${h.partner} • ${h.time}</div>
          </div>
          <span style="background: var(--emerald-50); color: var(--emerald-700); font-weight: 800; font-size: 0.68rem; padding: 2px 7px; border-radius: 6px; white-space: nowrap;">
            +25đ (${h.code})
          </span>
        </div>
      `
      )
      .join('');
  }

  // 7. Điều hướng giữa các tab
  const pages = document.querySelectorAll('.app-page');
  const tabLinks = document.querySelectorAll('.tab-nav-link');

  function navigateToRoute(rawHash) {
    let route = (rawHash || '').replace(/^#/, '');
    if (!route || route === '/') route = '/phat-tin-hieu';
    let matched = false;
    pages.forEach((p) => {
      const isMatch = p.getAttribute('data-route') === route;
      p.classList.toggle('active', isMatch);
      if (isMatch) matched = true;
    });
    if (!matched) {
      route = '/phat-tin-hieu';
      document.getElementById('page-phat-tin-hieu').classList.add('active');
    }
    tabLinks.forEach((l) => l.classList.toggle('active', l.getAttribute('data-route') === route));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window.addEventListener('hashchange', () => navigateToRoute(window.location.hash));
  if (!window.location.hash) history.replaceState(null, '', '#/phat-tin-hieu');
  navigateToRoute(window.location.hash);

  // 8. AI NLP kiểm duyệt & nút phát tín hiệu
  document.querySelectorAll('#supportGroupPills .support-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#supportGroupPills .support-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      appState.group = chip.getAttribute('data-group');
    });
  });

  const sosMessageInput = document.getElementById('sosMessageInput');
  document.querySelectorAll('.template-pill[data-tpl]').forEach((tplBtn) => {
    tplBtn.addEventListener('click', () => {
      sosMessageInput.value = tplBtn.getAttribute('data-tpl');
      validateAiNlp();
    });
  });

  const nlpFeedbackBox = document.getElementById('nlpFeedbackBox');
  const nlpFeedbackText = document.getElementById('nlpFeedbackText');
  const nlpAutoCleanBtn = document.getElementById('nlpAutoCleanBtn');
  const blockedWords = ['chửi', 'ngu', 'xấu', 'ghét', 'bực', 'tệ hại', 'đồ điên', 'vô dụng'];

  function validateAiNlp() {
    const val = sosMessageInput.value.trim();
    const lower = val.toLowerCase();
    if (!val) {
      nlpFeedbackBox.classList.add('is-warning');
      nlpFeedbackText.textContent = '⚠ Vui lòng nhập nội dung ngắn gọn để được hỗ trợ';
      nlpAutoCleanBtn.style.display = 'none';
      return false;
    }
    if (blockedWords.some((w) => lower.includes(w))) {
      nlpFeedbackBox.classList.add('is-warning');
      nlpFeedbackText.textContent = '⚠ AI NLP: Phát hiện từ ngữ chưa phù hợp';
      nlpAutoCleanBtn.style.display = 'inline-block';
      return false;
    }
    nlpFeedbackBox.classList.remove('is-warning');
    nlpFeedbackText.textContent = '✓ AI NLP: Nội dung rõ ràng, tích cực & an toàn';
    nlpAutoCleanBtn.style.display = 'none';
    return true;
  }

  sosMessageInput.addEventListener('input', validateAiNlp);
  nlpAutoCleanBtn.addEventListener('click', () => {
    sosMessageInput.value = 'Mình đang cần hỗ trợ gấp tại khuôn viên trường, mong nhận được sự giúp đỡ từ bạn đồng môn.';
    validateAiNlp();
    notify('✓ Đã chuẩn hóa nội dung tích cực!');
  });

  document.getElementById('triggerSosBtn').addEventListener('click', () => {
    if (!validateAiNlp()) {
      notify('⚠ Vui lòng kiểm tra lại nội dung lời nhắn trước khi gửi.');
      return;
    }
    const selectedArea = document.getElementById('hnueAreaSelect').value;
    appState.area =
      selectedArea === 'Vị trí GPS thực tế hiện tại của bạn'
        ? detectNearestHnuePlace(gpsState.lat, gpsState.lng)
        : selectedArea;
    appState.message = sosMessageInput.value.trim();
    saveState();

    // Phát tín hiệu SOS lên Firebase để mọi thiết bị xung quanh nhận được
    if (rtdb) {
      const sosRef = rtdb.ref('sos_signals/' + myUid);
      sosRef.onDisconnect().remove();
      sosRef.set({
        uid: myUid,
        name: appState.studentName,
        faculty: appState.studentFaculty,
        group: appState.group,
        area: appState.area,
        message: appState.message,
        lat: gpsState.lat,
        lng: gpsState.lng,
        createdAt: firebase.database.ServerValue.TIMESTAMP
      });
    }

    if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
    notify('🔥 Đã phát tín hiệu kèm tọa độ GPS lên hệ thống! Đang tìm người hỗ trợ...');
    window.location.hash = '#/radar-500m';
  });

  // 9. Chat an toàn thời gian thực giữa 2 người dùng
  const safeChatModal = document.getElementById('safeChatModal');
  const chatMessagesBox = document.getElementById('chatMessagesBox');
  const chatInputBox = document.getElementById('chatInputBox');
  let activeChatPeer = null;
  let activeChatRef = null;

  function openSafeChat(peer) {
    activeChatPeer = peer;
    if (activeChatRef) {
      activeChatRef.off();
      activeChatRef = null;
    }

    document.getElementById('chatPartnerName').textContent = `${peer.name} (${peer.distM}m)`;
    document.getElementById('chatPartnerMeta').textContent = `✓ ${peer.faculty} • Bảo mật số điện thoại`;
    const shortName = appState.studentName.split(' ').slice(-1)[0];

    chatMessagesBox.innerHTML = `
      <div class="chat-bubble incoming">
        Kết nối an toàn đã sẵn sàng với ${peer.name} (cách ${peer.distM}m, hướng ${peer.dirText}).
      </div>
    `;

    // Đồng bộ tin nhắn 2 chiều thời gian thực qua Firebase
    if (rtdb && peer.isRealUser && peer.uid) {
      const roomId = [myUid, peer.uid].sort().join('__');
      activeChatRef = rtdb.ref('chats/' + roomId + '/messages').limitToLast(40);
      activeChatRef.on('child_added', (snap) => {
        const msg = snap.val();
        if (!msg) return;
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-bubble ' + (msg.senderUid === myUid ? 'outgoing' : 'incoming');
        msgDiv.textContent = msg.text;
        chatMessagesBox.appendChild(msgDiv);
        chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
      });
    } else {
      chatMessagesBox.innerHTML = `
        <div class="chat-bubble incoming">
          Chào ${shortName}, mình đang ở cách bạn ${peer.distM}m (hướng ${peer.dirText}). Mình nhận được yêu cầu "${appState.group}" của bạn rồi, mình qua hỗ trợ ngay nhé!
        </div>
      `;
    }

    safeChatModal.classList.add('open');
  }

  function sendChatMessage(text) {
    const clean = (text || '').trim();
    if (!clean || !activeChatPeer) return;
    const masked = clean.replace(/(0\d{2})\d{4}(\d{3})/g, '$1****$2');
    chatInputBox.value = '';

    if (rtdb && activeChatPeer.isRealUser && activeChatPeer.uid) {
      const roomId = [myUid, activeChatPeer.uid].sort().join('__');
      rtdb.ref('chats/' + roomId + '/messages').push({
        senderUid: myUid,
        senderName: appState.studentName,
        text: masked,
        createdAt: firebase.database.ServerValue.TIMESTAMP
      });
      return;
    }

    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-bubble outgoing';
    msgDiv.textContent = masked;
    chatMessagesBox.appendChild(msgDiv);
    chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;

    setTimeout(() => {
      if (!activeChatPeer) return;
      const reply = document.createElement('div');
      reply.className = 'chat-bubble incoming';
      reply.textContent = `Mình nhận được tin nhắn rồi, đang di chuyển tới (${Math.max(15, activeChatPeer.distM - 45)}m). Tới nơi mình sẽ mở mã QR xác thực nhé!`;
      chatMessagesBox.appendChild(reply);
      chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
    }, 750);
  }

  document.getElementById('sendChatBtn').addEventListener('click', () => sendChatMessage(chatInputBox.value));
  chatInputBox.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendChatMessage(chatInputBox.value);
  });
  document.querySelectorAll('.chat-quick-btn').forEach((b) => {
    b.addEventListener('click', () => sendChatMessage(b.textContent));
  });
  document.getElementById('closeChatModalBtn').addEventListener('click', () => {
    if (activeChatRef) {
      activeChatRef.off();
      activeChatRef = null;
    }
    safeChatModal.classList.remove('open');
  });

  // 10. Modal Thông tin cá nhân
  const profileModal = document.getElementById('profileModal');
  document.getElementById('openProfileModalBtn').addEventListener('click', () => {
    document.getElementById('inputStudentName').value = appState.studentName;
    document.getElementById('inputStudentEmail').value = appState.studentEmail;
    document.getElementById('inputStudentFaculty').value = appState.studentFaculty;
    profileModal.classList.add('open');
  });
  document.getElementById('closeProfileModalBtn').addEventListener('click', () => profileModal.classList.remove('open'));
  document.getElementById('saveProfileBtn').addEventListener('click', () => {
    const name = document.getElementById('inputStudentName').value.trim();
    const email = document.getElementById('inputStudentEmail').value.trim().toLowerCase();
    const faculty = document.getElementById('inputStudentFaculty').value;
    if (!name) {
      notify('⚠ Vui lòng nhập họ và tên.');
      return;
    }
    if (!email || !email.includes('@')) {
      notify('⚠ Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    appState.studentName = name;
    appState.studentEmail = email;
    appState.studentFaculty = faculty;
    saveState();
    syncAllUserUI();
    syncMyBeaconToCloud();
    profileModal.classList.remove('open');
    notify(`✓ Đã cập nhật thông tin cho ${name}!`);
  });

  // 11. Modal Chứng nhận & Đặt lại dữ liệu
  const certSheetModal = document.getElementById('certSheetModal');
  document.getElementById('openFullCertBtn').addEventListener('click', () => certSheetModal.classList.add('open'));
  document.getElementById('closeCertSheetBtn').addEventListener('click', () => certSheetModal.classList.remove('open'));

  document.getElementById('resetAppDemoBtn').addEventListener('click', () => {
    appState = Object.assign({}, defaultState);
    nearbyPeers.forEach((p) => (p.confirmed = false));
    saveState();
    syncAllUserUI();
    renderRadarAndNearbyList();
    profileModal.classList.remove('open');
    notify('↺ Đã đặt lại dữ liệu mặc định.');
  });

  // 12. Trình tạo mã QR chuẩn (Reed-Solomon QR Code)
  const QRGen = (function () {
    const EXP = new Array(256);
    const LOG = new Array(256);
    let x = 1;
    for (let i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x = (x << 1) ^ (x & 0x80 ? 0x11d : 0);
    }
    for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];

    function gfMul(a, b) {
      return a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]];
    }
    function rsGenerator(degree) {
      let poly = [1];
      for (let i = 0; i < degree; i++) {
        const next = new Array(poly.length + 1).fill(0);
        const factor = EXP[i];
        for (let j = 0; j < poly.length; j++) {
          next[j] ^= poly[j];
          next[j + 1] ^= gfMul(poly[j], factor);
        }
        poly = next;
      }
      return poly;
    }
    function rsEncode(data, ecLen) {
      const gen = rsGenerator(ecLen);
      const res = data.concat(new Array(ecLen).fill(0));
      for (let i = 0; i < data.length; i++) {
        const coef = res[i];
        if (coef !== 0) {
          for (let j = 0; j < gen.length; j++) res[i + j] ^= gfMul(gen[j], coef);
        }
      }
      return res.slice(data.length);
    }
    const VERSIONS = [
      null,
      { size: 21, totalCodewords: 26, ecCodewords: 7, dataCodewords: 19, align: [] },
      { size: 25, totalCodewords: 44, ecCodewords: 10, dataCodewords: 34, align: [6, 18] },
      { size: 29, totalCodewords: 70, ecCodewords: 15, dataCodewords: 55, align: [6, 22] },
      { size: 33, totalCodewords: 100, ecCodewords: 20, dataCodewords: 80, align: [6, 26] },
      { size: 37, totalCodewords: 134, ecCodewords: 26, dataCodewords: 108, align: [6, 30] },
      { size: 41, totalCodewords: 172, ecCodewords: 36, dataCodewords: 136, align: [6, 34] }
    ];
    function createMatrix(text) {
      const bytes = Array.from(new TextEncoder().encode(text));
      let ver = 1;
      while (ver < VERSIONS.length && bytes.length + 2 > VERSIONS[ver].dataCodewords) ver++;
      if (ver >= VERSIONS.length) ver = VERSIONS.length - 1;
      const cfg = VERSIONS[ver];
      const payload = bytes.slice(0, cfg.dataCodewords - 2);
      const bits = [];
      const pushBits = (val, len) => {
        for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
      };
      pushBits(0b0100, 4);
      pushBits(payload.length, 8);
      payload.forEach((b) => pushBits(b, 8));
      pushBits(0, Math.min(4, cfg.dataCodewords * 8 - bits.length));
      while (bits.length % 8 !== 0) bits.push(0);
      const dataCW = [];
      for (let i = 0; i < bits.length; i += 8) {
        let byte = 0;
        for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
        dataCW.push(byte);
      }
      const padBytes = [0xec, 0x11];
      let padIdx = 0;
      while (dataCW.length < cfg.dataCodewords) {
        dataCW.push(padBytes[padIdx % 2]);
        padIdx++;
      }
      const allCW = dataCW.concat(rsEncode(dataCW, cfg.ecCodewords));
      const allBits = [];
      allCW.forEach((cw) => {
        for (let i = 7; i >= 0; i--) allBits.push((cw >> i) & 1);
      });
      const n = cfg.size;
      const grid = Array.from({ length: n }, () => new Array(n).fill(null));
      const reserved = Array.from({ length: n }, () => new Array(n).fill(false));
      function setModule(r, c, val, isFunc = true) {
        if (r >= 0 && r < n && c >= 0 && c < n) {
          grid[r][c] = val ? 1 : 0;
          if (isFunc) reserved[r][c] = true;
        }
      }
      function placeFinder(r0, c0) {
        for (let r = -1; r <= 7; r++) {
          for (let c = -1; c <= 7; c++) {
            const inOuter = r >= 0 && r <= 6 && c >= 0 && c <= 6;
            const onBorder = r === 0 || r === 6 || c === 0 || c === 6;
            const inCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            setModule(r0 + r, c0 + c, inOuter && (onBorder || inCenter), true);
          }
        }
      }
      placeFinder(0, 0);
      placeFinder(0, n - 7);
      placeFinder(n - 7, 0);
      if (cfg.align.length > 0) {
        const center = cfg.align[1];
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            const dark = Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0);
            setModule(center + r, center + c, dark, true);
          }
        }
      }
      for (let i = 8; i < n - 8; i++) {
        setModule(6, i, i % 2 === 0, true);
        setModule(i, 6, i % 2 === 0, true);
      }
      setModule(n - 8, 8, 1, true);
      for (let i = 0; i < 9; i++) {
        if (i !== 6) {
          reserved[8][i] = true;
          reserved[i][8] = true;
        }
      }
      for (let i = 0; i < 8; i++) {
        reserved[8][n - 1 - i] = true;
        reserved[n - 1 - i][8] = true;
      }
      let bitIdx = 0;
      let upward = true;
      for (let col = n - 1; col > 0; col -= 2) {
        if (col === 6) col--;
        for (let i = 0; i < n; i++) {
          const r = upward ? n - 1 - i : i;
          for (let dc = 0; dc < 2; dc++) {
            const c = col - dc;
            if (!reserved[r][c]) {
              const rawBit = bitIdx < allBits.length ? allBits[bitIdx++] : 0;
              grid[r][c] = (r + c) % 2 === 0 ? rawBit ^ 1 : rawBit;
            }
          }
        }
        upward = !upward;
      }
      const formatBits = 0x77c4;
      for (let i = 0; i < 15; i++) {
        const bit = (formatBits >> i) & 1;
        if (i < 6) grid[i][8] = bit;
        else if (i < 8) grid[i + 1][8] = bit;
        else grid[n - 15 + i][8] = bit;
        if (i < 8) grid[8][n - 1 - i] = bit;
        else if (i === 8) grid[8][7] = bit;
        else grid[8][14 - i] = bit;
      }
      return grid;
    }
    return { createMatrix };
  })();

  const mobileQrHolder = document.getElementById('mobileQrHolder');
  const customMvpLinkInput = document.getElementById('customMvpLinkInput');
  const qrLinkCaption = document.getElementById('qrLinkCaption');

  const initialUrl = window.location.protocol.startsWith('http')
    ? window.location.href.split('#')[0]
    : 'https://khanhtanchi21.github.io/hnue-warmlink/';
  customMvpLinkInput.value = initialUrl;

  let qrMatrix = [];
  function drawMobileQr(urlStr) {
    const clean = (urlStr || initialUrl).trim();
    qrLinkCaption.textContent = clean;
    qrMatrix = QRGen.createMatrix(clean);
    const n = qrMatrix.length;
    const quiet = 2;
    const total = n + quiet * 2;
    let rects = '';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (qrMatrix[r][c] === 1) {
          rects += `<rect x="${c + quiet}" y="${r + quiet}" width="1" height="1" rx="0.18" fill="#0f172a"/>`;
        }
      }
    }
    mobileQrHolder.innerHTML = `<svg width="172" height="172" viewBox="0 0 ${total} ${total}" xmlns="http://www.w3.org/2000/svg"><rect width="${total}" height="${total}" fill="#ffffff"/>${rects}</svg>`;
  }
  drawMobileQr(customMvpLinkInput.value);

  customMvpLinkInput.addEventListener('input', () => {
    drawMobileQr(customMvpLinkInput.value);
  });

  document.getElementById('regenQrBtn').addEventListener('click', () => {
    drawMobileQr(customMvpLinkInput.value);
    if (!qrMatrix.length) return;
    const n = qrMatrix.length;
    const quiet = 3;
    const scale = 18;
    const size = (n + quiet * 2) * scale;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#0f172a';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (qrMatrix[r][c] === 1) ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
      }
    }
    const a = document.createElement('a');
    a.download = 'QR-HNUE-WarmLink.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
    notify('⬇ Đã tải ảnh mã QR (QR-HNUE-WarmLink.png)!');
  });

  document.getElementById('copyCurrentPageLinkBtn').addEventListener('click', async () => {
    const shareUrl = customMvpLinkInput.value.trim() || window.location.href;
    try {
      await navigator.clipboard.writeText(shareUrl);
      notify('📋 Đã sao chép liên kết chia sẻ!');
    } catch (e) {
      notify('📋 Liên kết: ' + shareUrl);
    }
  });

  // Khởi tạo giao diện
  syncAllUserUI();
  updateGpsDisplays();
})();