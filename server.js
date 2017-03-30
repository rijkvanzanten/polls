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
  .post('/', createInstance)
  .get('/:id', getInstance)
  .get('/:id/:answerId', voteRoute)
  .listen(port, host, () => console.log(`server started ${host}:${port} 💯`));

const io = new Socket(server)
  .on('connection', connectSocket)
  .on('disconnect', disconnectSocket);

function vote(questionId, answerId, callback) {
  db.get(questionId, (err, val) => {
    if (err) {
      callback(err);
    } else {
      val.options[answerId].votes++;
      db.put(questionId, val, err => {
        callback(err, val);
      });
    }
  });
}

function getHome(req, res) {
  return respond(res, renderHome());
}

function createInstance(req, res) {
  const id = shortid.generate();
  createRoom(id, req.body.question, req.body.answers);
  res.redirect('/' + id);
}

function getInstance(req, res) {
  db.get(req.params.id, (err, val) => {
    if (err) {
      res.redirect('/');
    } else {
      respond(res, renderResult(req.params.id, val, true), [req.params.id, val, true]);
    }
  });
}

function voteRoute(req, res) {
  vote(req.params.id, req.params.answerId, callback);

  function callback(err) {
    if (err) {
      res.redirect('/');
    } else {
      res.redirect('/' + req.params.id);
    }
  }
}

function connectSocket(socket) {
  socket.join(getSocketRoomId(socket));

  socket.on('vote', socketVote);

  function socketVote(ids) {
    ids = ids.split('/');

    vote(ids[0], ids[1], callback);

    function callback(err, val) {
      if (err) {
        console.log(err);
      }

      io.in(ids[0]).emit('update', val);
    }
  }
}

function disconnectSocket(socket) {
  socket.leave(getSocketRoomId(socket));
}

function getSocketRoomId(socket) {
  return socket.conn.request.headers.referer.substr(socket.conn.request.headers.referer.lastIndexOf('/') + 1);
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

function respond(res, vdom, data) {
  const doc = toString(vdom);

  res.send(`
    <!doctype html>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Polls</title>
    <link rel="stylesheet" href="/static/style.css">
    <script>var initData = ${JSON.stringify(data)};</script>
    <script src="/static/fontfaceobserver.js"></script>
    <script src="/socket.io/socket.io.js" defer></script>
    <script src="/static/index.js" defer></script>
    ${doc}
  `);
}
