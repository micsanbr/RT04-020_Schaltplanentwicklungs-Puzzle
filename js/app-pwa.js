// PWA - Based on
// https://developers.google.com/codelabs/pwa-training/pwa03--going-offline
// https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Offline_Service_workers

// Detects if device is on iOS
const isIos = () => {
  // const userAgent = window.navigator.userAgent.toLowerCase();
  // return /iphone|ipad|ipod/.test(userAgent);
  let platform = navigator?.userAgentData?.platform || navigator?.platform || 'unknown';
  if (/iPad|iPhone|iPod/.test(platform)) {
    return true;
  } else {
    return navigator.maxTouchPoints &&
      navigator.maxTouchPoints > 2 &&
      /MacIntel/.test(platform);
  }
}

// Detects if device is in standalone mode
const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

// Service worker only works via https://
// It works also on localhost, using for example npx serve
// It doesn't work in local resources like file://
// It doesn't work via http://
if (window.location.protocol == 'file:') {
  // ERROR on file protocol
  console.log('Service workers are not supported via file:// protocol.');
} else {
  // WARNING on http protocol
  if (window.location.protocol == 'http:' && (window.location.hostname != '127.0.0.1' && window.location.hostname != 'localhost')) {
    console.log('Service workers are supported via http:// protocol from 127.0.0.1 / localhost.');
  }
  if ('serviceWorker' in navigator) {
    // iOS requires special handling as usual
    let modalBodyIos = document.querySelector('#modal-add-to-home-screen .modal-body-ios');
    let modalBodyNotIos = document.querySelector('#modal-add-to-home-screen .modal-body-not-ios');
    modalBodyIos.style.display = 'none';
    modalBodyNotIos.style.display = 'block';
    if (isIos()) {
      if (!isInStandaloneMode()) {
        modalBodyIos.style.display = 'block';
        modalBodyNotIos.style.display = 'none';
        // Update UI to notify the user they can add to home screen
        $('#modal-add-to-home-screen').moduleModal('open');
      }
    }

    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/' // By default, the scope is defined by the location of the service worker script.
        });
        console.log('Service worker registered.', registration);
      } catch (error) {
        console.log('Service worker registration failed.', error);
      }
    });

    // Add to home screen
    // https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Add_to_home_screen
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      deferredPrompt = e;
      // Update UI to notify the user they can add to home screen
      $('#modal-add-to-home-screen').moduleModal('open');
      // Select the button
      const addBtn = document.querySelector('.add-to-home-screen');
      addBtn.addEventListener('click', (e) => {
        // Hide our user interface that shows our A2HS button
        $('#modal-add-to-home-screen').moduleModal('close');
        // Show the prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('Add to home screen: prompt accepted by user.');
          } else {
            console.log('Add to home screen: prompt dismissed by user.');
          }
          deferredPrompt = null;
        });
      });
    });
  } else {
    console.log('Service Worker is not supported in this browser.');
  }
}
