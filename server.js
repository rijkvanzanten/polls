const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const shortid = require('shortid');
const Socket = require('socket.io');
const toString = require('vdom-to-html');
const compression = require('compression');
const db = require('levelup')('polls-db', {
  valueEncoding: 'json'
});
const {renderHome, renderResult} = require('./lib/render');

const host = process.env.HOST || '127.0.0.1';
const port = process.env.PORT || 3000;

const server = express()
  .use(compression())
  .use(bodyParser.urlencoded({extended: false}))
  .get('/', getHome)
  .post('/', postHome)
  .get('/:id', getRoom)
  .get('/:id/:answerId', vote)
  .listen(port, host, () => console.log(`server started ${host}:${port} 💯`));

const io = new Socket(server);

io.on('connection', socket => {

});

function getHome(req, res) {
  respond('home', res);
}

function postHome(req, res) {
  const id = shortid.generate();
  createRoom(id, req.body.question, req.body.answers);
  res.redirect('/' + id);
}

function getRoom(req, res) {
  db.get(req.params.id, (err, val) => {
    if (err) {
      res.redirect('/');
    } else {
      res.send(toString(renderResult(req.params.id, val)));
    }
  });
}

function vote(req, res) {
  db.get(req.params.id, (err, val) => {
    val.options[req.params.answerId].votes++;
    db.put(req.params.id, val, () => {
      res.redirect('/' + req.params.id);
    });
  });
}

function createRoom(id, question, answers) {
  const options = {};
  answers.split('\r\n').forEach(answer => {
    options[shortid.generate()] = {
      name: answer,
      votes: 0
    };
  });
  db.put(id, {question, options});
}

function respond(view, res) {
  switch (view) {
    case 'home':
      return res.send(toString(renderHome()));
    default:
      return res.send('¯\\_(ツ)_/¯');
  }
}
