/* eslint-env browser */
/* global io */
const socket = io();

io()
  .on('connect', convertAnchors)
  .on('update', update);

function convertAnchors() {
  document.querySelectorAll('a').forEach(addEventListener);

  function addEventListener(a) {
    a.addEventListener('click', addSocketEmitListener);

    function addSocketEmitListener(e) {
      socket.emit('vote', e.target.getAttribute('href'));
      e.preventDefault();
      return false;
    }
  }
}

function update(data) {
  console.log(data);
}
