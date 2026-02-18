// ===============================
// ✅ 안전 이벤트 바인딩 (요소가 없으면 그냥 스킵)
// ===============================
function on(el, eventName, handler, options) {
  if (!el) return;
  el.addEventListener(eventName, handler, options);
}

/* ========================================
   BEYOND REVIEW - JavaScript
   인터랙션 및 기능 구현
   ======================================== */

// ========== 전역 변수 ==========
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');
const contactForm = document.getElementById('contact-form');
const successModal = document.getElementById('success-modal');
const closeModalBtn = document.getElementById('close-modal');
const faqItems = document.querySelectorAll('.faq-item');
const loadMoreBtn = document.getElementById('load-more');
const portfolioGrid = document.getElementById('portfolio-grid');

// ========== 네비게이션 스크롤 효과 ==========
window.addEventListener('scroll', () => {
  if (!navbar) return;
  if (window.scrollY > 50) navbar.classList.add('scrolled');
  else navbar.classList.remove('scrolled');
});

// ========== 햄버거 메뉴 토글 (모바일) ==========
on(hamburger, 'click', () => {
  if (!navMenu) return;
  hamburger.classList.toggle('active');
  navMenu.classList.toggle('active');
  document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
});

// ========== 네비게이션 링크 클릭 시 메뉴 닫기 ==========
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    const targetId = link.getAttribute('href');

    // 부드러운 스크롤
    if (targetId && targetId.startsWith('#')) {
      e.preventDefault();
      const targetSection = document.querySelector(targetId);

      if (targetSection) {
        const offsetTop = targetSection.offsetTop - 70; // 네비게이션 높이만큼 오프셋
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    }

    // 모바일 메뉴 닫기 (요소 있을 때만)
    if (hamburger) hamburger.classList.remove('active');
    if (navMenu) navMenu.classList.remove('active');
    document.body.style.overflow = '';
  });
});

// ========== FAQ 아코디언 기능 ==========
faqItems.forEach(item => {
  const question = item.querySelector('.faq-question');
  on(question, 'click', () => {
    const isActive = item.classList.contains('active');

    faqItems.forEach(faq => faq.classList.remove('active'));

    if (!isActive) item.classList.add('active');
  });
});

// ========== 데이터베이스 저장 함수 ==========
async function saveToDatabase(data) {
  try {
    // Firebase db 확인
    if (typeof window.db === 'undefined') {
      console.error('❌ Firebase db가 초기화되지 않았습니다');
      alert('페이지를 새로고침해주세요.');
      return;
    }

    if (!contactForm) {
      console.error('❌ contactForm 요소가 없습니다');
      alert('폼 요소를 찾을 수 없습니다.');
      return;
    }

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '신청 중...';
    }

    const dbData = {
      storeName: data.storeName,
      phone: data.phone,
      email: data.email || 'N/A',
      category: data.category,
      package: data.package,
      timing: data.timing || 'N/A',
      message: data.message || 'N/A',
      submittedAt: new Date().toLocaleString('ko-KR'),
      timestamp: new Date().toISOString()
    };

    // 1️⃣ Firebase에 저장
    const newRef = window.db.ref('submissions').push();
    await newRef.set(dbData);
    console.log('✅ Firebase 저장 완료:', newRef.key);

    // 2️⃣ Google Apps Script를 통해 Telegram 전송
    await fetch('https://script.google.com/macros/s/AKfycbyKIolOQRbT95A-qTOZNlCXckkYVvFhLIcrG_1UZIib5Lp30FExYUDvqIu5rNjJp6nhIw/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeName: data.storeName,
        phone: data.phone,
        email: data.email || 'N/A',
        category: data.category,
        package: data.package,
        timing: data.timing || 'N/A',
        message: data.message || 'N/A',
        submittedAt: new Date().toLocaleString('ko-KR')
      })
    });

    console.log('✅ 텔레그램 전송 완료');

    contactForm.reset();
    if (successModal) {
      successModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    alert('신청 중 오류가 발생했습니다.\n' + error.message);
  } finally {
    if (contactForm) {
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '신청 완료';
      }
    }
  }
}

// ========== 폼 검증 및 제출 ==========
on(contactForm, 'submit', (e) => {
  e.preventDefault();

  const formData = new FormData(contactForm);
  const data = {
    storeName: formData.get('storeName'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    category: formData.get('category'),
    package: formData.get('package'),
    timing: formData.get('timing'),
    message: formData.get('message'),
    privacy: formData.get('privacy'),
    marketing: formData.get('marketing')
  };

  // 전화번호 형식 검증
  const phonePattern = /^[0-9]{3}-?[0-9]{4}-?[0-9]{4}$/;
  if (!phonePattern.test(data.phone)) {
    alert('전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678 또는 01012345678)');
    return;
  }

  // 하이픈 제거
  const cleanPhone = data.phone.replace(/-/g, '');
  if (cleanPhone.length !== 11) {
    alert('전화번호는 11자리여야 합니다.');
    return;
  }

  // 이메일 검증
  if (data.email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(data.email)) {
      alert('이메일 형식이 올바르지 않습니다.');
      return;
    }
  }

  // 개인정보 동의 체크
  if (!data.privacy) {
    alert('개인정보처리방침에 동의해주세요.');
    return;
  }

  saveToDatabase({ ...data, phone: cleanPhone });
});

