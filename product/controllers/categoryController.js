const Category = require('../models/categoryModel')

const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

module.exports = {
    getAllCategories: catchAsync(async function (req, res, next) {
        const features = new APIFeatures(Category.find(), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();

        const categories = await features.query;

        res.status(200).json({
            status: 'success',
            data: {
                categories
            }
        })
    }),

    getCategory: catchAsync(async (req, res, next) => {
        const category = await Category.findById(req.params.id);

        if (!category) return next(new AppError("No category found with that ID", 404));

        res.status(200).json({
            status: 'success',
            data: {
                category
            }
        });
    }),

    createCategory: catchAsync(async function (req, res, next) {
        const newCategory = await Category.create(req.body);

        res.status(201).json({
            status: 'success',
            data: {
                category: newCategory
            }
        });
    }),

    updateCategory: catchAsync(async (req, res, next) => {
        const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!category) return next(new AppError("No category found with that ID", 404));

        res.status(200).json({
            status: 'success',
            data: {
                category
            }
        });
    }),

    deleteCategory: catchAsync(async (req, res, next) => {
        const category = await Category.findByIdAndDelete(req.params.id);

        if (!category) return next(new AppError("No category found with that ID", 404));

        res.status(204).json({
            status: 'success',
            data: null
        });
    })
}