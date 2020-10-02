const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const APIFeatures = require('./../utils/apiFeatures');
exports.deleteOne = (Model) =>
  catchAsync(async (req, res) => {
    const document = await Model.findByIdAndDelete(req.params.id);

    if (!document) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!document) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        document: document,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res) => {
    const newDoc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        newDoc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) {
      query = query.populate(popOptions);
    }
    const doc = await query;
    //const doc = await Model.findOne({ _id: req.params.id });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //build query
    //1.a) filtrings
    //const queryObj = { ...req.query };
    //const excludedFields = ['page', 'sort', 'limit', 'fields'];
    //excludedFields.forEach((el) => delete queryObj[el]);

    //1.b) advanced filtrings
    //let queryStr = JSON.stringify(queryObj);
    //queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    //console.log(JSON.parse(queryStr));

    //let query = Tour.find(JSON.parse(queryStr));

    //2) Sorting
    //if (req.query.sort) {
    //query = query.sort(req.query.sort);
    //} else {
    //query = query.sort('-createdAt');
    //}

    //3) limiting fields
    //if (req.query.fields) {
    //const fields = req.query.fields.split(',').join(' ');
    //query = query.select(fields);
    //} else {
    //query = query.select('-__v');
    //}

    //4) pagination
    //const page = req.query.page * 1 || 1;
    //const limit = req.query.limit * 1 || 3;
    //const skip = (page - 1) * limit;

    //query = query.skip(skip).limit(limit);

    //if (req.query.page) {
    //const numTours = await Tour.countDocuments();
    //if (skip >= numTours) {
    //throw new Error('This Page does not exist !');
    //}
    //}
    //EXCUTE QUERY

    //allow for nested routes tour reviews
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sorting()
      .limitFields()
      .pagination();
    const docs = await features.query;
    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        docs,
      },
    });
  });
