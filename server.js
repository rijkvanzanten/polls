const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const shortid = require('shortid');
const Socket = require('socket.io');
const toString = require('vdom-to-html');
const compression = require('compression');
const spdy = require('spdy');
const db = require('levelup')('polls-db', {
  valueEncoding: 'json'
});
const {renderHome, renderResult} = require('./lib/render');

const port = process.env.PORT || 3000;
const production = process.env.NODE_ENV === 'production';

// Read static assets that will be pushed to the client
const files = [
  fs.readFileSync(path.join(__dirname, 'public', 'fonts.css')),
  fs.readFileSync(path.join(__dirname, 'public', 'style.css')),
  fs.readFileSync(path.join(__dirname, 'public', 'index.js')),
  fs.readFileSync(path.join(__dirname, 'public', 'custom-font.js'))
];

const sslOptions = {
  key: production ? fs.readFileSync('/etc/letsencrypt/live/polls.rijks.website/privkey.pem') : fs.readFileSync(path.join(__dirname, 'server.key')),
  cert: production ? fs.readFileSync('/etc/letsencrypt/live/polls.rijks.website/fullchain.pem') : fs.readFileSync(path.join(__dirname, 'server.crt')),
  spdy: {
    protocols: ['h2', 'http/1.1']
  }
};

const app = express()
  .use(compression())
  .use('/static/', express.static('public', {maxAge: '31d'}))
  .use('/sw.js', sendServiceWorker)
  .use(bodyParser.urlencoded({extended: false}))
  .get('/', getHome)
  .post('/', createInstance)
  .get('/:id', getInstance)
  .get('/:id/:answerId', voteRoute);

const server = spdy
  .createServer(sslOptions, app)
  .listen(port, err => {
    if (err) {
      throw err;
    }
    console.log(`Listening on port: ${port}`);
  });

const io = new Socket(server)
  .on('connection', connectSocket)
  .on('disconnect', disconnectSocket);

function sendServiceWorker(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'sw.js'));
}

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

  socketVote(`${req.params.id}/${req.params.answerId}`);

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
}

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

  if (res.push) {
    // TODO: Clean this up
    res.push('/static/fonts.css', {
      request: {accept: '*/*'},
      response: {'content-type': 'text/css'}
    })
    .on('error', err => {
      console.log(err);
    })
    .end(files[0]);

    res.push('/static/style.css', {
      request: {accept: '*/*'},
      response: {'content-type': 'text/css'}
    })
    .on('error', err => {
      console.log(err);
    })
    .end(files[1]);

    res.push('/static/index.js', {
      request: {accept: '*/*'},
      response: {'content-type': 'text/javascript'}
    })
    .on('error', err => {
      console.log(err);
    })
    .end(files[2]);

    res.push('/static/custom-font.js', {
      request: {accept: '*/*'},
      response: {'content-type': 'text/javascript'}
    })
    .on('error', err => {
      console.log(err);
    })
    .end(files[3]);
  }

  res.send(`
    <!doctype html>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Polls</title>
    <link rel="stylesheet" href="/static/style.css">
    <link rel="stylesheet" href="/static/fonts.css">
    <link rel="apple-touch-icon" sizes="180x180" hre/staticf="/icons/apple-touch-icon.png">
    <link rel="icon" type="image/png" href="/static/icons/favicon-32x32.png" sizes="32x32">
    <link rel="icon" type="image/png" href="/static/icons/favicon-16x16.png" sizes="16x16">
    <link rel="manifest" href="/static/icons/manifest.json">
    <link rel="mask-icon" href="/static/icons/safari-pinned-tab.svg" color="#ff0b45">
    <link rel="shortcut icon" href="/static/icons/favicon.ico">
    <meta name="msapplication-config" content="/static/icons/browserconfig.xml">
    <meta name="theme-color" content="#ffffff">
    <script>var initData = ${JSON.stringify(data)};</script>
    <script src="/static/custom-font.js" async></script>
    <script src="/static/index.js" defer></script>
    ${doc}
  `);
}
