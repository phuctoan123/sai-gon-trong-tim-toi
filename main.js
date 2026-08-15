document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger);

  // Hạn chế lỗi khi mobile thay đổi viewport / thanh địa chỉ ẩn hiện
  ScrollTrigger.config({ ignoreMobileResize: true });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- 1. Fade-in / slide-up cho từng khối có class .reveal ----
  if (!reduceMotion) {
    document.querySelectorAll('.reveal').forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true
          // Nếu bạn không muốn dùng once, có thể thay bằng dòng dưới:
          // toggleActions: 'play none none none'
        }
      });
    });
  } else {
    document.querySelectorAll('.reveal').forEach(el => {
      el.style.opacity = 1;
      el.style.transform = 'none';
    });
  }

  // ---- 2. Thanh "dòng chảy hành trình" — vẽ dần theo tiến độ cuộn toàn trang ----
  const railPath = document.getElementById('journey-path');
  if (railPath && !reduceMotion) {
    gsap.to(railPath, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.4
      }
    });
  }

  // ---- 3. Thanh tiến trình mỏng trên mobile ----
  const progressTop = document.getElementById('progress-top');
  if (progressTop) {
    gsap.to(progressTop, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.2
      }
    });
  }

  // ---- 4. Gợi ý cuộn ở Hero nhấp nháy nhẹ ----
  if (!reduceMotion) {
    gsap.to('#scroll-cue', {
      scaleY: 0.4,
      transformOrigin: 'top',
      repeat: -1,
      yoyo: true,
      duration: 1.1,
      ease: 'sine.inOut'
    });
  }

  // ---- 5. Trình phát audio Tuyên ngôn Độc lập ----
  const audio = document.getElementById('declaration-audio');
  const audioToggle = document.getElementById('audio-toggle');
  const audioIcon = document.getElementById('audio-icon');

  if (audio && audioToggle) {
    audioToggle.addEventListener('click', () => {
      if (audio.paused) {
        audio.play().catch(() => { /* Chưa gắn tệp audio thực tế */ });
        audioIcon.textContent = '❚❚';
      } else {
        audio.pause();
        audioIcon.textContent = '▶';
      }
    });

    audio.addEventListener('ended', () => {
      audioIcon.textContent = '▶';
    });
  }
});

