const catchAsync = require('./../utils/catchAsync');
const Tour = require('../Models/tourModel');
const AppError = require('./../utils/appError');
const crypto = require('crypto');
const User = require('../Models/userModel');
const Booking = require('../Models/bookingModel');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get tour data from collection
  const tours = await Tour.find();

  // 2) Build template

  // 3) Render that template using tour data from step 1
  res.status(200).render('overview', {
    title: 'All Tours',
    tours: tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) get the data for requested tour
  const tour = await Tour.findOne({ name: req.params.name }).populate({
    path: 'reviews',
    fields: 'review rating user.photo',
  });

  if (!tour) {
    return next(new AppError('There is no Tour with that name.', 404));
  }
  // 2) Building template
  // 3) Render template using the data fom step 1
  res.status(200).render('tour', { title: tour.name, tour: tour });
});

exports.getLogin = (req, res) => {
  res
    .status(200)
    .render('login', { title: 'Log into your account.', user: req.user });
};

exports.getSignUp = (req, res) => {
  res.status(200).render('signup', { title: 'Sign Up.', user: req.user });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', { title: 'Your account', user: req.user });
};

exports.getForgotPassword = (req, res) => {
  res.status(200).render('forgetpassword', { title: 'Forgot Password.' });
};

exports.getSuccessSend = (req, res) => {
  res.status(200).render('successEmail', { title: 'Already sent.' });
};

exports.getresetPasswordForm = catchAsync(async (req, res, next) => {
  // 1) check if teh token expired or not valid
  console.log(`hello from views Controller token is : ${req.params.token}`);
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpires: { $gt: Date.now() },
  });

  // 2) set new password but only when the token not expired and valid
  if (!user) {
    return next(new AppError('Token is invalid or has expired'), 400);
  }

  // 2) Building template
  // 3) Render template using the data fom step 1
  res.status(200).render('resetPassword', { title: 'Reset your password.' });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) Find all Bookings
  const bookings = await Booking.find({ user: req.user.id });
  // 2) Find tours with the returned IDs
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});
