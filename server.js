const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const shortid = require('shortid');
const Socket = require('socket.io');
const toString = require('vdom-to-html');
const uuidV1 = require('uuid/v1');
const compression = require('compression');
const session = require('express-session');
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
  .use(session({
    secret: uuidV1(),
    saveUninitialized: true,
    resave: false,
    cookie: {maxAge: 86400000}
  }))
  .use(initSession)
  .get('/', getHome)
  .post('/', postHome)
  .get('/:id', getRoom)
  .get('/:id/:answerId', vote)
  .listen(port, host, () => console.log(`server started ${host}:${port} 💯`));

const io = new Socket(server);

io.on('connection', socket => {

});

function initSession(req, res, next) {
  if (req.headers.cookie) {
    res.locals.cookiesEnabled = true;
  } else {
    res.locals.cookiesEnabled = false;
  }

  if (!req.session.voted) {
    req.session.voted = [];
  }

  return next();
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
      const votingAllowed = res.locals.cookiesEnabled && req.session.voted.includes(req.params.id) === false;
      res.send(toString(renderResult(req.params.id, val, votingAllowed)));
    }
  });
}

function vote(req, res) {
  // Disable voting when cookies aren't enabled or already has voted on
  if (!res.locals.cookiesEnabled || req.session.voted.includes(req.params.id)) {
    return res.redirect('/' + req.params.id);
  }

  db.get(req.params.id, (err, val) => {
    if (err) {
      res.redirect('/');
    } else {
      val.options[req.params.answerId].votes++;
      db.put(req.params.id, val, () => {
        if (!req.session.voted.includes(req.params.id)) {
          req.session.voted.push(req.params.id);
        }
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
    <script src="/static/index.js" defer></script>
    ${doc}
  `);
}
