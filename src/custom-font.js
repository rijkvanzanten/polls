/* eslint-env browser */
if ('FontFace' in window) {
  document.fonts.ready.then(() => {
    document.documentElement.classList.add('fonts-loaded');
  });
}
