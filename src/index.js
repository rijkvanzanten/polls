/* eslint-env browser */

if (document.querySelector('main').classList.contains('question')) {
  require('./modules/socket.js')();
}
