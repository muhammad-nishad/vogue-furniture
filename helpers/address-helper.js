let db = require('../config/connection')
let collection = require('../config/collections')
const { response } = require('express')
let ObjectID = require('mongodb').ObjectID


module.exports = {

    addAddress: (address, userid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).insertOne({ address, user: ObjectID(userid) }).then((address) => {
                resolve(address)
            })
        })

    },
    getAddressDetails: (userId) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.ADDRESS_COLLECTION).find({ user: ObjectID(userId) }).toArray()
            resolve(address)
        })
    },
    updateAddress: (userid, address) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION)
                .updateOne({ _id: ObjectID(userid) },
                    {
                        $set: {
                            'address.Name': address.Name,
                            'address.Mobile': address.Mobile,
                            'address.Pincode': address.Pincode,
                            'address.Locality': address.Locality,
                            'address.Address': address.Address,
                            'address.Landmark': address.Landmark,
                            'address.AlternatePhone': address.Phone
                        }
                    }).then((response) => {
                        resolve(response)
                    })
        })

    },
    getAllAddress: () => {
        return new Promise((resolve, reject) => {
            let allAddress = db.get().collection(collection.ADDRESS_COLLECTION).find().toArray()
            resolve(allAddress)
        })
    },


    deleteAddress: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).deleteOne({ _id: ObjectID(id) }).then((response) => {
                resolve(response)
            })
        })
    }

}