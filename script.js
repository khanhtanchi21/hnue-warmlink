(function () {
  'use strict';

  // 0. Khởi tạo Firebase (Auth + Realtime Database)
  const firebaseConfig = {
    apiKey: "AIzaSyCV3MdX8zQ1bPpYocMphIDubr_KpZnmnEc",
    authDomain: "hnue-warmlink.firebaseapp.com",
    databaseURL: "[https://hnue-warmlink-default-rtdb.asia-southeast1.firebasedatabase.app](https://hnue-warmlink-default-rtdb.asia-southeast1.firebasedatabase.app)",
    projectId: "hnue-warmlink",
    storageBucket: "hnue-warmlink.firebasestorage.app",
    messagingSenderId: "462605682082",
    appId: "1:462605682082:web:812168b291174b181c1efb",
    measurementId: "G-ELBFFLS61V"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const auth = firebase.auth();
  const rtdb = firebase.database();

  // 1. Danh sách đầy đủ địa điểm chia theo 4 khu vực tại Trường ĐHSP Hà Nội
  const HNUE_LANDMARKS = [
    // KHU HÀNH CHÍNH
    { value: 'Nhà hiệu bộ', zone: 'hanh_chinh', zoneLabel: 'Khu Hành chính', detail: 'Nhà hiệu bộ', lat: 21.0372, lng: 105.7834 },
    { value: 'Trung tâm thông tin thư viện', zone: 'hanh_chinh', zoneLabel: 'Khu Hành chính', detail: 'Trung tâm thông tin thư viện', lat: 21.0375, lng: 105.7827 },
    { value: 'Hội trường 11.10', zone: 'hanh_chinh', zoneLabel: 'Khu Hành chính', detail: 'Hội trường 11.10', lat: 21.0370, lng: 105.7831 },

    // KHU GIẢNG ĐƯỜNG
    { value: 'Nhà A2', zone: 'giang_duong', zoneLabel: 'Khu Giảng đường', detail: 'A2: Giảng đường, phòng thí nghiệm khoa Hoá, Sinh, Sư phạm Kỹ Thuật', lat: 21.0381, lng: 105.7829 },
    { value: 'Nhà A3', zone: 'giang_duong', zoneLabel: 'Khu Giảng đường', detail: 'A3: Khoa Sinh Học, phòng thí nghiệm khoa Hoá', lat: 21.0383, lng: 105.7825 },
    { value: 'Nhà A4', zone: 'giang_duong', zoneLabel: 'Khu Giảng đường', detail: 'A4: Khoa Lý luận Chính trị - Giáo dục Công dân, khoa Hoá', lat: 21.0385, lng: 105.7821 },
    { value: 'Nhà B1', zone: 'giang_duong', zoneLabel: 'Khu Giảng đường', detail: 'B1: Hội trường', lat: 21.0376, lng: 105.7838 },
    { value: 'Nhà B2', zone: 'giang_duong', zoneLabel: 'Khu Giảng đường', detail: 'B2: Khoa Ngữ Văn, khoa Lịch Sử, khoa Triết Học', lat: 21.0374, lng: 105.7840 },
    { value: 'Nhà C', zone: 'giang_duong', zoneLabel: 'Khu Giảng đường', detail: 'C: Khoa Toán - Tin, khoa Công nghệ thông tin, khoa Vật lý', lat: 21.0377, lng: 105.7845 },
    { value: 'Nhà D3', zone: 'giang_duong', zoneLabel: 'Khu Giảng đường', detail: 'D3: Khoa Tiếng Anh, khoa Việt Nam Học, khoa Quản lý Giáo dục, khoa Công Tác Xã Hội, khoa Ngôn ngữ và Văn hoá Trung Quốc, khoa Nghệ Thuật, bảo tàng sinh vật', lat: 21.0365, lng: 105.7850 },
    { value: 'Nhà D1, D2, D4', zone: 'giang_duong', zoneLabel: 'Khu Giảng đường', detail: 'D1, D2, D4: Trường THPT Chuyên Sư Phạm', lat: 21.0367, lng: 105.7846 },
    { value: 'Nhà H8', zone: 'giang_duong', zoneLabel: 'Khu Giảng đường', detail: 'H8: Nhà công vụ cho cán bộ nước ngoài', lat: 21.0388, lng: 105.7832 },
    { value: 'Nhà M1, M2, M3, M4', zone: 'giang_duong', zoneLabel: 'Khu Giảng đường', detail: 'M1, M2, M3, M4: Trường THCS, THPT Nguyễn Tất Thành', lat: 21.0359, lng: 105.7833 },
    { value: 'Nhà N', zone: 'giang_duong', zoneLabel: 'Khu Giảng đường', detail: 'N: Nhà xuất bản Đại học Sư phạm Hà Nội, trung tâm nghiên cứu và sản xuất học liệu, trung Tâm Phát Triển Giáo Dục và Công Nghệ Số', lat: 21.0363, lng: 105.7837 },
    { value: 'Nhà K1', zone: 'giang_duong', zoneLabel: 'Khu Giảng đường', detail: 'K1: Giảng đường, các trung tâm nghiên cứu khoa học công nghệ và quan hệ quốc tế', lat: 21.0381, lng: 105.7836 },
    { value: 'Nhà K2', zone: 'giang_duong', zoneLabel: 'Khu Giảng đường', detail: 'K2: Nhà trẻ Búp Sen Xanh', lat: 21.0383, lng: 105.7839 },
    { value: 'Nhà K3', zone: 'giang_duong', zoneLabel: 'Khu Giảng đường', detail: 'K3: Trung tâm giáo dục đặc biệt', lat: 21.0385, lng: 105.7841 },
    { value: 'Nhà KT', zone: 'giang_duong', zoneLabel: 'Khu Giảng đường', detail: 'KT: Tiểu học Nguyễn Tất Thành', lat: 21.0360, lng: 105.7829 },
    { value: 'Nhà luyện tập và thi đấu thể dục thể thao', zone: 'giang_duong', zoneLabel: 'Khu Giảng đường', detail: 'Nhà luyện tập và thi đấu thể dục thể thao', lat: 21.0389, lng: 105.7848 },
    { value: 'Khoa Giáo dục Thể chất', zone: 'giang_duong', zoneLabel: 'Khu Giảng đường', detail: 'Khoa Giáo dục Thể chất', lat: 21.0387, lng: 105.7846 },
    { value: 'Nhà V', zone: 'giang_duong', zoneLabel: 'Khu Giảng đường', detail: 'V: Giảng đường, khoa Giáo dục Thể chất, khoa Giáo dục Đặc biệt, khoa Giáo dục Tiểu học, khoa Sư phạm Kỹ thuật, khoa Giáo dục Mầm non, khoa Giáo dục Quốc phòng và An ninh, khoa Địa lý, khoa Tâm lý Giáo dục, Viện Nghiên cứu Sư phạm, phòng làm việc giáo sư, bộ môn Tiếng Nga, khoa Tiếng Pháp', lat: 21.0384, lng: 105.7843 },

    // KHU KÝ TÚC XÁ
    { value: 'Nhà A5 (Ký túc xá)', zone: 'ky_tuc_xa', zoneLabel: 'Khu Ký túc xá', detail: 'A5: Ký túc xá', lat: 21.0391, lng: 105.7817 },
    { value: 'Nhà A6 (Ký túc xá)', zone: 'ky_tuc_xa', zoneLabel: 'Khu Ký túc xá', detail: 'A6: Ký túc xá', lat: 21.0393, lng: 105.7819 },
    { value: 'Nhà A8 (Ký túc xá, phòng y tế)', zone: 'ky_tuc_xa', zoneLabel: 'Khu Ký túc xá', detail: 'A8: Ký túc xá, phòng y tế', lat: 21.0395, lng: 105.7821 },
    { value: 'Nhà A9 (Ký túc xá)', zone: 'ky_tuc_xa', zoneLabel: 'Khu Ký túc xá', detail: 'A9: Ký túc xá', lat: 21.0397, lng: 105.7823 },
    { value: 'Nhà A10 (Căng tin)', zone: 'ky_tuc_xa', zoneLabel: 'Khu Ký túc xá', detail: 'A10: Căng tin', lat: 21.0394, lng: 105.7825 },
    { value: 'Nhà A11 (Ký túc xá)', zone: 'ky_tuc_xa', zoneLabel: 'Khu Ký túc xá', detail: 'A11: Ký túc xá', lat: 21.0399, lng: 105.7824 },
    { value: 'Nhà A12 (Ký túc xá)', zone: 'ky_tuc_xa', zoneLabel: 'Khu Ký túc xá', detail: 'A12: Ký túc xá', lat: 21.0401, lng: 105.7827 },

    // CÁC KHU VỰC KHÁC
    { value: 'Chùa Thánh Chúa', zone: 'khu_vuc_khac', zoneLabel: 'Các khu vực khác', detail: 'Chùa Thánh Chúa', lat: 21.0379, lng: 105.7816 },
    { value: 'Vườn thực nghiệm', zone: 'khu_vuc_khac', zoneLabel: 'Các khu vực khác', detail: 'Vườn thực nghiệm', lat: 21.0392, lng: 105.7836 },
    { value: 'Con đường tình yêu', zone: 'khu_vuc_khac', zoneLabel: 'Các khu vực khác', detail: 'Con đường tình yêu', lat: 21.0378, lng: 105.7832 },
    { value: 'Sân đa năng', zone: 'khu_vuc_khac', zoneLabel: 'Các khu vực khác', detail: 'Sân đa năng', lat: 21.0385, lng: 105.7850 },
    { value: 'Sân vận động', zone: 'khu_vuc_khac', zoneLabel: 'Các khu vực khác', detail: 'Sân vận động', lat: 21.0386, lng: 105.7854 }
  ];

  // 2. State người dùng hiện tại (100% đồng bộ từ cơ sở dữ liệu)
  let currentUser = null;
  let userProfile = {
    uid: '',
    name: '',
    email: '',
    studentId: '',
    faculty: 'Khoa Công nghệ thông tin',
    points: 0,
    helps: 0,
    history: []
  };

  const remoteBeacons = {};
  const remoteSosSignals = {};
  let globalStats = {
    totalHelps: 0,
    areas: { hanh_chinh: 0, giang_duong: 0, ky_tuc_xa: 0, khu_vuc_khac: 0 },
    faculties: {}
  };

  let myActiveSos = null;
  let lastNotifiedSosKey = '';

  function sanitizeRtdbKey(keyStr) {
    return String(keyStr || 'Khac').replace(/[.#$\[\]\/]/g, '-').trim();
  }

  // 3. Toast thông báo
  const mobileToast = document.getElementById('mobileToast');
  let toastTimer = null;
  function notify(msg) {
    mobileToast.textContent = msg;
    mobileToast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => mobileToast.classList.remove('show'), 3800);
  }

  // 4. Xác thực tài khoản (Firebase Auth)
  const authGateOverlay = document.getElementById('authGateOverlay');
  const authTabLogin = document.getElementById('authTabLogin');
  const authTabRegister = document.getElementById('authTabRegister');
  const loginFormBox = document.getElementById('loginFormBox');
  const registerFormBox = document.getElementById('registerFormBox');
  const authErrorBox = document.getElementById('authErrorBox');

  function showAuthError(msg) {
    if (!msg) {
      authErrorBox.style.display = 'none';
      return;
    }
    authErrorBox.textContent = msg;
    authErrorBox.style.display = 'block';
  }

  function mapFirebaseAuthError(err) {
    const code = err && err.code ? err.code : '';
    if (code === 'auth/email-already-in-use') return 'Email này đã được đăng ký. Hãy chuyển sang tab Đăng nhập.';
    if (code === 'auth/invalid-email') return 'Địa chỉ email không hợp lệ.';
    if (code === 'auth/weak-password') return 'Mật khẩu cần có ít nhất 6 ký tự.';
    if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      return 'Email hoặc mật khẩu chưa chính xác.';
    }
    if (code === 'auth/operation-not-allowed') {
      return 'Chưa bật phương thức đăng nhập này trong Firebase Authentication.';
    }
    if (code === 'auth/unauthorized-domain') {
      return 'Tên miền chưa được thêm vào Authorized domains trong Firebase.';
    }
    return 'Lỗi xác thực: ' + (err.message || 'Vui lòng thử lại.');
  }

  authTabLogin.addEventListener('click', () => {
    authTabLogin.classList.add('active');
    authTabRegister.classList.remove('active');
    loginFormBox.style.display = 'block';
    registerFormBox.style.display = 'none';
    showAuthError('');
  });

  authTabRegister.addEventListener('click', () => {
    authTabRegister.classList.add('active');
    authTabLogin.classList.remove('active');
    registerFormBox.style.display = 'block';
    loginFormBox.style.display = 'none';
    showAuthError('');
  });

  document.getElementById('btnEmailRegister').addEventListener('click', async () => {
    const name = document.getElementById('regNameInput').value.trim();
    const studentId = document.getElementById('regStudentIdInput').value.trim();
    const email = document.getElementById('regEmailInput').value.trim().toLowerCase();
    const faculty = document.getElementById('regFacultySelect').value;
    const password = document.getElementById('regPasswordInput').value;

    if (!name) return showAuthError('Vui lòng nhập họ và tên.');
    if (!email || !email.includes('@')) return showAuthError('Vui lòng nhập địa chỉ email hợp lệ.');
    if (password.length < 6) return showAuthError('Mật khẩu phải từ 6 ký tự trở lên.');

    showAuthError('');
    try {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      await cred.user.updateProfile({ displayName: name });
      await rtdb.ref('users/' + cred.user.uid).set({
        uid: cred.user.uid,
        name: name,
        email: email,
        studentId: studentId,
        faculty: faculty,
        points: 0,
        helps: 0,
        createdAt: firebase.database.ServerValue.TIMESTAMP
      });
      notify(`🎉 Chào mừng ${name} tham gia HNUE WarmLink!`);
    } catch (err) {
      showAuthError(mapFirebaseAuthError(err));
    }
  });

  document.getElementById('btnEmailLogin').addEventListener('click', async () => {
    const email = document.getElementById('loginEmailInput').value.trim().toLowerCase();
    const password = document.getElementById('loginPasswordInput').value;
    if (!email || !password) return showAuthError('Vui lòng nhập đầy đủ Email và Mật khẩu.');

    showAuthError('');
    try {
      await auth.signInWithEmailAndPassword(email, password);
      notify('✓ Đăng nhập thành công!');
    } catch (err) {
      showAuthError(mapFirebaseAuthError(err));
    }
  });

  document.getElementById('btnGoogleLogin').addEventListener('click', async () => {
    showAuthError('');
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await auth.signInWithPopup(provider);
      const u = result.user;
      const snap = await rtdb.ref('users/' + u.uid).once('value');
      if (!snap.exists()) {
        await rtdb.ref('users/' + u.uid).set({
          uid: u.uid,
          name: u.displayName || u.email.split('@')[0],
          email: u.email,
          studentId: '',
          faculty: 'Khoa Công nghệ thông tin',
          points: 0,
          helps: 0,
          createdAt: firebase.database.ServerValue.TIMESTAMP
        });
      }
      notify(`✓ Đã đăng nhập với ${u.email}`);
    } catch (err) {
      showAuthError(mapFirebaseAuthError(err));
    }
  });

  let activeListenerUid = null;
  let globalListenersAttached = false;

  auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    if (!user) {
      if (activeListenerUid) {
        rtdb.ref('users/' + activeListenerUid).off();
        activeListenerUid = null;
      }
      authGateOverlay.classList.remove('hidden');
      return;
    }

    authGateOverlay.classList.add('hidden');
    const userRef = rtdb.ref('users/' + user.uid);
    const snap = await userRef.once('value');
    if (!snap.exists()) {
      await userRef.set({
        uid: user.uid,
        name: user.displayName || (user.email ? user.email.split('@')[0] : 'Thành viên HNUE'),
        email: user.email || '',
        studentId: '',
        faculty: 'Khoa Công nghệ thông tin',
        points: 0,
        helps: 0,
        createdAt: firebase.database.ServerValue.TIMESTAMP
      });
    }

    if (activeListenerUid && activeListenerUid !== user.uid) {
      rtdb.ref('users/' + activeListenerUid).off();
      activeListenerUid = null;
    }

    if (!activeListenerUid) {
      activeListenerUid = user.uid;
      rtdb.ref('users/' + user.uid).on('value', (userSnap) => {
        const val = userSnap.val();
        if (!val) return;
        const histObj = val.history || {};
        const histArray = Object.values(histObj).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        userProfile = {
          uid: user.uid,
          name: val.name || 'Thành viên HNUE',
          email: val.email || user.email || '',
          studentId: val.studentId || '',
          faculty: val.faculty || 'Khoa Công nghệ thông tin',
          points: Number(val.points || 0),
          helps: Number(val.helps || 0),
          history: histArray
        };
        syncAllUserUI();
      });
    }

    if (!globalListenersAttached) {
      globalListenersAttached = true;
      attachGlobalRealtimeListeners();
    }
  });

  // 5. Đồng bộ Realtime Database (chỉ lấy dữ liệu công khai cần thiết cho Radar & Bản đồ nhiệt)
  function attachGlobalRealtimeListeners() {
    rtdb.ref('beacons').on('value', (snap) => {
      const data = snap.val() || {};
      const now = Date.now();
      const myUid = currentUser ? currentUser.uid : '';
      Object.keys(remoteBeacons).forEach((k) => delete remoteBeacons[k]);

      Object.keys(data).forEach((uid) => {
        if (uid === myUid) return;
        const b = data[uid];
        if (b && typeof b.lat === 'number' && (!b.updatedAt || now - b.updatedAt < 1800000)) {
          const initials = (b.name || 'TV')
            .split(' ')
            .slice(-2)
            .map((w) => w[0] || '')
            .join('')
            .toUpperCase();

          remoteBeacons[uid] = {
            id: uid,
            uid: uid,
            type: 'volunteer',
            initials: initials || 'TV',
            name: b.name,
            faculty: b.faculty || 'HNUE',
            skill: b.isLiveGps ? 'Đang bật GPS trực tuyến' : 'Sẵn sàng hỗ trợ',
            lat: b.lat,
            lng: b.lng
          };
        }
      });
      renderRadarAndNearbyList();
    });

    rtdb.ref('sos_signals').on('value', (snap) => {
      const data = snap.val() || {};
      const now = Date.now();
      const myUid = currentUser ? currentUser.uid : '';
      const hadActiveSos = Boolean(myActiveSos);
      Object.keys(remoteSosSignals).forEach((k) => delete remoteSosSignals[k]);
      myActiveSos = null;

      let newestIncoming = null;
      Object.keys(data).forEach((uid) => {
        const sos = data[uid];
        if (!sos) return;
        if (uid === myUid) {
          myActiveSos = sos;
          return;
        }
        if (!sos.createdAt || now - sos.createdAt < 3600000) {
          remoteSosSignals[uid] = sos;
          if (!newestIncoming || (sos.createdAt || 0) > (newestIncoming.createdAt || 0)) {
            newestIncoming = sos;
          }
        }
      });

      if (hadActiveSos && !myActiveSos) {
        document.getElementById('showVerifyQrModal').classList.remove('open');
        notify('✓ Lượt hỗ trợ của bạn đã được xác minh hoàn tất!');
      }

      renderMyActiveSosBanner();
      renderIncomingSosList();
      renderRadarAndNearbyList();

      if (newestIncoming) {
        const key = newestIncoming.uid + '_' + (newestIncoming.createdAt || '');
        if (key !== lastNotifiedSosKey) {
          lastNotifiedSosKey = key;
          const dist = haversineMeters(gpsState.lat, gpsState.lng, newestIncoming.lat, newestIncoming.lng);
          notify(`🆘 ${newestIncoming.name} tại ${newestIncoming.area} (cách ${dist}m) cần hỗ trợ!`);
        }
      }
    });

    rtdb.ref('stats').on('value', (snap) => {
      const val = snap.val() || {};
      globalStats = {
        totalHelps: Number(val.totalHelps || 0),
        areas: Object.assign({ hanh_chinh: 0, giang_duong: 0, ky_tuc_xa: 0, khu_vuc_khac: 0 }, val.areas || {}),
        faculties: val.faculties || {}
      };
      renderHeatmapAndLeaderboard();
    });
  }

  // 6. Định vị GPS & Chọn địa điểm 4 khu vực
  const gpsState = {
    isLive: false,
    lat: 21.0372,
    lng: 105.7834,
    accuracy: 12,
    watchId: null,
    beaconOn: false
  };

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

  function detectNearestHnueLandmark(lat, lng) {
    let best = HNUE_LANDMARKS[0];
    let minDist = Infinity;
    HNUE_LANDMARKS.forEach((lm) => {
      const d = haversineMeters(lat, lng, lm.lat, lm.lng);
      if (d < minDist) {
        minDist = d;
        best = lm;
      }
    });
    return {
      landmark: best,
      distance: minDist,
      label: minDist <= 1200 ? `${best.value} (cách ~${minDist}m)` : `Tọa độ GPS (${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E)`
    };
  }

  const hnueAreaSelect = document.getElementById('hnueAreaSelect');
  const selectedAreaDetailText = document.getElementById('selectedAreaDetailText');

  function updateAreaDetailNote() {
    const chosenVal = hnueAreaSelect.value;
    const found = HNUE_LANDMARKS.find((lm) => lm.value === chosenVal);
    if (found) {
      selectedAreaDetailText.textContent = `${found.zoneLabel} • ${found.detail}`;
      document.getElementById('gpsDetectedPlace1').textContent = `📍 Khu vực: ${found.value}`;
      if (!gpsState.isLive) {
        gpsState.lat = found.lat;
        gpsState.lng = found.lng;
        updateGpsDisplays();
      }
    } else if (gpsState.isLive) {
      const detected = detectNearestHnueLandmark(gpsState.lat, gpsState.lng);
      selectedAreaDetailText.textContent = `Định vị GPS vệ tinh • Gần nhất: ${detected.landmark.detail}`;
      document.getElementById('gpsDetectedPlace1').textContent = `📍 ${detected.label}`;
    } else {
      selectedAreaDetailText.textContent = 'Bấm "Bật GPS thật" để lấy tọa độ vị trí hiện tại của bạn';
    }
  }

  hnueAreaSelect.addEventListener('change', updateAreaDetailNote);

  function syncMyBeaconToFirebase() {
    if (!currentUser) return;
    const ref = rtdb.ref('beacons/' + currentUser.uid);
    if (gpsState.beaconOn) {
      ref.onDisconnect().remove();
      ref.set({
        uid: currentUser.uid,
        name: userProfile.name,
        faculty: userProfile.faculty,
        lat: gpsState.lat,
        lng: gpsState.lng,
        isLiveGps: gpsState.isLive,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
      });
    } else {
      ref.remove();
    }
  }

  function updateGpsDisplays() {
    const latStr = gpsState.lat.toFixed(5) + '° N';
    const lngStr = gpsState.lng.toFixed(5) + '° E';
    const accStr = `±${Math.round(gpsState.accuracy)}m`;

    const headerGpsBtn = document.getElementById('headerGpsBtn');
    const headerGpsLabel = document.getElementById('headerGpsLabel');
    headerGpsBtn.classList.toggle('is-live', gpsState.isLive);
    headerGpsLabel.textContent = gpsState.isLive ? `GPS: ${accStr}` : 'Bật GPS';

    const btn1 = document.getElementById('enableRealGpsBtn1');
    const txt1 = document.getElementById('enableRealGpsText1');
    const btn2 = document.getElementById('enableRealGpsBtn2');
    const txt2 = document.getElementById('enableRealGpsText2');

    if (gpsState.isLive) {
      btn1.classList.add('is-active');
      txt1.textContent = 'Đang định vị';
      btn2.classList.add('is-active');
      txt2.textContent = 'GPS Live';
      const detected = detectNearestHnueLandmark(gpsState.lat, gpsState.lng);
      document.getElementById('gpsCoordsDisplay1').textContent = `📡 GPS: ${latStr} | ${lngStr} (${accStr})`;
      document.getElementById('gpsDetectedPlace1').textContent = `📍 Gần nhất: ${detected.label}`;
      document.getElementById('radarGpsTitle').textContent = `📡 Tâm định vị: ${detected.label}`;
    } else {
      btn1.classList.remove('is-active');
      txt1.textContent = 'Bật GPS thật';
      btn2.classList.remove('is-active');
      txt2.textContent = 'Bật GPS';
      document.getElementById('gpsCoordsDisplay1').textContent = `Chưa bật GPS • Tọa độ điểm: ${latStr} | ${lngStr}`;
    }

    document.getElementById('radarGpsExact').textContent = `Lat: ${latStr} | Lng: ${lngStr} (${accStr})`;
    syncMyBeaconToFirebase();
    renderIncomingSosList();
    renderRadarAndNearbyList();
  }

  function activateRealGeolocation() {
    if (!('geolocation' in navigator)) {
      notify('⚠ Trình duyệt không hỗ trợ định vị GPS.');
      return;
    }
    notify('📡 Đang lấy tọa độ GPS của bạn...');
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
        hnueAreaSelect.value = 'Vị trí GPS thực tế hiện tại của bạn';
        updateAreaDetailNote();
        updateGpsDisplays();
        if (firstTime) notify('✓ Đã khóa tọa độ GPS thực tế!');
      },
      (err) => {
        gpsState.isLive = false;
        updateGpsDisplays();
        notify(
          err.code === 1
            ? '⚠ Hãy cấp quyền Vị trí (Location) cho trình duyệt để định vị chính xác.'
            : '⚠ Không lấy được tín hiệu GPS. Hãy bật Vị trí trên thiết bị.'
        );
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
    if (gpsState.beaconOn && !gpsState.isLive) {
      activateRealGeolocation();
    }
    syncMyBeaconToFirebase();
    notify(
      gpsState.beaconOn
        ? '🔥 Đã bật “Người Thắp Lửa”! Vị trí của bạn đang hiển thị trên Radar.'
        : 'Đã tắt chế độ Người Thắp Lửa.'
    );
  });

  // 7. Quy trình Mã QR / Mã PIN 4 số xác minh hỗ trợ (Đa nền tảng iOS + Android + Desktop)
  const showVerifyQrModal = document.getElementById('showVerifyQrModal');
  const sosVerifyQrHolder = document.getElementById('sosVerifyQrHolder');
  const sosVerifyPinText = document.getElementById('sosVerifyPinText');
  const chatWithMyHelperBtn = document.getElementById('chatWithMyHelperBtn');
  const myActiveSosActions = document.getElementById('myActiveSosActions');

  function renderMyActiveSosBanner() {
    const banner = document.getElementById('myActiveSosBanner');
    if (!myActiveSos) {
      banner.style.display = 'none';
      return;
    }
    banner.style.display = 'block';
    const statusTag = document.getElementById('myActiveSosStatusTag');
    const textEl = document.getElementById('myActiveSosText');

    if (myActiveSos.helperUid && myActiveSos.helperName) {
      statusTag.textContent = `✓ ${myActiveSos.helperName} đang hỗ trợ`;
      statusTag.style.background = '#dcfce7';
      statusTag.style.color = '#15803d';
      chatWithMyHelperBtn.style.display = 'inline-flex';
      myActiveSosActions.style.gridTemplateColumns = '1.4fr 1fr 0.75fr';
    } else {
      statusTag.textContent = 'Đang phát sóng...';
      statusTag.style.background = '#ffffff';
      statusTag.style.color = '#e11d48';
      chatWithMyHelperBtn.style.display = 'none';
      myActiveSosActions.style.gridTemplateColumns = '1.6fr 0.8fr';
    }
    textEl.textContent = `[${myActiveSos.group} • ${myActiveSos.area}] ${myActiveSos.message}`;
  }

  chatWithMyHelperBtn.addEventListener('click', () => {
    if (!myActiveSos || !myActiveSos.helperUid) return;
    openSafeChat({
      uid: myActiveSos.helperUid,
      name: myActiveSos.helperName || 'Người Thắp Lửa',
      faculty: 'ĐHSP Hà Nội',
      distM: 0,
      dirText: 'gần bạn'
    });
  });

  document.getElementById('showVerifyQrBtn').addEventListener('click', () => {
    if (!myActiveSos) return;
    const pin = String(myActiveSos.verifyPin || '1234');
    const qrPayload = `HNUEWL:${myActiveSos.uid}:${pin}`;
    renderQrSvgInto(sosVerifyQrHolder, qrPayload, 190);
    sosVerifyPinText.textContent = pin;
    showVerifyQrModal.classList.add('open');
  });

  document.getElementById('closeShowVerifyQrBtn').addEventListener('click', () => {
    showVerifyQrModal.classList.remove('open');
  });

  document.getElementById('cancelMySosBtn').addEventListener('click', async () => {
    if (!currentUser) return;
    await rtdb.ref('sos_signals/' + currentUser.uid).remove();
    notify('Đã hủy tín hiệu SOS của bạn.');
  });

  // Modal Quét QR / Nhập mã 4 số dành cho Người hỗ trợ
  const scanVerifyQrModal = document.getElementById('scanVerifyQrModal');
  const cameraScanBox = document.getElementById('cameraScanBox');
  const qrScannerVideo = document.getElementById('qrScannerVideo');
  const cameraScanStatus = document.getElementById('cameraScanStatus');
  const manualVerifyPinInput = document.getElementById('manualVerifyPinInput');
  const offscreenScanCanvas = document.createElement('canvas');
  const offscreenScanCtx = offscreenScanCanvas.getContext('2d', { willReadFrequently: true });

  let activeVerifyTargetSos = null;
  let cameraStream = null;
  let scanIntervalId = null;
  let isVerifyingNow = false;

  function stopVerifyCamera() {
    if (scanIntervalId) {
      clearInterval(scanIntervalId);
      scanIntervalId = null;
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      cameraStream = null;
    }
    qrScannerVideo.srcObject = null;
  }

  function handleDecodedQrString(rawText) {
    const raw = String(rawText || '').trim();
    if (!raw.startsWith('HNUEWL:')) return false;
    const parts = raw.split(':');
    const targetUid = parts[1] || '';
    const scannedPin = parts[2] || '';
    if (scannedPin.length === 4) {
      if (targetUid && remoteSosSignals[targetUid]) {
        activeVerifyTargetSos = remoteSosSignals[targetUid];
      }
      manualVerifyPinInput.value = scannedPin;
      verifyAndCompleteSos(scannedPin);
      return true;
    }
    return false;
  }

  async function startVerifyCamera() {
    manualVerifyPinInput.value = '';
    cameraScanBox.style.display = 'flex';
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      cameraScanBox.style.display = 'none';
      cameraScanStatus.textContent = 'Thiết bị không có camera trực tiếp — hãy nhập mã 4 số bên dưới.';
      return;
    }
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      qrScannerVideo.srcObject = cameraStream;
      await qrScannerVideo.play();

      const hasNativeDetector = 'BarcodeDetector' in window;
      const hasJsQr = typeof window.jsQR === 'function';

      if (hasNativeDetector || hasJsQr) {
        cameraScanStatus.textContent = '📷 Đưa mã QR trên màn hình người được giúp vào khung xanh...';
        const nativeDetector = hasNativeDetector ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null;

        scanIntervalId = setInterval(async () => {
          if (!activeVerifyTargetSos || isVerifyingNow || qrScannerVideo.readyState < 2) return;

          if (nativeDetector) {
            try {
              const codes = await nativeDetector.detect(qrScannerVideo);
              if (codes && codes.length > 0 && handleDecodedQrString(codes[0].rawValue)) {
                return;
              }
            } catch (e) {}
          }

          if (hasJsQr && qrScannerVideo.videoWidth > 0 && qrScannerVideo.videoHeight > 0) {
            try {
              const w = Math.min(480, qrScannerVideo.videoWidth);
              const h = Math.round((qrScannerVideo.videoHeight / qrScannerVideo.videoWidth) * w);
              offscreenScanCanvas.width = w;
              offscreenScanCanvas.height = h;
              offscreenScanCtx.drawImage(qrScannerVideo, 0, 0, w, h);
              const imgData = offscreenScanCtx.getImageData(0, 0, w, h);
              const code = window.jsQR(imgData.data, w, h, { inversionAttempts: 'dontInvert' });
              if (code && code.data) {
                handleDecodedQrString(code.data);
              }
            } catch (e) {}
          }
        }, 380);
      } else {
        cameraScanStatus.textContent = 'Nhập nhanh mã 4 số từ màn hình người được giúp bên dưới.';
      }
    } catch (err) {
      cameraScanBox.style.display = 'none';
      cameraScanStatus.textContent = 'Chưa mở được camera — hãy nhập trực tiếp mã 4 số bên dưới.';
    }
  }

  function openScanVerifyModal(sos) {
    activeVerifyTargetSos = sos;
    isVerifyingNow = false;
    document.getElementById('scanVerifyTargetDesc').textContent =
      `Quét mã QR hoặc nhập mã 4 số từ ${sos.name} để xác nhận hoàn tất`;
    scanVerifyQrModal.classList.add('open');
    startVerifyCamera();
  }

  function closeScanVerifyModal() {
    stopVerifyCamera();
    activeVerifyTargetSos = null;
    isVerifyingNow = false;
    scanVerifyQrModal.classList.remove('open');
  }

  document.getElementById('closeScanVerifyQrBtn').addEventListener('click', closeScanVerifyModal);

  manualVerifyPinInput.addEventListener('input', () => {
    manualVerifyPinInput.value = manualVerifyPinInput.value.replace(/\D/g, '').slice(0, 4);
    if (manualVerifyPinInput.value.length === 4) {
      verifyAndCompleteSos(manualVerifyPinInput.value);
    }
  });

  async function verifyAndCompleteSos(enteredCode) {
    if (!currentUser || !activeVerifyTargetSos || isVerifyingNow) return;
    const cleanPin = String(enteredCode || '').trim();
    if (cleanPin.length !== 4) {
      notify('⚠ Vui lòng nhập đủ 4 chữ số xác nhận.');
      return;
    }

    isVerifyingNow = true;
    try {
      const sosSnap = await rtdb.ref('sos_signals/' + activeVerifyTargetSos.uid).once('value');
      const liveSos = sosSnap.val();
      if (!liveSos) {
        closeScanVerifyModal();
        notify('Tín hiệu hỗ trợ này đã được đóng trước đó.');
        return;
      }

      if (String(liveSos.verifyPin) !== cleanPin) {
        isVerifyingNow = false;
        notify('❌ Mã xác nhận không khớp! Hãy kiểm tra lại mã trên máy người được giúp.');
        return;
      }

      closeScanVerifyModal();

      const nowStr = new Date().toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const receiptCode = 'QR-' + cleanPin;

      // 1. Cộng +25 Điểm Ấm & +1 lượt hỗ trợ cho người giúp
      await rtdb.ref('users/' + currentUser.uid).update({
        points: Number(userProfile.points || 0) + 25,
        helps: Number(userProfile.helps || 0) + 1
      });
      await rtdb.ref('users/' + currentUser.uid + '/history').push({
        title: `Hỗ trợ tại ${liveSos.area}`,
        partner: `${liveSos.name} (${liveSos.faculty || 'HNUE'})`,
        time: nowStr,
        code: receiptCode,
        pointsEarned: 25,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });

      // 2. Ghi lịch sử cho người được giúp
      await rtdb.ref('users/' + liveSos.uid + '/history').push({
        title: `Được hỗ trợ tại ${liveSos.area}`,
        partner: `${userProfile.name} (${userProfile.faculty})`,
        time: nowStr,
        code: receiptCode,
        pointsEarned: 0,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });

      // 3. Cập nhật thống kê bản đồ nhiệt 4 khu vực & bảng xếp hạng Khoa
      const zoneKey = liveSos.zoneKey || 'giang_duong';
      const myFacKey = sanitizeRtdbKey(userProfile.faculty || 'Khoa Công nghệ thông tin');
      await rtdb.ref('stats/totalHelps').set(Number(globalStats.totalHelps || 0) + 1);
      await rtdb.ref('stats/areas/' + zoneKey).set(Number((globalStats.areas && globalStats.areas[zoneKey]) || 0) + 1);
      await rtdb.ref('stats/faculties/' + myFacKey).set(Number((globalStats.faculties && globalStats.faculties[myFacKey]) || 0) + 25);

      // 4. Xóa tín hiệu SOS đã hoàn thành
      await rtdb.ref('sos_signals/' + liveSos.uid).remove();
      notify('🎉 Xác minh QR thành công! Bạn đã nhận +25 Điểm Ấm.');
    } catch (err) {
      isVerifyingNow = false;
      notify('⚠ Có lỗi kết nối khi xác minh. Vui lòng thử lại.');
    }
  }

  document.getElementById('submitVerifyPinBtn').addEventListener('click', () => {
    verifyAndCompleteSos(manualVerifyPinInput.value);
  });

  // 8. Hiển thị danh sách người cần hỗ trợ trên Radar GPS
  function renderIncomingSosList() {
    const container = document.getElementById('incomingSosContainer');
    const list = Object.values(remoteSosSignals)
      .map((sos) => {
        const distM = haversineMeters(gpsState.lat, gpsState.lng, sos.lat, sos.lng);
        const dirText = bearingToDirection(getBearingDeg(gpsState.lat, gpsState.lng, sos.lat, sos.lng));
        return Object.assign({}, sos, { distM, dirText });
      })
      .sort((a, b) => a.distM - b.distM);

    if (!list.length) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = list
      .map((sos) => {
        const isAcceptedByMe = currentUser && sos.helperUid === currentUser.uid;
        const acceptedByOther = sos.helperUid && !isAcceptedByMe;
        const helperStatusBadge = isAcceptedByMe
          ? `<div style="font-size: 0.78rem; font-weight: 700; color: #059669; margin-top: 4px;">✓ Bạn đang tiếp nhận yêu cầu này</div>`
          : acceptedByOther
          ? `<div style="font-size: 0.78rem; font-weight: 700; color: #d97706; margin-top: 4px;">⏳ ${sos.helperName || 'Thành viên khác'} đang hỗ trợ</div>`
          : '';

        return `
        <div class="vol-card" style="border-color: #f43f5e; background: #fff1f2;">
          <div class="vol-card-top">
            <div>
              <div class="vol-title" style="color: #be123c;">🆘 ${sos.name} (${sos.faculty || 'HNUE'})</div>
              <div class="vol-sub" style="color: #0f172a; font-weight: 700;">${sos.group} • ${sos.area}</div>
              <div class="vol-sub" style="color: #1e293b; margin-top: 4px;">“${sos.message}”</div>
              <div class="vol-gps-meta">GPS: ${Number(sos.lat).toFixed(5)}°N, ${Number(sos.lng).toFixed(5)}°E • Hướng ${sos.dirText}</div>
              ${helperStatusBadge}
            </div>
            <span class="vol-dist-tag" style="background: #fff; color: #e11d48; font-size: 0.84rem;">${sos.distM}m</span>
          </div>
          <div class="vol-card-actions" style="grid-template-columns: 1fr 1.25fr;">
            <button type="button" class="btn-chat-vol" data-accept-sos-uid="${sos.uid}" style="font-size: 0.84rem; padding: 10px;">
              ${isAcceptedByMe ? '💬 Nhắn tin' : '🤝 Nhận & Nhắn tin'}
            </button>
            <button type="button" class="btn-confirm-qr" data-verify-sos-uid="${sos.uid}" style="font-size: 0.84rem; padding: 10px;">
              📷 Quét mã xác nhận
            </button>
          </div>
        </div>
      `;
      })
      .join('');

    container.querySelectorAll('[data-accept-sos-uid]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const sosUid = btn.getAttribute('data-accept-sos-uid');
        const sos = list.find((x) => x.uid === sosUid);
        if (!sos || !currentUser) return;

        await rtdb.ref('sos_signals/' + sosUid).update({
          helperUid: currentUser.uid,
          helperName: userProfile.name
        });

        openSafeChat({
          uid: sos.uid,
          name: sos.name,
          faculty: sos.faculty || 'HNUE',
          distM: sos.distM,
          dirText: sos.dirText
        });
      });
    });

    container.querySelectorAll('[data-verify-sos-uid]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sosUid = btn.getAttribute('data-verify-sos-uid');
        const sos = list.find((x) => x.uid === sosUid);
        if (sos) openScanVerifyModal(sos);
      });
    });
  }

  // 9. Render Radar & Danh sách tình nguyện viên trực tuyến
  let selectedPeerId = null;
  let currentMaxDist = 50000;

  function renderRadarAndNearbyList() {
    const blipsLayer = document.getElementById('dynamicRadarBlipsLayer');
    const mapPinsLayer = document.getElementById('dynamicMapPinsLayer');
    const listContainer = document.getElementById('nearbyVolunteersList');

    const allLiveEntities = [];
    Object.values(remoteSosSignals).forEach((sos) => {
      allLiveEntities.push({
        id: 'sos_' + sos.uid,
        uid: sos.uid,
        kind: 'sos',
        initials: 'SOS',
        name: sos.name + ' (Cần giúp)',
        faculty: sos.faculty || 'HNUE',
        skill: sos.group,
        lat: sos.lat,
        lng: sos.lng
      });
    });
    Object.values(remoteBeacons).forEach((vol) => {
      allLiveEntities.push(vol);
    });

    const enriched = allLiveEntities
      .map((item) => {
        const distM = haversineMeters(gpsState.lat, gpsState.lng, item.lat, item.lng);
        const bearing = getBearingDeg(gpsState.lat, gpsState.lng, item.lat, item.lng);
        const dirText = bearingToDirection(bearing);
        const walkMin = Math.max(1, Math.round(distM / 75));
        return Object.assign({}, item, { distM, bearing, dirText, walkMin });
      })
      .filter((p) => p.distM <= currentMaxDist)
      .sort((a, b) => a.distM - b.distM);

    document.getElementById('nearbyCountBadge').textContent = `${enriched.length} người trực tuyến`;

    let radarHtml = '';
    let mapHtml = '';

    enriched.forEach((p) => {
      const ratio = Math.min(0.9, Math.max(0.18, p.distM / Math.max(500, currentMaxDist === 50000 ? 2000 : currentMaxDist)));
      const rad = (p.bearing * Math.PI) / 180;
      const leftPct = 50 + Math.sin(rad) * ratio * 44;
      const topPct = 50 - Math.cos(rad) * ratio * 44;
      const isSos = p.kind === 'sos';
      const dotCss = isSos
        ? 'background: #f43f5e; box-shadow: 0 0 16px #f43f5e;'
        : 'background: #10b981; box-shadow: 0 0 16px #10b981;';

      radarHtml += `
        <div class="dynamic-vol-blip ${p.id === selectedPeerId ? 'is-selected' : ''}" data-peer-id="${p.id}" style="left: ${leftPct.toFixed(1)}%; top: ${topPct.toFixed(1)}%;">
          <div class="blip-dot" style="${dotCss}"></div>
          <span class="blip-label">${p.name.split(' ').slice(-2).join(' ')} • ${p.distM}m</span>
        </div>
      `;

      mapHtml += `
        <div class="dynamic-vol-blip ${p.id === selectedPeerId ? 'is-selected' : ''}" data-peer-id="${p.id}" style="left: ${leftPct.toFixed(1)}%; top: ${topPct.toFixed(1)}%;">
          <div class="blip-dot" style="${dotCss}"></div>
          <span class="blip-label">${p.name} (${p.distM}m)</span>
        </div>
      `;
    });

    blipsLayer.innerHTML = radarHtml;
    mapPinsLayer.innerHTML = mapHtml;

    const volunteersOnly = enriched.filter((x) => x.kind !== 'sos');
    if (!volunteersOnly.length) {
      listContainer.innerHTML = `
        <div class="ui-card empty-state-box">
          <span class="empty-state-icon">📡</span>
          Hiện chưa có “Người Thắp Lửa” nào khác đang bật chế độ trực tuyến trong phạm vi này.
        </div>
      `;
    } else {
      listContainer.innerHTML = volunteersOnly
        .map(
          (p) => `
          <div class="vol-card ${p.id === selectedPeerId ? 'is-highlighted' : ''}" id="card-${p.id}">
            <div class="vol-card-top">
              <div class="vol-left">
                <div class="vol-badge-avatar" style="background: #dcfce7; color: #15803d;">${p.initials}</div>
                <div>
                  <div class="vol-title">${p.name} <span style="font-size: 0.76rem; color: #059669;">● Trực tuyến</span></div>
                  <div class="vol-sub">${p.faculty} • ${p.skill}</div>
                  <div class="vol-gps-meta">GPS: ${Number(p.lat).toFixed(5)}°N, ${Number(p.lng).toFixed(5)}°E • Hướng ${p.dirText}</div>
                </div>
              </div>
              <span class="vol-dist-tag">${p.distM}m (~${p.walkMin}p)</span>
            </div>
            <div class="vol-card-actions" style="grid-template-columns: 1fr;">
              <button type="button" class="btn-chat-vol" data-chat-uid="${p.uid}" style="font-size: 0.88rem; padding: 10px;">
                💬 Nhắn tin trực tiếp
              </button>
            </div>
          </div>
        `
        )
        .join('');
    }

    listContainer.querySelectorAll('[data-chat-uid]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const peer = volunteersOnly.find((x) => x.uid === btn.getAttribute('data-chat-uid'));
        if (peer) openSafeChat(peer);
      });
    });
  }

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

  // 10. Đồng bộ giao diện Hồ sơ, Điểm Ấm, Chứng nhận & Bản đồ nhiệt 4 khu vực
  function syncAllUserUI() {
    const isHnue = userProfile.email.toLowerCase().endsWith('@hnue.edu.vn');
    document.getElementById('headerVerifiedBadge').textContent = isHnue ? '✓ @hnue.edu.vn' : '✓ Đã xác thực';
    document.getElementById('headerStudentName').textContent = userProfile.name;
    document.getElementById('headerStudentFaculty').textContent = userProfile.faculty;
    document.getElementById('headerPointsBadge').textContent = userProfile.points + 'đ';

    const shortCode = '#HNUE-' + (userProfile.studentId || userProfile.uid.slice(-4).toUpperCase());
    document.getElementById('walletIdTag').textContent = shortCode;
    document.getElementById('walletStudentName').textContent = userProfile.name;
    document.getElementById('walletStudentMeta').textContent = `${userProfile.email} • ${userProfile.faculty}`;
    document.getElementById('walletScoreNumber').textContent = userProfile.points;

    const certCode = '#WL-' + userProfile.uid.slice(-6).toUpperCase();
    document.getElementById('certHolderName').textContent = userProfile.name;
    document.getElementById('certHashCode').textContent = certCode;
    document.getElementById('certTotalHelps').textContent = userProfile.helps + ' lượt hỗ trợ';

    document.getElementById('sheetHolderName').textContent = userProfile.name.toUpperCase();
    document.getElementById('sheetHolderMeta').textContent = `${userProfile.faculty} • ${userProfile.email}`;
    document.getElementById('sheetPointsValue').textContent = userProfile.points + ' Điểm Ấm';
    document.getElementById('sheetCertCode').textContent = certCode;

    const pct = Math.min(100, (userProfile.points / 200) * 100);
    document.getElementById('sv5tProgressBar').style.width = pct + '%';
    document.getElementById('sv5tProgressNote').textContent =
      userProfile.points >= 200
        ? '★ Đã đạt mốc Người Thắp Lửa Tiêu Biểu cấp Trường!'
        : `Còn ${200 - userProfile.points} Điểm Ấm để đạt mốc ghi nhận tiêu biểu`;

    const histEl = document.getElementById('verifiedHistoryList');
    if (!userProfile.history.length) {
      histEl.innerHTML = `<div class="empty-state-box" style="padding: 14px 6px;">Chưa có giao dịch hỗ trợ nào được ghi nhận trên tài khoản này.</div>`;
    } else {
      histEl.innerHTML = userProfile.history
        .map(
          (h) => `
          <div class="history-item">
            <div>
              <div style="font-weight: 700; font-size: 0.88rem; color: #0f172a;">${h.title}</div>
              <div style="font-size: 0.78rem; color: #475569;">Cùng: ${h.partner} • ${h.time}</div>
            </div>
            <span style="background: #ecfdf5; color: #047857; font-weight: 800; font-size: 0.76rem; padding: 3px 8px; border-radius: 6px; white-space: nowrap;">
              +${h.pointsEarned || 0}đ (${h.code})
            </span>
          </div>
        `
        )
        .join('');
    }
  }

  function renderHeatmapAndLeaderboard() {
    document.getElementById('weeklySparksCount').textContent = globalStats.totalHelps;
    document.getElementById('zoneHanhChinhCounter').textContent = `${globalStats.areas.hanh_chinh || 0} đốm lửa`;
    document.getElementById('zoneGiangDuongCounter').textContent = `${globalStats.areas.giang_duong || 0} đốm lửa`;
    document.getElementById('zoneKtxCounter').textContent = `${globalStats.areas.ky_tuc_xa || 0} đốm lửa`;
    document.getElementById('zoneKhacCounter').textContent = `${globalStats.areas.khu_vuc_khac || 0} đốm lửa`;

    const lbEl = document.getElementById('facultyLeaderboardList');
    const entries = Object.entries(globalStats.faculties || {}).sort((a, b) => b[1] - a[1]);
    if (!entries.length) {
      lbEl.innerHTML = `<div class="empty-state-box" style="padding: 12px 6px;">Chưa có dữ liệu điểm tích lũy theo Khoa / Đơn vị.</div>`;
      return;
    }
    const medals = ['🥇', '🥈', '🥉'];
    lbEl.innerHTML = entries
      .map(
        ([fac, score], idx) => `
        <div class="faculty-rank-item" style="font-size: 0.88rem;">
          <span>${medals[idx] || '🏅'} <strong>${fac}</strong></span>
          <span class="rank-score-text">${Number(score).toLocaleString('vi-VN')} Điểm Ấm</span>
        </div>
      `
      )
      .join('');
  }

  // 11. Điều hướng các tab
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

  // 12. AI NLP kiểm duyệt & Phát tín hiệu SOS kèm mã xác nhận QR
  let selectedGroup = 'Y tế & Đời sống';
  document.querySelectorAll('#supportGroupPills .support-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#supportGroupPills .support-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      selectedGroup = chip.getAttribute('data-group');
    });
  });

  const sosMessageInput = document.getElementById('sosMessageInput');
  const nlpFeedbackBox = document.getElementById('nlpFeedbackBox');
  const nlpFeedbackText = document.getElementById('nlpFeedbackText');
  const nlpAutoCleanBtn = document.getElementById('nlpAutoCleanBtn');
  const blockedWords = ['chửi', 'ngu', 'xấu', 'ghét', 'bực', 'tệ hại', 'đồ điên', 'vô dụng'];

  function validateAiNlp() {
    const val = sosMessageInput.value.trim();
    const lower = val.toLowerCase();
    if (!val) {
      nlpFeedbackBox.classList.add('is-warning');
      nlpFeedbackText.textContent = '⚠ Vui lòng nhập nội dung cần hỗ trợ trước khi phát tín hiệu';
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
    nlpFeedbackText.textContent = '✓ AI NLP: Nội dung rõ ràng & an toàn';
    nlpAutoCleanBtn.style.display = 'none';
    return true;
  }

  sosMessageInput.addEventListener('input', validateAiNlp);
  nlpAutoCleanBtn.addEventListener('click', () => {
    let cleaned = sosMessageInput.value;
    blockedWords.forEach((w) => {
      cleaned = cleaned.replace(new RegExp(w, 'gi'), '');
    });
    sosMessageInput.value = cleaned.replace(/\s+/g, ' ').trim();
    validateAiNlp();
  });

  document.getElementById('triggerSosBtn').addEventListener('click', async () => {
    if (!currentUser) return;
    if (!validateAiNlp()) {
      notify('⚠ Vui lòng nhập nội dung cần hỗ trợ.');
      return;
    }

    const selectedArea = hnueAreaSelect.value;
    const chosenLandmark = HNUE_LANDMARKS.find((lm) => lm.value === selectedArea);

    let targetLat = gpsState.lat;
    let targetLng = gpsState.lng;
    let areaText = selectedArea;
    let zoneKey = 'hanh_chinh';

    if (chosenLandmark) {
      areaText = chosenLandmark.value;
      zoneKey = chosenLandmark.zone;
      if (!gpsState.isLive) {
        targetLat = chosenLandmark.lat;
        targetLng = chosenLandmark.lng;
      }
    } else {
      const detected = detectNearestHnueLandmark(gpsState.lat, gpsState.lng);
      areaText = detected.label;
      zoneKey = detected.landmark.zone;
      if (!gpsState.isLive) activateRealGeolocation();
    }

    const verifyPin = String(Math.floor(1000 + Math.random() * 9000));

    const sosRef = rtdb.ref('sos_signals/' + currentUser.uid);
    sosRef.onDisconnect().remove();
    await sosRef.set({
      uid: currentUser.uid,
      name: userProfile.name,
      email: userProfile.email,
      faculty: userProfile.faculty,
      group: selectedGroup,
      area: areaText,
      zoneKey: zoneKey,
      message: sosMessageInput.value.trim(),
      lat: targetLat,
      lng: targetLng,
      verifyPin: verifyPin,
      helperUid: null,
      helperName: null,
      createdAt: firebase.database.ServerValue.TIMESTAMP
    });

    if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
    notify(`🔥 Đã phát tín hiệu tại ${areaText}! Bấm "Hiện mã xác nhận" khi được giúp xong.`);
  });

  // 13. Chat 2 chiều thời gian thực qua Firebase
  const safeChatModal = document.getElementById('safeChatModal');
  const chatMessagesBox = document.getElementById('chatMessagesBox');
  const chatInputBox = document.getElementById('chatInputBox');
  let activeChatPeer = null;
  let activeChatRef = null;

  function openSafeChat(peer) {
    if (!currentUser) return;
    activeChatPeer = peer;
    if (activeChatRef) {
      activeChatRef.off();
      activeChatRef = null;
    }

    document.getElementById('chatPartnerName').textContent = peer.distM > 0 ? `${peer.name} (${peer.distM}m)` : peer.name;
    document.getElementById('chatPartnerMeta').textContent = `✓ ${peer.faculty} • Kết nối trực tiếp`;
    chatMessagesBox.innerHTML = `
      <div class="chat-bubble incoming">
        Kênh trao đổi trực tiếp với ${peer.name}.
      </div>
    `;

    const roomId = [currentUser.uid, peer.uid].sort().join('__');
    activeChatRef = rtdb.ref('chats/' + roomId + '/messages').limitToLast(50);
    activeChatRef.on('child_added', (snap) => {
      const msg = snap.val();
      if (!msg) return;
      const msgDiv = document.createElement('div');
      msgDiv.className = 'chat-bubble ' + (msg.senderUid === currentUser.uid ? 'outgoing' : 'incoming');
      msgDiv.textContent = msg.text;
      chatMessagesBox.appendChild(msgDiv);
      chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
    });

    safeChatModal.classList.add('open');
  }

  function closeSafeChat() {
    if (activeChatRef) {
      activeChatRef.off();
      activeChatRef = null;
    }
    safeChatModal.classList.remove('open');
  }

  async function sendChatMessage(text) {
    const clean = (text || '').trim();
    if (!clean || !activeChatPeer || !currentUser) return;
    const masked = clean.replace(/(0\d{2})\d{4}(\d{3})/g, '$1****$2');
    chatInputBox.value = '';

    const roomId = [currentUser.uid, activeChatPeer.uid].sort().join('__');
    await rtdb.ref('chats/' + roomId + '/messages').push({
      senderUid: currentUser.uid,
      senderName: userProfile.name,
      text: masked,
      createdAt: firebase.database.ServerValue.TIMESTAMP
    });
  }

  document.getElementById('sendChatBtn').addEventListener('click', () => sendChatMessage(chatInputBox.value));
  chatInputBox.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendChatMessage(chatInputBox.value);
  });
  document.getElementById('closeChatModalBtn').addEventListener('click', closeSafeChat);

  // 14. Modal Hồ sơ cá nhân & Đăng xuất
  const profileModal = document.getElementById('profileModal');
  document.getElementById('openProfileModalBtn').addEventListener('click', () => {
    document.getElementById('inputStudentName').value = userProfile.name;
    document.getElementById('inputStudentId').value = userProfile.studentId;
    document.getElementById('inputStudentEmail').value = userProfile.email;
    document.getElementById('inputStudentFaculty').value = userProfile.faculty;
    profileModal.classList.add('open');
  });
  document.getElementById('closeProfileModalBtn').addEventListener('click', () => profileModal.classList.remove('open'));

  document.getElementById('saveProfileBtn').addEventListener('click', async () => {
    if (!currentUser) return;
    const name = document.getElementById('inputStudentName').value.trim();
    const studentId = document.getElementById('inputStudentId').value.trim();
    const faculty = document.getElementById('inputStudentFaculty').value;
    if (!name) return notify('⚠ Vui lòng nhập họ và tên.');

    await rtdb.ref('users/' + currentUser.uid).update({ name, studentId, faculty });
    syncMyBeaconToFirebase();
    profileModal.classList.remove('open');
    notify('✓ Đã cập nhật hồ sơ thành công!');
  });

  document.getElementById('logoutAccountBtn').addEventListener('click', async () => {
    if (currentUser) {
      await rtdb.ref('beacons/' + currentUser.uid).remove();
    }
    gpsState.beaconOn = false;
    volunteerBeaconSwitch.classList.remove('on');
    profileModal.classList.remove('open');
    await auth.signOut();
    notify('Đã đăng xuất tài khoản.');
  });

  // 15. Modal Chứng nhận & Đóng Modal linh hoạt khi bấm nền tối hoặc phím Esc
  const certSheetModal = document.getElementById('certSheetModal');
  document.getElementById('openFullCertBtn').addEventListener('click', () => certSheetModal.classList.add('open'));
  document.getElementById('closeCertSheetBtn').addEventListener('click', () => certSheetModal.classList.remove('open'));

  function closeAllModalsSafely() {
    closeScanVerifyModal();
    closeSafeChat();
    showVerifyQrModal.classList.remove('open');
    profileModal.classList.remove('open');
    certSheetModal.classList.remove('open');
  }

  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAllModalsSafely();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModalsSafely();
  });

  // 16. Trình tạo mã QR chuẩn ISO (Reed-Solomon QR Code)
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

  function renderQrSvgInto(containerEl, textStr, pxSize) {
    const matrix = QRGen.createMatrix(textStr);
    const n = matrix.length;
    const quiet = 4;
    const total = n + quiet * 2;
    let rects = '';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (matrix[r][c] === 1) {
          rects += `<rect x="${c + quiet}" y="${r + quiet}" width="1" height="1" fill="#0f172a"/>`;
        }
      }
    }
    containerEl.innerHTML = `<svg width="${pxSize}" height="${pxSize}" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)"><rect width="${total}" height="${total}" fill="#ffffff"/>${rects}</svg>`;
    return matrix;
  }

  const mobileQrHolder = document.getElementById('mobileQrHolder');
  const customMvpLinkInput = document.getElementById('customMvpLinkInput');
  const qrLinkCaption = document.getElementById('qrLinkCaption');

  const initialUrl = window.location.protocol.startsWith('http')
    ? window.location.href.split('#')[0]
    : '[https://hnue-warmlink.vercel.app/](https://hnue-warmlink.vercel.app/)';
  customMvpLinkInput.value = initialUrl;

  let qrMatrix = [];
  function drawMobileQr(urlStr) {
    const clean = (urlStr || initialUrl).trim();
    qrLinkCaption.textContent = clean;
    qrMatrix = renderQrSvgInto(mobileQrHolder, clean, 176);
  }
  drawMobileQr(customMvpLinkInput.value);

  customMvpLinkInput.addEventListener('input', () => drawMobileQr(customMvpLinkInput.value));

  document.getElementById('regenQrBtn').addEventListener('click', () => {
    drawMobileQr(customMvpLinkInput.value);
    if (!qrMatrix.length) return;
    const n = qrMatrix.length;
    const quiet = 4;
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
    notify('⬇ Đã tải ảnh mã QR!');
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

  updateAreaDetailNote();
  updateGpsDisplays();
  renderHeatmapAndLeaderboard();
})();