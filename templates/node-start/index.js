const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const knex = require('./src/db');
const { ConnectSessionKnexStore } = require('connect-session-knex');
const morgan = require('morgan');
const routes = require('./src/routes');

const app = express();
const ENV = process.env.NODE_ENV || 'production';
const PORT = parseInt(process.env.PORT || '3000');
const DIST = path.join(__dirname, './templates/dist/{{PROJECT}}/browser');

app.set('env', ENV)
  .set('port', PORT)
  .set('view engine', 'ejs')
  .set('views', path.join(__dirname, 'views'))
  .disable('x-powered-by')
  .use(morgan('tiny'))
  .use(express.urlencoded({ extended: false }))
  .use(express.json())
  .use(cookieParser());

app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')))
  .use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')))
  .use('/files/', express.static(path.join(__dirname, 'data/files')));

// TODO change express-session secret key, see: https://www.npmjs.com/package/express-session#secret
const sessionStore = new ConnectSessionKnexStore({ knex });
app.use(session({
  name: 'sid',
  secret: process.env.SESSION_SECRET || 'conduit',
  cookie: { maxAge: 60000 },
  resave: true,
  saveUninitialized: false, // only save sessions when they are explicitly initialized
  store: sessionStore,
}));

app.use(async (req, res, next) => {
  try {
    if (req.session.userId) {
      const user = await knex('users').select('id', 'email').where({ id: req.session.userId }).first();
      if (user)
        res.locals.user = user;
    }
    return next();
  } catch (err) {
    return next(err);
  }
});

app.use('/favicon.ico', (req, res, next) => res.sendFile('/favicon.ico', { root: DIST }));
app.use('/app/', (req, res, next) => res.locals.user ? express.static(DIST)(req, res, next) : res.redirect('/signin'));
app.use(async (req, res, next) => {
  const authPath = ['/signin', '/signup', '/logout'].some(p => req.url.startsWith(p));
  const user = res.locals.user;
  if (authPath) {
    if (user && req.url !== '/logout')
      return res.redirect('/');
  } else {
    if (req.url.startsWith('/app')) {
      return res.sendFile('/index.html', { root: DIST });
    }
    if (user)
      return res.sendFile('/index.html', { root: DIST })
    else if (req.url == '/')
      return res.redirect('/signin');
  }
  next();
});

app.use('/', routes);

app.use((req, res) => res.status(404).render('status', { message: "Not Found" }));
app.use((err, req, res) => (console.error(err.stack), res.status(500).render('status', { message: "Internal Server Error" })));

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT} in ${ENV} mode`));
process.on('SIGINT', () => (console.log('Shutting down...'), process.exit(0)));
