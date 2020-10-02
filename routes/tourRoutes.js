const fs = require('fs');
const authController = require('./../controllers/authController');

const express = require('express');
const router = express.Router();
const tourController = require('./../controllers/tourController');
//const reviewController = require('./../controllers/reviewController');

const reviewRouter = require('./../routes/reviewRoutes');

//router.param('id', tourController.checkID);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/natours-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlang/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:latlang/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(authController.protect, tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createNewTour
  );

router
  .route('/:id')
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.UpdateSingleTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.DeleteSingleTour
  )
  .get(tourController.getSingleTour);

/*router
  .route('/:tourId/reviews')
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.createReview
  );*/

router.use('/:tourId/reviews', reviewRouter);

module.exports = router;