// ========== 모달 닫기 ==========
on(closeModalBtn, 'click', () => {
  if (!successModal) return;
  successModal.classList.remove('active');
  document.body.style.overflow = '';
});

on(successModal, 'click', (e) => {
  if (!successModal) return;
  if (e.target === successModal) {
    successModal.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// ESC 키로 모달 닫기
document.addEventListener('keydown', (e) => {
  if (!successModal) return;
  if (e.key === 'Escape' && successModal.classList.contains('active')) {
    successModal.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// ========== 캐러셀 드래그 스크롤 기능 ==========
const carouselWrapper = document.getElementById('carousel-wrapper');

if (carouselWrapper) {
  let isDown = false;
  let startX;
  let scrollLeft;

  carouselWrapper.addEventListener('mousedown', (e) => {
    isDown = true;
    carouselWrapper.style.cursor = 'grabbing';
    startX = e.pageX - carouselWrapper.offsetLeft;
    scrollLeft = carouselWrapper.scrollLeft;
  });

  carouselWrapper.addEventListener('mouseleave', () => {
    isDown = false;
    carouselWrapper.style.cursor = 'grab';
  });

  carouselWrapper.addEventListener('mouseup', () => {
    isDown = false;
    carouselWrapper.style.cursor = 'grab';
  });

  carouselWrapper.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - carouselWrapper.offsetLeft;
    const walk = (x - startX) * 2;
    carouselWrapper.scrollLeft = scrollLeft - walk;
  });

  // 터치 이벤트
  let touchStartX = 0;
  let touchScrollLeft = 0;

  carouselWrapper.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].pageX - carouselWrapper.offsetLeft;
    touchScrollLeft = carouselWrapper.scrollLeft;
  }, { passive: true });

  carouselWrapper.addEventListener('touchmove', (e) => {
    const x = e.touches[0].pageX - carouselWrapper.offsetLeft;
    const walk = (x - touchStartX) * 2;
    carouselWrapper.scrollLeft = touchScrollLeft - walk;
  }, { passive: true });
}

// ========== 포트폴리오 그리드 드래그 스크롤 ==========
if (portfolioGrid) {
  let isDown = false;
  let startX;
  let scrollLeft;

  portfolioGrid.addEventListener('mousedown', (e) => {
    if (e.target.closest('a')) return;

    isDown = true;
    portfolioGrid.style.cursor = 'grabbing';
    startX = e.pageX - portfolioGrid.offsetLeft;
    scrollLeft = portfolioGrid.scrollLeft;
    e.preventDefault();
  });

  portfolioGrid.addEventListener('mouseleave', () => {
    isDown = false;
    portfolioGrid.style.cursor = 'grab';
  });

  portfolioGrid.addEventListener('mouseup', () => {
    isDown = false;
    portfolioGrid.style.cursor = 'grab';
  });

  portfolioGrid.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - portfolioGrid.offsetLeft;
    const walk = (x - startX) * 2;
    portfolioGrid.scrollLeft = scrollLeft - walk;
  });

  // 터치 이벤트
  let touchStartX;
  let touchScrollLeft;

  portfolioGrid.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].pageX - portfolioGrid.offsetLeft;
    touchScrollLeft = portfolioGrid.scrollLeft;
  }, { passive: true });

  portfolioGrid.addEventListener('touchmove', (e) => {
    const x = e.touches[0].pageX - portfolioGrid.offsetLeft;
    const walk = (x - touchStartX) * 2;
    portfolioGrid.scrollLeft = touchScrollLeft - walk;
  }, { passive: true });
}

// ========== 포트폴리오 더보기 기능 ==========
let portfolioItemsVisible = 9;

const additionalPortfolioItems = [
  { views: '55,000', location: '마포 베이커리' },
  { views: '72,000', location: '용산 파인다이닝' },
  { views: '43,000', location: '강서 아시안 레스토랑' },
  { views: '88,000', location: '서초 스테이크 하우스' },
  { views: '51,000', location: '종로 전통 한식당' },
  { views: '67,000', location: '광진 카페 & 베이커리' },
  { views: '39,000', location: '노원 브런치 카페' },
  { views: '94,000', location: '동작 이탈리안 레스토랑' },
  { views: '46,000', location: '성북 프렌치 비스트로' }
];

