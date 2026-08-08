document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- 1. Fade-in / slide-up cho từng khối có class .reveal ----
  if(!reduceMotion){
    document.querySelectorAll('.reveal').forEach((el, i) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      });
    });
  } else {
    document.querySelectorAll('.reveal').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
  }

  // ---- 2. Thanh "dòng chảy hành trình" — vẽ dần theo tiến độ cuộn toàn trang ----
  const railPath = document.getElementById('journey-path');
  if(railPath && !reduceMotion){
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
  if(progressTop){
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
  if(!reduceMotion){
    gsap.to('#scroll-cue', { scaleY: 0.4, transformOrigin: 'top', repeat: -1, yoyo: true, duration: 1.1, ease: 'sine.inOut' });
  }

  // ---- 5. Trình phát audio Tuyên ngôn Độc lập ----
  const audio = document.getElementById('declaration-audio');
  const audioToggle = document.getElementById('audio-toggle');
  const audioIcon = document.getElementById('audio-icon');
  if(audio && audioToggle){
    audioToggle.addEventListener('click', () => {
      if(audio.paused){
        audio.play().catch(() => { /* Chưa gắn tệp audio thực tế */ });
        audioIcon.textContent = '❚❚';
      } else {
        audio.pause();
        audioIcon.textContent = '▶';
      }
    });
    audio.addEventListener('ended', () => { audioIcon.textContent = '▶'; });
  }
});
