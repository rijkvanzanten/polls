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
  const max = Math.max(...votes);

  return h('main', {
    className: 'question'
  }, [
    h('h1', 'Polls'),
    h('div', {className: 'results'}, Object.keys(questionObject.options).map(key =>
      h('div', [
        h('div', {
          className: 'bar',
          style: {
            transform: `scaleY(${convert(questionObject.options[key].votes, {min: 0, max}, {min: 0, max: 1})})`
          }
        }),
        answerButton(key, questionObject.options[key])
      ])
    ))
  ]);

  function answerButton(key, answer) {
    if (votingAllowed) {
      return h('a', {
        href: id + '/' + key
      }, [
        answer.name,
        answer.votes
      ]);
    }
    return h('p', [answer.name, answer.votes]);
  }
}
