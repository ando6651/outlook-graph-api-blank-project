

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
require('dotenv').config();

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const redirectsRouter  = require('./routes/redirect');

const session = require('express-session');
const flash = require('connect-flash');
const msal = require('@azure/msal-node');

const authRouter = require('./routes/auth');

const bodyParser = require('body-parser');
const cors = require('cors');
var app = express();

app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.locals.users = {};

// MSAL config
const msalConfig = {
  auth: {
    clientId: process.env.OAUTH_CLIENT_ID || '',
    authority: process.env.OAUTH_AUTHORITY,
    clientSecret: process.env.OAUTH_CLIENT_SECRET
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message, containsPii) {
        if (!containsPii) console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: msal.LogLevel.Verbose,
    }
  }
};
app.locals.msalClient = new msal.ConfidentialClientApplication(msalConfig);

app.use(session({
  secret: 'your_secret_value_here',
  resave: false,
  saveUninitialized: false,
  unset: 'destroy'
}));

app.use(flash());

app.use(function(req, res, next) {
  res.locals.error = req.flash('error_msg');
  var errs = req.flash('error');
  for (var i in errs){
    res.locals.error.push({message: 'An error occurred', debug: errs[i]});
  }
  if (req.session.userId) {
    res.locals.user = app.locals.users[req.session.userId];
  }

  next();
});

var hbs = require('hbs');
var ejs = require('ejs');

app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', ejs.renderFile);
app.set('view engine', 'ejs');

app.set('view engine', 'hbs');

// <FormatDateSnippet>
var dateFns = require('date-fns');
// Helper to format date/time sent by Graph
hbs.registerHelper('eventDateTime', function(dateTime) {
  const date = dateFns.parseISO(dateTime);
  return dateFns.format(date, 'M/d/yy h:mm a');
});
// </FormatDateSnippet>

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/redirect', redirectsRouter);


// error handler
app.use(function(err, req, res) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status( 500);
  res.render('error');
});


module.exports = app;