on(loadMoreBtn, 'click', () => {
  const itemsToAdd = 3;
  if (!portfolioGrid) return;

  for (let i = 0; i < itemsToAdd && i < additionalPortfolioItems.length; i++) {
    const item = additionalPortfolioItems.shift();
    if (!item) break;

    const portfolioItem = document.createElement('div');
    portfolioItem.className = 'portfolio-item fade-in-up';

    // ✅ 템플릿리터럴 대신 문자열 결합 (구형 브라우저/빌드 이슈 방지)
    portfolioItem.innerHTML =
      '<div class="portfolio-thumbnail">' +
        '<i class="fas fa-play-circle"></i>' +
        '<div class="portfolio-overlay">' +
          '<div class="portfolio-stats">' +
            '<span class="views">👁️ ' + item.views + '</span>' +
            '<span class="location">📍 ' + item.location + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';

    portfolioGrid.appendChild(portfolioItem);
  }

  if (additionalPortfolioItems.length === 0 && loadMoreBtn) {
    loadMoreBtn.style.display = 'none';
  }
});

// ========== 스크롤 애니메이션 (Intersection Observer) ==========
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const animateElements = document.querySelectorAll('.card, .stat-card, .package-card, .portfolio-item');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in-up');
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  animateElements.forEach(el => observer.observe(el));
} else {
  // 구형 브라우저 폴백
  animateElements.forEach(el => el.classList.add('fade-in-up'));
}

// ========== 전화번호 자동 포맷팅 ==========
const phoneInput = document.getElementById('phone');
on(phoneInput, 'input', (e) => {
  let value = e.target.value.replace(/[^0-9]/g, '');
  if (value.length > 11) value = value.slice(0, 11);

  let formatted = '';
  if (value.length <= 3) formatted = value;
  else if (value.length <= 7) formatted = value.slice(0, 3) + '-' + value.slice(3);
  else formatted = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7);

  e.target.value = formatted;
});

// ========== 부드러운 스크롤 (전역) ==========
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#') return;

    e.preventDefault();
    const target = document.querySelector(href);

    if (target) {
      const offsetTop = target.offsetTop - 70;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  });
});

// ========== 페이지 로드 시 초기화 ==========
document.addEventListener('DOMContentLoaded', () => {
  console.log('BEYOND REVIEW 웹사이트가 로드되었습니다.');

  const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
  console.log('총 ' + submissions.length + '개의 신청이 있습니다.');

  // 이미지 로드 에러 처리
  const allImages = document.querySelectorAll('.video-thumbnail-img, .portfolio-bg-img');
  allImages.forEach(img => {
    img.addEventListener('error', function () {
      console.warn('이미지 로드 실패:', this.src);
      this.style.opacity = '0';
    });

    img.addEventListener('load', function () {
      this.style.opacity = '1';
    });
  });

  // 히어로 섹션 애니메이션
  const heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    setTimeout(() => {
      heroContent.classList.add('fade-in-up');
    }, 100);
  }
});

// ========== 스크롤 진행 표시 (선택사항) ==========
window.addEventListener('scroll', () => {
  const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (winScroll / height) * 100;

  const progressBar = document.getElementById('progress-bar');
  if (progressBar) progressBar.style.width = scrolled + '%';
});

// ========== 패키지 카드 호버 효과 강화 ==========
const packageCards = document.querySelectorAll('.package-card');
packageCards.forEach(card => {
  card.addEventListener('mouseenter', () => {
    packageCards.forEach(c => {
      if (c !== card) c.style.opacity = '0.7';
    });
  });

  card.addEventListener('mouseleave', () => {
    packageCards.forEach(c => {
      c.style.opacity = '1';
    });
  });
});

// ========== Featured Video 클릭 이벤트 ==========
const featuredVideo = document.querySelector('.featured-video');
if (featuredVideo) {
  featuredVideo.addEventListener('click', () => {
    alert('Featured 영상 재생 기능은 실제 프로젝트에서 구현됩니다.\n실제 릴스/유튜브 링크를 연결하세요.');
  });
}

// ========== 실시간 폼 검증 피드백 ==========
if (contactForm) {
  const formInputs = contactForm.querySelectorAll('input[required], select[required], textarea[required]');
  formInputs.forEach(input => {
    input.addEventListener('blur', () => {
      if (input.value.trim() === '') input.style.borderColor = '#EF4444';
      else input.style.borderColor = '#10B981';
    });

    input.addEventListener('input', () => {
      if (input.value.trim() !== '') input.style.borderColor = '#10B981';
    });
  });
}

