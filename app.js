let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');

const hbs = require('express-handlebars')
// const fileUpload = require('express-fileUpload') 
const db = require('./config/connection')
const session = require('express-session')
const Handlebars = require('handlebars')

const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');

const app = express();

const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');




// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine({
  extname: 'hbs', defaultLayout: 'layout',
  layoutsDir: __dirname + '/views/layout/',
  partsialsDir: __dirname + '/views/partials',
  helpers: {
    total: (quant, price) => {
      return quant * price;
    },
    subtotal:(totalAmount,delivery)=>{
      return totalAmount + delivery 

    },
    isEqual :(a, b, options)=>{
      if(a == b){
        return options.fn(this)
      }
      return options.inverse(this)
    },
    handlebars: allowInsecurePrototypeAccess(Handlebars) 
  }
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// app.use(fileUpload())


const MemoryStore = session.MemoryStore;
app.use(session({
  name: 'app.sid',
  secret: '1234567890QWERTY',
  resave: true,
  store: new MemoryStore(),
  saveUninitialized: true,
  cookie: { maxAge: 3600000000000000 }
}));




db.connect((err) => {
  if (err)
    console.log('connection error' + err);
  else
    console.log("db connected");
})

app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error',{err});
});

module.exports = app;