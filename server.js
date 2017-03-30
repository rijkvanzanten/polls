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
  .use('/static/', express.static('public', {maxAge: '31d'}))
  .use(bodyParser.urlencoded({extended: false}))
  .get('/', getHome)
  .post('/', postHome)
  .get('/:id', getRoom)
  .get('/:id/:answerId', vote)
  .listen(port, host, () => console.log(`server started ${host}:${port} 💯`));

const io = new Socket(server)
  .on('connection', joinRoom)
  .on('disconnect', leaveRoom);

function joinRoom(socket) {
  const referer = socket.conn.request.headers.referer;
  const id = referer.substr(referer.lastIndexOf('/') + 1);
  socket.join(id);

  socket.on('vote', socketVote);

  function socketVote(vote) {
    vote = vote.split('/');
    db.get(vote[0], (err, val) => {
      val.options[vote[1]].votes++;
      db.put(vote[0], val, () => {
        io.in(vote[0]).emit('update', val);
      });
    });
  }
}

function leaveRoom(socket) {
  const referer = socket.conn.request.headers.referer;
  const id = referer.substr(referer.lastIndexOf('/') + 1);
  socket.leave(id);
}

function getHome(req, res) {
  return respond(res, renderHome());
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
      respond(res, renderResult(req.params.id, val, true));
    }
  });
}

function vote(req, res) {
  db.get(req.params.id, (err, val) => {
    if (err) {
      res.redirect('/');
    } else {
      val.options[req.params.answerId].votes++;
      db.put(req.params.id, val, () => {
        res.redirect('/' + req.params.id);
      });
    }
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

function respond(res, vdom) {
  const doc = toString(vdom);

  res.send(`
    <!doctype html>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Polls</title>
    <link rel="stylesheet" href="/static/style.css">
    <script src="/static/fontfaceobserver.js"></script>
    <script src="/socket.io/socket.io.js" defer></script>
    <script src="/static/index.js" defer></script>
    ${doc}
  `);
}
