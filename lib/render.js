const h = require('virtual-dom/h');

module.exports = {
  renderHome,
  renderResult
};

function renderHome() {
  return h('main', [
    h('h1', 'Polls'),
    h('form', {
      action: '/',
      method: 'post'
    }, [
      h('label', [
        'Vraag',
        h('input', {
          type: 'text',
          name: 'question'
        })
      ]),
      h('label', [
        'Antwoorden (1 per regel please)',
        h('textarea', {
          name: 'answers',
          rows: 4
        })
      ]),
      h('button', {
        type: 'submit'
      }, 'Maak poll')
    ])
  ]);
}

function renderResult() {

}
