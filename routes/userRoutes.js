const express = require('express');
const router = express.Router();
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

router.patch('/resetPassword/:token', authController.resetPassword);

//router.param('id', tourController.checkID);

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);

router.use(authController.protect); // for the routes below

router.route('/changePassword').patch(authController.updatePassword);

router.get('/me', userController.getMe, userController.getUser);

router
  .route('/updateMe')
  .patch(
    userController.uploadUserPhoto,
    userController.resizeUserPhoto,
    userController.updateMe
  );

router.route('/deleteMe').delete(userController.deleteMe);

router.use(authController.restrictTo('admin')); // for the routes below

router.route('/').get(userController.getAllUsers);

router
  .route('/:id')
  .patch(authController.restrictTo('admin'), userController.updateUser)
  .delete(authController.restrictTo('admin'), userController.deleteUser)
  .get(userController.getUser);

module.exports = router;
