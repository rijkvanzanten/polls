/* eslint-env browser */

if (document.querySelector('main').classList.contains('question')) {
  require('./modules/socket.js')();
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(register)
    .catch(onerror);
}

function register() {
  console.log('ServiceWorker succesfully registered');
}

function onerror(err) {
  console.log('ServiceWorker registration failed', err);
}
