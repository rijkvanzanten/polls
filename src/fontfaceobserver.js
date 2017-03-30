/* eslint-env browser */
const FontFaceObserver = require('fontfaceobserver');

const font = new FontFaceObserver('Lobster');

font.load().then(() => document.documentElement.classList.add('fonts-loaded'));