// ===== Audio Player - Poster + Waveform =====
(function() {
  const audio = document.getElementById('declaration-audio');
  const toggleBtn = document.getElementById('audio-toggle');
  const icon = document.getElementById('audio-icon');
  const posterWrapper = document.getElementById('audio-poster-wrapper');
  const canvas = document.getElementById('audio-waveform');
  const ctx = canvas.getContext('2d');
  const progressEl = document.getElementById('wave-progress');
  const timeEl = document.getElementById('audio-time');
  const waveContainer = document.getElementById('waveform-container');

  if (!audio || !canvas) return;

  let isPlaying = false;
  let animationId = null;
  let audioContext = null;
  let analyser = null;
  let dataArray = null;
  let source = null;

  // Setup canvas size
  function resizeCanvas() {
    const rect = waveContainer.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Vẽ waveform tĩnh (fake data - 60 bars)
  function drawStaticWave() {
    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;
    const barCount = 60;
    const barWidth = (width / barCount) * 0.6;
    const gap = (width / barCount) * 0.4;

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < barCount; i++) {
      // Tạo hình dạng wave giống audio thật
      const normalizedPos = i / barCount;
      const envelope = Math.sin(normalizedPos * Math.PI); // Hình chuông ở giữa
      const randomHeight = 0.3 + Math.random() * 0.7;
      const barHeight = (height * 0.8) * envelope * randomHeight;
      const x = i * (barWidth + gap) + gap / 2;
      const y = (height - barHeight) / 2;

      // Gradient từ trắng mờ → trắng đậm → trắng mờ
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, 'rgba(242, 237, 228, 0.3)');
      gradient.addColorStop(0.5, 'rgba(242, 237, 228, 0.9)');
      gradient.addColorStop(1, 'rgba(242, 237, 228, 0.3)');

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);
    }
  }

  // Vẽ waveform động (khi playing)
  function drawDynamicWave() {
    if (!analyser) return;

    analyser.getByteFrequencyData(dataArray);

    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;
    const barCount = 60;
    const barWidth = (width / barCount) * 0.6;
    const gap = (width / barCount) * 0.4;

    ctx.clearRect(0, 0, width, height);

    const step = Math.floor(dataArray.length / barCount);

    for (let i = 0; i < barCount; i++) {
      const value = dataArray[i * step];
      const percent = value / 255;
      const barHeight = (height * 0.9) * percent;
      const x = i * (barWidth + gap) + gap / 2;
      const y = (height - barHeight) / 2;

      // Màu trắng sáng khi playing, phản ứng theo nhạc
      const brightness = 0.5 + percent * 0.5;
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, `rgba(242, 237, 228, ${0.4 * brightness})`);
      gradient.addColorStop(0.5, `rgba(255, 255, 255, ${brightness})`);
      gradient.addColorStop(1, `rgba(242, 237, 228, ${0.4 * brightness})`);

      ctx.fillStyle = gradient;

      // Bo góc nhẹ
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
      ctx.fill();
    }

    animationId = requestAnimationFrame(drawDynamicWave);
  }

  // Setup Web Audio API để phân tích tần số
  function setupAudioContext() {
    if (audioContext) return;

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 128;

    source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
  }

  // Format time mm:ss
  function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // Update progress
  function updateProgress() {
    if (audio.duration) {
      const percent = audio.currentTime / audio.duration;
      progressEl.style.transform = `scaleX(${percent})`;
      timeEl.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
    }
  }

  // Toggle play/pause
  function togglePlay() {
    if (isPlaying) {
      audio.pause();
      icon.textContent = '▶';
      posterWrapper.classList.remove('playing');
      cancelAnimationFrame(animationId);
      drawStaticWave(); // Quay lại wave tĩnh
    } else {
      // Resume audio context nếu bị suspended (browser policy)
      if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
      }

      setupAudioContext();
      audio.play();
      icon.textContent = '❚❚';
      posterWrapper.classList.add('playing');
      drawDynamicWave(); // Bắt đầu wave động
    }

    isPlaying = !isPlaying;
  }

  // Events
  toggleBtn.addEventListener('click', togglePlay);

  audio.addEventListener('timeupdate', updateProgress);

  audio.addEventListener('ended', () => {
    isPlaying = false;
    icon.textContent = '▶';
    posterWrapper.classList.remove('playing');
    cancelAnimationFrame(animationId);
    drawStaticWave();
    progressEl.style.transform = 'scaleX(0)';
    timeEl.textContent = `00:00 / ${formatTime(audio.duration)}`;
  });

  audio.addEventListener('loadedmetadata', () => {
    timeEl.textContent = `00:00 / ${formatTime(audio.duration)}`;
  });

  // Click vào waveform để seek
  waveContainer.addEventListener('click', (e) => {
    const rect = waveContainer.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    if (audio.duration) {
      audio.currentTime = percent * audio.duration;
    }
  });

  // Init
  drawStaticWave();
})();

// ===== Before/After Slider - Ảnh không đổi size =====
(function() {
  const slider = document.getElementById('ba-slider');
  const beforeLayer = document.getElementById('ba-before');
  const bar = document.getElementById('ba-bar');

  if (!slider || !beforeLayer || !bar) return;

  let isDragging = false;

  function updateSlider(clientX) {
    const rect = slider.getBoundingClientRect();
    let percentage = ((clientX - rect.left) / rect.width) * 100;

    // Giới hạn 2% - 98% để không biến mất hoàn toàn
    percentage = Math.max(2, Math.min(98, percentage));

    // Cập nhật width của layer before (chỉ layer bị clip, ảnh vẫn full)
    beforeLayer.style.width = percentage + '%';

    // Cập nhật vị trí thanh slider
    bar.style.left = percentage + '%';
  }

  // Mouse events
  bar.addEventListener('mousedown', (e) => {
    isDragging = true;
    e.preventDefault();
    e.stopPropagation();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    updateSlider(e.clientX);
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Touch events (mobile)
  bar.addEventListener('touchstart', (e) => {
    isDragging = true;
    e.preventDefault();
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    updateSlider(e.touches[0].clientX);
  }, { passive: false });

  document.addEventListener('touchend', () => {
    isDragging = false;
  });

  // Click trực tiếp vào container để nhảy
  slider.addEventListener('click', (e) => {
    if (e.target.closest('.ba-slider-bar')) return;
    updateSlider(e.clientX);
  });
})();