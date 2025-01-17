const { promisify } = require('util');
const User = require('./../Models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const bcrypt = require('bcryptjs');
const Email = require('./../utils/email.js');
const crypto = require('crypto');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: false,
    httpOnly: true, // the cookie cannot be access or modified by the browser
  };

  /*if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true; // the cookie will only be send in encrypted connexion HTTPS
  }*/

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined; // remove the password from the output

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  const url = `${req.protocol}://${req.get('host')}/me`;
  //console.log(url);
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(
      new AppError('please provide a valid email and password !', 400)
    );
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incrorrect email or password !', 401));
  }
  createSendToken(user, 200, res);
});

exports.logout = (req, res, next) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now(0)),
    httpOnly: false,
  });

  req.user = null;

  next();
};

exports.protect = catchAsync(async (req, res, next) => {
  console.log('hello from protect');
  console.log(req.originalUrl);
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  } /*else if (req.originalUrl.indexOf('/api/v1/users/resetPassword/') > -1) {
    const resetTokenID = req.originalUrl.split('/').slice(-1)[0];
    console.log(resetTokenID);
    let hashedToken = crypto
      .createHash('sha256')
      .update(resetTokenID)
      .digest('hex');
    console.log(hashedToken);

    let userObj = await User.findOne({
      passwordResetToken: hashedToken,
    });
    token = signToken(userObj._id);
    console.log(token);
  }*/

  console.log(token);

  if (!token) {
    return next(
      new AppError('You are not logged In ! Please log in to get access.', 401)
    );
  }
  // 2) Verification
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // 3) Check if user still exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError('The user belonging to this token does not exist.', 401)
    );
  }
  // 4) Check if user changed password after the token was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! please log in again.', 401)
    );
  }
  // Grant access to Protected Route
  req.user = freshUser;
  res.locals.user = freshUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  console.log(req.body.email);
  // 1) Get user based on Posted email address
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with this email address.', 404));
  }
  // 2) Generate the random reset Token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // 3) Send it to user's email

  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later.',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  console.log('hello from reset password');
  // 1) get user baed on the Token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpires: { $gt: Date.now() },
  });

  // 2) set new password but only when the token not expired
  if (!user) {
    return next(new AppError('Token is invalid or has expired'), 400);
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;

  await user.save();

  // 3) update changePasswordAt property for the user

  // 4) log the user in, send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) get user from collection
  const user = await User.findById(req.user.id).select('+password');
  // 2) check if posted current password is correct
  if (!(await user.correctPassword(req.body.password, user.password))) {
    return next(new AppError('Incrorrect current password !', 401));
  }
  // 3) if so, update password
  user.password = req.body.newpassword;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // 4) Log in, send jwt
  createSendToken(user, 200, res);

  next();
});

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  // 1) Getting token and check of it's there

  if (req.cookies.jwt) {
    try {
      // 2) Verification
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      // 3) Check if user still exists
      const freshUser = await User.findById(decoded.id);
      if (!freshUser) {
        return next();
      }
      // 4) Check if user changed password after the token was issued
      if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      // Grant access to Protected Route
      res.locals.user = freshUser;

      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};