// ========== 이메일 형식 실시간 검증 ==========
const emailInput = document.getElementById('email');
if (emailInput) {
  emailInput.addEventListener('blur', () => {
    if (emailInput.value.trim() !== '') {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailPattern.test(emailInput.value)) emailInput.style.borderColor = '#10B981';
      else emailInput.style.borderColor = '#EF4444';
    } else {
      emailInput.style.borderColor = '#E5E7EB';
    }
  });
}

// ========== 네비게이션 현재 섹션 하이라이트 ==========
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  let current = '';

  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    if (window.scrollY >= (sectionTop - 100)) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === '#'+current) link.classList.add('active');
  });
});

// ========== 로딩 스피너 (폼 제출 시) ==========
function showLoadingSpinner() {
  if (!contactForm) return;
  const submitBtn = contactForm.querySelector('button[type="submit"]');
  if (!submitBtn) return;

  const originalText = submitBtn.textContent;
  submitBtn.textContent = '제출 중...';
  submitBtn.disabled = true;

  setTimeout(() => {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }, 2000);
}

// ========== 디버깅 및 개발자 정보 ==========
console.log(
  "╔══════════════════════════════════════════════╗\n" +
  "║         BEYOND REVIEW 웹사이트               ║\n" +
  "║       릴스 마케팅 전문 에이전시               ║\n" +
  "║                                              ║\n" +
  "║  개발: AI Developer                          ║\n" +
  "║  버전: 1.0.0                                 ║\n" +
  "║  날짜: 2026-02-14                            ║\n" +
  "╚══════════════════════════════════════════════╝"
);

// ========== 성능 최적화: 이미지 레이지 로딩 ==========
if ('loading' in HTMLImageElement.prototype) {
  const images = document.querySelectorAll('img[loading="lazy"]');
  images.forEach(img => {
    if (img.dataset && img.dataset.src) img.src = img.dataset.src;
  });
} else {
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
  document.body.appendChild(script);
}

// ========== 모바일 터치 이벤트 최적화 ==========
let touchStartY = 0;
let touchEndY = 0;

document.addEventListener('touchstart', (e) => {
  touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

document.addEventListener('touchend', (e) => {
  touchEndY = e.changedTouches[0].screenY;
  handleSwipe();
}, { passive: true });

function handleSwipe() {
  const swipeThreshold = 50;
  if (touchStartY - touchEndY > swipeThreshold) console.log('스와이프 업');
  else if (touchEndY - touchStartY > swipeThreshold) console.log('스와이프 다운');
}

// ========== 뒤로가기 버튼 이벤트 ==========
window.addEventListener('popstate', () => {
  if (!successModal) return;
  if (successModal.classList.contains('active')) {
    successModal.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// ========== 웹사이트 로드 완료 로그 ==========
window.addEventListener('load', () => {
  console.log('✅ 모든 리소스 로드 완료');
  console.log('📊 성능 정보:', {
    loadTime: performance.now().toFixed(2) + 'ms',
    resources: performance.getEntriesByType('resource').length
  });
});

// ===============================
// Drag to scroll (mouse/touch) for multiple horizontal containers
// 적용 대상: #carousel-wrapper, #portfolio-grid
// ===============================
(function () {
  function enableDragScroll(container) {
    if (!container) return;

    let isDown = false;
    let startX = 0;
    let startScrollLeft = 0;
    let moved = false;

    container.style.cursor = "grab";

    const onDown = (pageX) => {
      isDown = true;
      moved = false;
      container.classList.add("is-dragging");
      container.style.cursor = "grabbing";
      startX = pageX;
      startScrollLeft = container.scrollLeft;
    };

    const onMove = (pageX) => {
      if (!isDown) return;
      const walk = (pageX - startX) * 1.2;
      if (Math.abs(walk) > 2) moved = true;
      container.scrollLeft = startScrollLeft - walk;
    };

    const onUp = () => {
      isDown = false;
      container.classList.remove("is-dragging");
      container.style.cursor = "grab";
    };

    // Mouse
    container.addEventListener("mousedown", (e) => onDown(e.pageX));
    container.addEventListener("mousemove", (e) => onMove(e.pageX));
    container.addEventListener("mouseleave", onUp);
    window.addEventListener("mouseup", onUp);

    // Touch
    container.addEventListener("touchstart", (e) => onDown(e.touches[0].pageX), { passive: true });
    container.addEventListener("touchmove", (e) => onMove(e.touches[0].pageX), { passive: true });
    container.addEventListener("touchend", onUp);

    // Prevent accidental link click after drag
    container.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", (e) => {
        if (moved) e.preventDefault();
      });
    });
  }

  enableDragScroll(document.getElementById("carousel-wrapper"));
  enableDragScroll(document.getElementById("portfolio-grid"));
})();
