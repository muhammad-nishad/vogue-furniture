
let db = require('../config/connection')
let collection = require('../config/collections')
let bcrypt = require('bcrypt')
const express = require('express');
const { response } = require('express');
const { ObjectID } = require('bson');
const userHelpers = require('./user-helpers');
const objectId = require('mongodb').ObjectId;

module.exports = {


    doLogin: (adminlogin) => {
        return new Promise(async (resolve, reject) => {

            let response = {
                status: false,
                admin: false

            }
            // adminlogin.Password = await bcrypt.hash(adminlogin.Password, 10);
            // db.get().collection(collection.ADMIN_COLLECTION).insertOne(adminlogin)


            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ Email: adminlogin.Email })
            if (admin) {
                bcrypt.compare(adminlogin.Password, admin.Password).then((valid) => {
                    if (valid) {

                        response.status = true
                        response.admin = admin
                        resolve(response)

                    } else {
                        response.invalidPassword = true
                        reject(response)
                    }
                })
            } else {
                response.userNotfound = true

                reject(response)
            }
        })
    },
    blockuser: (Id) => {
        db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(Id) }, {
            $set: {
                ActiveStatus: false
            }
        })
    },

    activeUser: (Id) => {
        db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(Id) }, {
            $set: {
                ActiveStatus: true
            }
        })
    },
    addCoupen: (coupenData) => {
        let response = {}
        coupenData.coupendiscount = parseInt(coupenData.coupendiscount)
        return new Promise(async (resolve, reject) => {

            let coupen = await db.get().collection(collection.COUPEN_COLLECTION).findOne({ coupencode: coupenData.coupencode })
            if (coupen) {
                response.coupenExist = true
                resolve(response)

            } else {
                response.coupenExist = false
                db.get().collection(collection.COUPEN_COLLECTION).insertOne(coupenData).then((response) => {
                    resolve(response)
                })
            }
        })
    },


    getAllCoupens: () => {
        return new Promise(async (resolve, reject) => {
            let allCoupens = await db.get().collection(collection.COUPEN_COLLECTION).find().toArray()
            resolve(allCoupens)

        })
    },

    getoneCoupens: (coupenId) => {
        return new Promise(async (resolve, reject) => {
            let coupen = await db.get().collection(collection.COUPEN_COLLECTION).findOne({ _id: ObjectID(coupenId) })
            resolve(coupen)
        })
    },

    updateCoupen: (id, coupenData) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPEN_COLLECTION)
                .updateOne({ _id: ObjectID(id) }, {
                    $set: {
                        coupenid: coupenData.coupenid,
                        coupencode: coupenData.coupencode,
                        coupendescription: coupenData.coupendescription
                    }

                }).then((response) => {
                    resolve(response)

                })

        })
    },

    deleteCoupen: (coupenId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPEN_COLLECTION).deleteOne({ _id: ObjectID(coupenId) }).then((response) => {
                resolve(response)
            })
        })
    },

    ApplyCoupen: (coupenData, userId) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let coupen = await db.get().collection(collection.COUPEN_COLLECTION).findOne({ coupencode: coupenData.coupencode })
            if (coupen) {
                let userExist = await db.get().collection(collection.COUPEN_COLLECTION).findOne({ coupencode: coupenData.coupencode, users: { $in: [ObjectID(userId)] } })
                if (userExist) {
                    response.status = false
                    response.coupen = coupen
                    resolve(response)

                } else {
                    response.coupen = coupen
                    response.status = true
                    userHelpers.getTotalAmount(userId).then((total) => {
                        response.discount = total - ((total * coupen.coupendiscount) / 100)
                        response.discountPrice = (total * coupen.coupendiscount) / 100
                        resolve(response)

                    })
                }

            } else {
                response.status = false
                resolve(response)
            }
        })
    },
    totalRevenue: () => {
        return new Promise(async (resolve, reject) => {
            let totalRevenue = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    '$project': {
                        'totalAmount': 1,
                        'status': 1
                    }
                }, {
                    '$match': {
                        'status': {
                            '$ne': 'cancel'
                        }
                    }
                }, {
                    '$set': {
                        'totalAmount': {
                            '$toInt': '$totalAmount'
                        }
                    }
                }, {
                    '$group': {
                        '_id': null,
                        'sum': {
                            '$sum': '$totalAmount'
                        }
                    }
                }
            ]).toArray()
            resolve(totalRevenue)

        })
    },
    cashOndeivery: () => {
        return new Promise(async (resolve, reject) => {
            let cashOndeivery = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    '$project': {
                        'payment': 1
                    }
                }, {
                    '$match': {
                        'payment': {
                            '$eq': 'COD'
                        }
                    }
                }, {
                    '$group': {
                        '_id': null,
                        'count': {
                            '$sum': 1
                        }
                    }
                }
            ]).toArray()
            resolve(cashOndeivery)
        })
    },
    netBanking: () => {
        return new Promise(async (resolve, reject) => {
            let netBanking = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    '$project': {
                        'payment': 1
                    }
                }, {
                    '$match': {
                        'payment': {
                            '$eq': 'netBanking'
                        }
                    }
                }, {
                    '$group': {
                        '_id': null,
                        'count': {
                            '$sum': 1
                        }
                    }
                }
            ]).toArray()
            resolve(netBanking)

        })
    },
    allOrders: () => {
        return new Promise(async (resolve, reject) => {
            let allorders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    '$unwind': {
                        'path': '$products'
                    }
                }, {
                    '$project': {
                        'status': 1,
                        'quantity': '$products.quantity'
                    }
                }, {
                    '$match': {
                        'status': {
                            '$ne': 'cancel'
                        }
                    }
                }, {
                    '$group': {
                        '_id': null,
                        'count': {
                            '$sum': '$quantity'
                        }
                    }
                }
            ]).toArray()
            resolve(allorders)
        })
    }

}






