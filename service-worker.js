// PWA
// https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Offline_Service_workers

const cacheName = 'rt04-020-v1';
const precacheResources = [
  '/index.html',
  '/css/app.css',
  '/css/style.min.css',
  '/fonts/BoschSans-Black.eot',
  '/fonts/BoschSans-Black.svg',
  '/fonts/BoschSans-Black.ttf',
  '/fonts/BoschSans-Black.woff',
  '/fonts/BoschSans-BlackItalic.eot',
  '/fonts/BoschSans-BlackItalic.svg',
  '/fonts/BoschSans-BlackItalic.ttf',
  '/fonts/BoschSans-BlackItalic.woff',
  '/fonts/BoschSans-Bold.eot',
  '/fonts/BoschSans-Bold.svg',
  '/fonts/BoschSans-Bold.ttf',
  '/fonts/BoschSans-Bold.woff',
  '/fonts/BoschSans-BoldItalic.eot',
  '/fonts/BoschSans-BoldItalic.svg',
  '/fonts/BoschSans-BoldItalic.ttf',
  '/fonts/BoschSans-BoldItalic.woff',
  '/fonts/BoschSans-Light.eot',
  '/fonts/BoschSans-Light.svg',
  '/fonts/BoschSans-Light.ttf',
  '/fonts/BoschSans-Light.woff',
  '/fonts/BoschSans-LightItalic.eot',
  '/fonts/BoschSans-LightItalic.svg',
  '/fonts/BoschSans-LightItalic.ttf',
  '/fonts/BoschSans-LightItalic.woff',
  '/fonts/BoschSans-Medium.eot',
  '/fonts/BoschSans-Medium.svg',
  '/fonts/BoschSans-Medium.ttf',
  '/fonts/BoschSans-Medium.woff',
  '/fonts/BoschSans-MediumItalic.eot',
  '/fonts/BoschSans-MediumItalic.svg',
  '/fonts/BoschSans-MediumItalic.ttf',
  '/fonts/BoschSans-MediumItalic.woff',
  '/fonts/BoschSans-Regular.eot',
  '/fonts/BoschSans-Regular.svg',
  '/fonts/BoschSans-Regular.ttf',
  '/fonts/BoschSans-Regular.woff',
  '/fonts/BoschSans-RegularItalic.eot',
  '/fonts/BoschSans-RegularItalic.svg',
  '/fonts/BoschSans-RegularItalic.ttf',
  '/fonts/BoschSans-RegularItalic.woff',
  '/fonts/dc_iconfont.eot?a153ec117a537dcbd3e93b8a1226be4c',
  '/fonts/dc_iconfont.ttf?a153ec117a537dcbd3e93b8a1226be4c',
  '/fonts/dc_iconfont.woff?a153ec117a537dcbd3e93b8a1226be4c',
  '/images/apple-appstore_de.svg',
  '/images/apple-appstore_en.svg',
  '/images/emphasized-bottom.svg',
  '/images/emphasized-top.svg',
  '/images/google-play-badge_de.png',
  '/images/google-play-badge_en.png',
  '/images/lazy-fallback.png',
  '/images/loading_spinner.gif',
  '/images/logo-pi.svg',
  '/images/logo.svg',
  '/images/podcast-teaser.svg',
  '/images/rexroth_logo_animated_113.gif',
  '/images/rexroth_logo_animated_300.gif',
  '/images/rexroth_wave.svg',
  '/images/favicons/android-chrome-192x192.png',
  '/images/favicons/android-chrome-512x512.png',
  '/images/favicons/apple-touch-icon.png',
  '/images/favicons/browserconfig.xml',
  '/images/favicons/favicon-16x16.png',
  '/images/favicons/favicon-32x32.png',
  '/images/favicons/favicon.ico',
  '/images/favicons/icon-128.png',
  '/images/favicons/icon-144.png',
  '/images/favicons/icon-152.png',
  '/images/favicons/icon-256.png',
  '/images/favicons/mstile-150x150.png',
  '/images/favicons/mstile-310x150.png',
  '/images/favicons/mstile-310x310.png',
  '/images/favicons/mstile-70x70.png',
  '/images/favicons/safari-pinned-tab.svg',
  '/images/favicons/site.webmanifest',
  '/js/app-pwa.js',
  '/js/app.js',
  '/js/script.js',
  '/js/vendor/jquery-3.6.0.min.js',
  '/js/vendor/jquery.gsap.min.js',
  '/js/vendor/lazysizes.min.js',
  '/js/vendor/panzoom.js',
  '/js/vendor/panzoom.min.js',
  '/js/vendor/respimage-1.4.2.min.js',
  '/js/vendor/TimelineLite.min.js',
  '/js/vendor/TimelineMax.min.js',
  '/js/vendor/TweenLite.min.js',
  '/js/vendor/TweenMax.min.js',
  '/js/vendor/easing/EasePack.min.js',
  '/js/vendor/plugins/AttrPlugin.min.js',
  '/js/vendor/plugins/BezierPlugin.min.js',
  '/js/vendor/plugins/ColorPropsPlugin.min.js',
  '/js/vendor/plugins/CSSPlugin.min.js',
  '/js/vendor/plugins/CSSRulePlugin.min.js',
  '/js/vendor/plugins/DirectionalRotationPlugin.min.js',
  '/js/vendor/plugins/EaselPlugin.min.js',
  '/js/vendor/plugins/EndArrayPlugin.min.js',
  '/js/vendor/plugins/ModifiersPlugin.min.js',
  '/js/vendor/plugins/PixiPlugin.min.js',
  '/js/vendor/plugins/RaphaelPlugin.min.js',
  '/js/vendor/plugins/RoundPropsPlugin.min.js',
  '/js/vendor/plugins/ScrollToPlugin.min.js',
  '/js/vendor/plugins/TextPlugin.min.js',
  '/js/vendor/utils/Draggable.min.js',
];

// Initialize the cache and add files to it for offline use.
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
  e.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    console.log('[Service Worker] Caching all: app shell and content.');
    await cache.addAll(precacheResources);
    console.log('[Service Worker] Caching complete.');
  })());
});

// Serve content from the cache instead of the network as long as the resource is actually in the cache (online or offline).
addEventListener('fetch', function (e) {
  console.log('[Service Worker] Fetch', e.request.url);
  e.respondWith((async () => {
    const cachedResponse = await caches.match(
      e.request,
      { ignoreSearch: true } // IMPORTANT!! This ignores the query string defined in the manifest start_url
    );
    // Success: serve content from the cache
    if (cachedResponse !== undefined) {
      return cachedResponse;
    }
    // If the file is not in the cache, request it from the network
    const networkResponse = await fetch(e.request);
    // The response will be consumed, so it must be cloned
    // one copy will be added to the cache and one copy will be served
    const clonedResponse = networkResponse.clone();

    e.waitUntil((async function () {
      console.log('[Service Worker] Cache new resource', e.request.url);
      const cache = await caches.open(cacheName);
      await cache.put(e.request, clonedResponse);
    })());

    // Serve the file
    return networkResponse;
  })());
});

self.addEventListener('activate', (e) => {
  console.log('[Service Worker] Activate');
  e.waitUntil(caches.keys().then((keyList) => {
    return Promise.all(keyList.map((key) => {
      if (key === cacheName) { return; }
      console.log('[Service Worker] Delete cache: ' + key);
      return caches.delete(key);
    }))
  }));
});
