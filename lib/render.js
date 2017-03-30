const h = require('virtual-dom/h');
const convert = require('convert-range');

module.exports = {
  renderHome,
  renderResult
};

function renderHome() {
  return h('main', {
    className: 'home'
  }, [
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

function renderResult(id, questionObject, votingAllowed) {
  const votes = Object.keys(questionObject.options).map(optionId => questionObject.options[optionId].votes);
  const max = Math.max(...votes) || 1;

  return h('main', {
    className: 'question'
  }, [
    h('h1', questionObject.question),
    h('div', {className: 'results'}, Object.keys(questionObject.options).map(key =>
      h('div', [
        answerButton(key, questionObject.options[key]),
        h('div', {
          className: 'bar',
          style: {
            transform: `scaleX(${convert(questionObject.options[key].votes, {min: 0, max}, {min: 0, max: 1})})`
          }
        })
      ])
    ))
  ]);

  function answerButton(key, answer) {
    if (votingAllowed) {
      return h('a', {
        href: id + '/' + key
      }, `(${answer.votes}) ${answer.name}`);
    }
    return h('p', `(${answer.votes}) ${answer.name}`);
  }
}
