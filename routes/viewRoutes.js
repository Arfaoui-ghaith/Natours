const express = require('express');
const router = express.Router();
const viewsController = require('./../controllers/viewsController');
const authController = require('./../controllers/authController');
const bookingController = require('./../controllers/bookingController');

router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewsController.getOverview
);

router.get('/forgotPassword', viewsController.getForgotPassword);

router.get('/send_Reset_Password_token', viewsController.getSuccessSend);

router.get('/resetPassword/:token', viewsController.getresetPasswordForm);

router.get('/signup', viewsController.getSignUp);

router.get('/me', authController.protect, viewsController.getAccount);

router.get('/my-tours', authController.protect, viewsController.getMyTours);

router.use(authController.isLoggedIn);

router.get('/tour/:name', viewsController.getTour);

router.get('/login', viewsController.getLogin);

router.get('/logout', authController.logout, viewsController.getLogin);

module.exports = router;
