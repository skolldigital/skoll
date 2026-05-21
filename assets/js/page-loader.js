(function () {
  var sections = window.SKOLL_SECTIONS || [];
  if (!sections.length) {
    console.warn('SkollPageLoader: no sections configured. Set window.SKOLL_SECTIONS before including this script.');
    return;
  }

  if (window.gsap && window.ScrollTrigger) {
    window.gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ limitCallbacks: true, ignoreMobileResize: true });
  }

  var defaultHashToId = {
    home: 'hero-container',
    about: 'about-container',
    founder: 'founder-container',
    services: 'services-container',
    clientele: 'clientele-container',
    work: 'work-container',
    testimonials: 'testimonials-container',
    pillars: 'pillars-container',
    explore: 'previews-container',
    contact: 'footer-container'
  };
  var hashToId = window.SKOLL_HASH_TO_ID || defaultHashToId;

  function getBasePath() {
    var path = window.location.pathname || '';
    var lastSlash = path.lastIndexOf('/');
    return lastSlash >= 0 ? path.substring(0, lastSlash + 1) : '/';
  }

  function runScriptsInContainer(container) {
    var scripts = container.querySelectorAll('script');
    scripts.forEach(function (oldScript) {
      var newScript = document.createElement('script');
      if (oldScript.src) newScript.src = oldScript.src;
      else newScript.textContent = oldScript.textContent;
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }

  function loadSection(containerId, path, basePath) {
    var container = document.getElementById(containerId);
    if (!container) return Promise.resolve(false);
    var url = basePath + path + '?t=' + Date.now();
    return fetch(url)
      .then(function (res) { if (res.ok) return res.text(); throw new Error(path); })
      .then(function (html) { container.innerHTML = html; runScriptsInContainer(container); return true; })
      .catch(function (e) { console.warn('Section load failed:', url, e); return false; });
  }

  function loadAllWithProgress(onProgress) {
    var total = sections.length;
    var done = 0;
    var basePath = window.location.protocol === 'file:' ? '' : getBasePath();
    return Promise.all(sections.map(function (s) {
      return loadSection(s.id, s.path, basePath).then(function (ok) {
        done++;
        onProgress(done / total);
        return ok;
      });
    })).then(function (results) { return results.some(Boolean); });
  }

  function showLoadErrorMessage() {
    var main = document.getElementById('skoll-main');
    if (!main) return;
    var isFile = window.location.protocol === 'file:';
    main.innerHTML = '<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;font-family:system-ui,sans-serif;color:#FAFAFA;background:#0A0A0A;">' +
      '<h1 style="font-size:1.5rem;margin-bottom:16px;">' + (isFile ? 'Open via a local server' : 'Sections could not be loaded') + '</h1>' +
      '<p style="color:#888;max-width:400px;margin-bottom:24px;">' +
        (isFile
          ? 'This site uses fetch() to load sections, which does not work when opening the HTML file directly. Run a local server from the project folder, for example:'
          : 'Check the browser console for errors. Ensure you run the site from the correct folder.') +
      '</p>' +
      (isFile ? '<code style="display:block;padding:12px 20px;background:#161616;border-radius:8px;color:#C9A84C;font-size:0.9rem;">npx serve .</code>' +
        '<p style="color:#666;font-size:0.875rem;margin-top:16px;">or use the Live Server extension in VS Code.</p>' : '') +
      '</div>';
  }

  function initLenis() {
    if (typeof Lenis === 'undefined') return;
    var lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
    if (window.gsap && window.ScrollTrigger) {
      ScrollTrigger.scrollerProxy(document.body, {
        scrollTop: function (value) {
          if (arguments.length) lenis.scrollTo(value);
          return lenis.scroll != null ? lenis.scroll : 0;
        }
      });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
    }
    window.lenis = lenis;
  }

  function initScrollProgress() {
    var bar = document.getElementById('skoll-scroll-progress');
    if (!bar) return;
    if (window.gsap && window.ScrollTrigger) {
      gsap.to(bar, {
        width: '100%', ease: 'none',
        scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.2 }
      });
    }
  }

  function initAnchorScroll() {
    document.body.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var hash = (a.getAttribute('href') || '').slice(1);
      if (!hash) return;
      var targetId = hashToId[hash] || hash;
      var el = document.getElementById(targetId);
      if (el) {
        e.preventDefault();
        if (window.lenis) window.lenis.scrollTo(el, { offset: 0, duration: 1.2 });
        else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  function finishInit() {
    initLenis();
    initScrollProgress();
    initAnchorScroll();
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }

  function initApp() {
    var preloader = document.getElementById('skoll-preloader');
    var barEl = document.getElementById('skoll-preloader-bar');
    var wordEl = document.getElementById('skoll-preloader-word');
    var gsap = window.gsap;
    var logoImg = wordEl ? wordEl.querySelector('img') : null;
    var letters = wordEl ? wordEl.querySelectorAll('span') : [];

    function setBar(pct) { if (barEl) barEl.style.width = (pct * 100) + '%'; }

    function hidePreloader() {
      if (!preloader) { finishInit(); return; }
      if (gsap) {
        gsap.to(preloader, {
          y: '-100%', duration: 0.8, ease: 'power4.inOut',
          onComplete: function () {
            preloader.classList.add('skoll-preloader-out');
            window.__skollPreloaderDone = true;
            try { window.dispatchEvent(new CustomEvent('skoll:preloader:done')); } catch (e) {}
            finishInit();
          }
        });
      } else {
        preloader.style.transform = 'translateY(-100%)';
        preloader.classList.add('skoll-preloader-out');
        window.__skollPreloaderDone = true;
        try { window.dispatchEvent(new CustomEvent('skoll:preloader:done')); } catch (e) {}
        finishInit();
      }
    }

    loadAllWithProgress(setBar).then(function (anyLoaded) {
      setBar(1);

      if (gsap) {
        if (logoImg) {
          gsap.to(logoImg, { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out', delay: 0.1 });
        } else if (letters.length) {
          gsap.to(letters, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out', delay: 0.1 });
        }
      } else {
        if (logoImg) {
          logoImg.style.opacity = 1;
          logoImg.style.transform = 'none';
        }
        letters.forEach(function (s) { s.style.opacity = 1; s.style.transform = 'none'; });
      }

      var hasFinished = false;
      function finishPreloader() {
        if (hasFinished) return;
        hasFinished = true;
        if (!anyLoaded) showLoadErrorMessage();
        hidePreloader();
      }

      setTimeout(function () {
        var heroVideo = document.querySelector('.skoll-hero-video');
        if (!heroVideo || heroVideo.readyState >= 3) {
          finishPreloader();
          return;
        }
        var timeoutId = setTimeout(finishPreloader, 5000);
        ['canplaythrough', 'loadeddata', 'error', 'stalled'].forEach(function (evt) {
          heroVideo.addEventListener(evt, function () { clearTimeout(timeoutId); finishPreloader(); }, { once: true });
        });
      }, 600);
    }).catch(function () {
      setBar(1);
      showLoadErrorMessage();
      setTimeout(hidePreloader, 400);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initApp);
  else initApp();
})();
