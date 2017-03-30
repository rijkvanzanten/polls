/* eslint-env browser */
/* global initData */

const diff = require('virtual-dom/diff');
const patch = require('virtual-dom/patch');
const createElement = require('virtual-dom/create-element');
const io = require('socket.io-client');
const {renderResult} = require('../../lib/render');

module.exports = function () {
  const initialData = initData;

  let tree = renderResult(...initialData);
  let rootNode = createElement(tree);
  document.body.replaceChild(rootNode, document.querySelector('main'));

  const socket = io()
    .on('connect', init)
    .on('update', update);

  function init() {
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
    const newTree = renderResult(window.location.href.substr(window.location.href.lastIndexOf('/') + 1), data, true);
    const patches = diff(tree, newTree);
    rootNode = patch(rootNode, patches);
    tree = newTree;
  }
};
