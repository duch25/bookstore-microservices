const mongoose = require('mongoose');

class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        const queryObj = { ...this.queryString };

        let categoriesOption = {}, authorsOption = {}, publisherOption = {};
        if (queryObj.categories) {
            const categoriesQuery = queryObj.categories.split(',');
            categoriesOption = {
                categories: {
                    $in: categoriesQuery
                },
            }
        }

        if (queryObj.authors) {
            const authorsQuery = queryObj.authors.split(',');
            authorsOption = {
                authors: {
                    $in: authorsQuery
                },
            }
        }

        if (queryObj.publisher) {
            const publisherQuery = queryObj.publisher;
            publisherOption = {
                "publisher": publisherQuery
            }
        }

        const excludedFields = ['categories', 'authors', 'publisher', 'page', 'sort', 'limit', 'fields', 'name'];
        excludedFields.forEach(el => delete queryObj[el]);

        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

        // console.log(queryStr);
        // console.log(publisherOption);
        this.query = this.query.find({
            $and: [JSON.parse(queryStr), categoriesOption, authorsOption, publisherOption]
        })

        return this;
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        }

        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');
        }

        return this;
    }

    paginate() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);

        return this;
    }
}

module.exports = APIFeatures;
