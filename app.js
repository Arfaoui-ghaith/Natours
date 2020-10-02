const express = require('express');
const app = express();

const morgan = require('morgan');
const AppError = require('./utils/appError');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');
const globalErrorHandler = require('./controllers/errorController.js');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const path = require('path');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//app.use(helmet({ contentSecurityPolicy: false })); // scurity http headers

// development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// limit requests from same API
const limiter = rateLimit({
  max: 60 * 60,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in hour!',
});

app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Data sanitization, against nosql query injection
app.use(mongoSanitize());

// Data sanitization against XXS
app.use(xss());

// Prevent paramter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'price',
      'difficult',
      'id',
      'date',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'durationweeks',
      'startDates',
    ],
  })
);

// serving static files
app.use(express.static(`${__dirname}/public`));

// Test middleware
app.use((req, res, next) => {
  //console.log(req.headers);
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.cookies);
  next();
});

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  /*res.status(404).json({
    status: 'fail',
    message: `can't find ${req.originalUrl}`,
  });*/
  next(new AppError(`can't find ${req.originalUrl}`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
