let db = require('../config/connection')
let collection = require('../config/collections')
const { response } = require('express')
let ObjectID = require('mongodb').ObjectID





module.exports = {
    addBanner: (banner) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BANNER_COLLECTION).insertOne(banner).then((data) => {
                resolve(data)
            })
        })
    },
    getAllBanner: () => {
        return new Promise(async (resolve, reject) => {
            let allbanner = await db.get().collection(collection.BANNER_COLLECTION).find().toArray()
            resolve(allbanner)

        })

    },
    getbannerDetails: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BANNER_COLLECTION).findOne({ _id: ObjectID(id) }).then((banner) => {
                resolve(banner)
            })
        })
    },


    updateBanner: (id, bannerdetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BANNER_COLLECTION)
                .updateOne({ _id: ObjectID(id) }, {

                    $set: {
                        Bannername: bannerdetails.Bannername,
                        Bannerdescription: bannerdetails.Bannerdescription

                    }
                }).then((response) => {
                    resolve()
                })
        })
    },

    deleteBanner: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BANNER_COLLECTION).deleteOne({ _id: ObjectID(id) }).then((response) => {
                resolve(response)
            })
        })
    }


}