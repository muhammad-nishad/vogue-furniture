let db = require('../config/connection')
let collection = require('../config/collections')
const { response } = require('express')
let ObjectID = require('mongodb').ObjectID

module.exports = {

    addCategory: (categorydata) => {
        return new Promise(async (resolve, reject) => {
            let categoryexist = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ categoryName: categorydata.categoryName })

            const state = {
                categoryexist: false,
                category: null
            }

            if (!categoryexist) {
                db.get().collection(collection.CATEGORY_COLLECTION).insertOne(categorydata).then((data) => {
                    state.categoryexist = false
                    state.category = categorydata
                    resolve(state)
                })

            } else {
                state.categoryexist = true
                state.category = categorydata.categoryName
                resolve(state)
            }
        })

    },
    getAllCategory: () => {
        return new Promise(async (resolve, reject) => {
            let allCategory = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray().then(allCategory => {
                resolve(allCategory)
            })

        })

    },

    deleteCategory: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({ _id: ObjectID(prodId) }).then((response) => {
                resolve(response)
            })
        })
    },

    getCategoryDetails: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: ObjectID(prodId) }).then((category) => {
                resolve(category)
            })
        })
    },

    updateCategory: (categoryId, categDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION)
                .updateOne({ _id: ObjectID(categoryId) }, {
                    $set: {
                        categoryName: categDetails.categoryName,
                        categoryDescription: categDetails.categoryDescription

                    }
                }).then((response) => {
                    resolve()
                })
        })
    }
}