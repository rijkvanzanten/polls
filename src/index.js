/* eslint-env browser */
/* global io */
const socket = io();

socket.on('connect', () => {
  document.querySelectorAll('a').forEach(a => a.addEventListener('click', e => {
    socket.emit('vote', e.target.getAttribute('href'));
    e.preventDefault();
    return false;
  }));
});

socket.on('update', data => {
  console.log(data);
});
