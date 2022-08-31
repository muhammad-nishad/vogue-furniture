let db = require('../config/connection')
let collection = require('../config/collections')
let bcrypt = require('bcrypt')
let { response } = require('express')
let ObjectID = require('mongodb').ObjectId
let Razorpay = require('razorpay')
const { resolve } = require('path')





let instance = new Razorpay({

    key_id: 'rzp_test_EszbVocoSJ8uJh',
    key_secret: 'QjINFuPQFRHgHNbVsGXgAVWj'
});

module.exports = {

    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            const state = {
                userexist: false,
                
            }
            if (!user) {
                userData.password = await bcrypt.hash(userData.password, 10)
               let user= db.get().collection(collection.USER_COLLECTION).insertOne({ fname: userData.fname, lname: userData.lname, email: userData.email, mobile: userData.mobile, password: userData.password, ActiveStatus: true }).then((data) => {
                    state.userexist = false
                    // state.usernotefound=true
                    state.user = user
                    console.log(state,'state');
                    resolve(state)
                })
            } else {
                state.userexist = true
                // state.usernotefound=true
                resolve(state)
            }
        })
    },
    getUser: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectID(userId) }).then((res) => {
                resolve(res)
            })
        })
    },

    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (user) {
                if (user.ActiveStatus) {
                    let status = await bcrypt.compare(userData.password, user.password)
                    console.log(status, 'status');
                    if (status) {
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        response.invalidPassword = true
                        reject(response)
                    }
                } else {
                    response.userBlocked = true
                    resolve(response)
                }
            } else {
                response.userNotfound = true
                reject(response)
            }
        })
    },

    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let allusers = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(allusers)
        })
    },

    getUserdetails: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectID(id) }).then((userdetails) => {
                resolve(userdetails)
            })
        })
    },

    updateUserdetails: (id, userdata) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION)
                .updateOne({ _id: ObjectID(id) }, {
                    $set: {
                        fname: userdata.fname,
                        lname: userdata.lname,
                        email: userdata.email,
                        mobile: userdata.mobile
                    }
                }).then((response) => {
                    resolve(response)
                })
        })
    },


    addtoCart: (prodId, userId) => {
        let proObj = {
            item: ObjectID(prodId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectID(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == prodId)
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: ObjectID(userId), 'products.item': ObjectID(prodId) },
                            {
                                $inc: { 'products.$.quantity': 1 }

                            }
                        ).then(() => {
                            resolve()
                        })
                } else {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: ObjectID(userId) },
                            {
                                $push: { products: proObj }

                            }

                        ).then((response) => {
                            resolve()
                        })
                }
            } else {
                let cartObj = {
                    user: ObjectID(userId),
                    products: [proObj]

                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },

    getCartProducts: (userid) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectID(userid) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()


            if (cartItems.length > 0) {
                // response.cartItems = true
                response.cartItems = cartItems
                console.log(response.cartItems);
                resolve(response)

            } else {
                response.cartEmpty = true
                resolve(response)
            }

        })
    },

    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectID(userId) })
            let count = 0
            if (cart) {
                count = cart.products.length
            }
            resolve(count)

        })
    },

    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: ObjectID(details.cart) },
                        {
                            $pull: { products: { item: ObjectID(details.product) } }

                        }
                    ).then((response) => {
                        resolve({ removeProduct: true })
                    })

            } else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: ObjectID(details.cart), 'products.item': ObjectID(details.product) },

                        {
                            $inc: { 'products.$.quantity': details.count }

                        }
                    ).then((response) => {
                        resolve(true)
                    })
            }

        })

    },
    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectID(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {  //to find total amount
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', '$product.Price'] } }
                    }
                }

            ]).toArray()
            if (total[0]) {
                console.log(total[0].total);
                resolve(total[0].total)
            } else {
                resolve()
            }
        })


    },
    removeFromCart: (proid, userId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectID(userId) },

                    {

                        $pull: { products: { item: ObjectID(proid) } }
                    }
                ).then((response) => {
                    resolve({ removeProduct: true })
                })

            } catch (err) {
                reject(err)
            }
        })
    },


    placeOrder: (order, products, totalAmount, coupen, userId) => {
        return new Promise((resolve, reject) => {
            console.log(order, products, totalAmount);
            let status = order.payment === 'COD' ? 'placed' : 'pending'
            let now = new Date()
            let date = now.toLocaleDateString();
            // let time = now.toLocaleTimeString();
            let orderObj = {
                deliverDetails: ObjectID(order.address),
                userId: ObjectID(order.userId),
                payment: order.payment,
                products: products,
                totalAmount: totalAmount,
                status: status,
                date: date
            }

            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).remove({ user: ObjectID(order.userId) })
                resolve(response.insertedId)
            })
            if (coupen) {
                db.get().collection(collection.COUPEN_COLLECTION).updateOne({ coupencode: coupen.coupencode },
                    {
                        $push: { 'users': ObjectID(userId) }
                    }
                )
            }
        })

    },
    getCartProductlist: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectID(userId) })
            resolve(cart.products)
        })

    },

    genrateRazorpay: (orderId, totalAmount) => {
        return new Promise((resolve, reject) => {
            let options = {
                amount: totalAmount * 100,
                currency: 'INR',
                receipt: "" + orderId
            };

            instance.orders.create(options, function (err, order) {
                if (err) {
                    // console.log(err);
                } else {
                    // console.log(order);
                    resolve(order)
                }
            })
        })
    },

    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            let crypto = require('crypto')
            let hmac = crypto.createHmac('sha256', 'QjINFuPQFRHgHNbVsGXgAVWj')
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }

        })
    },

    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({ _id: ObjectID(orderId) },
                    {
                        $set: {
                            status: 'placed'
                        }
                    }
                ).then(() => {
                    resolve()

                })
        })
    },

    addtoWishlist: (prodId, userId) => {
        let response = {}
        return new Promise(async (resolve, reject) => {
            let wishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: ObjectID(userId) })
            let item = {
                item: ObjectID(prodId)
            }
            if (wishlist) {
                let wishlistitemExist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ 'products': item })
                if (wishlistitemExist) {
                    response.wishlistitemExist = true
                    resolve(response)
                } else {
                    db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: ObjectID(userId) },
                        {

                            $push: { products: item }
                        }
                    )
                    response.wishlistitemExist = false
                    resolve(response)
                }

            } else {
                let wishListobj = {
                    user: ObjectID(userId),
                    products: [item]
                }
                db.get().collection(collection.WISHLIST_COLLECTION).insertOne(wishListobj).then((response) => {
                    resolve(response)
                })
            }
        })
    },

    getWishlistProducts: (userid) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let wislistItems = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
                {

                    $match: { user: ObjectID(userid) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',

                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }

                },
                {
                    $project: {
                        Price: 1, productId: 1, product: { $arrayElemAt: ['$products', 0] }
                    }
                }

            ]).toArray()
            if (wislistItems.length > 0) {
                response.wislistItems = wislistItems
                resolve(response)
            } else {
                response.wishlistEmpty = true
                resolve(response)
            }

        })

    },

    getUserOrder: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { 'userId': ObjectID(userId) }
                },

                {
                    $unwind: '$products'

                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'products.item',
                        foreignField: '_id',
                        as: 'result'
                    }
                },

                {
                    $unwind: '$result'
                },

                {
                    $project: {
                        product_name: '$result.productId',
                        Description: '$result.Description',
                        product_price: '$result.Price',
                        product_image: '$result.images',
                        payment: 1,
                        totalAmount: 1,
                        status: 1,
                        product_quantity: '$products.quantity',
                        date: 1
                    }
                }
            ]).toArray()
            console.log(orders);
            resolve(orders)


        })
    },
    getUserAddress: (addressid) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.ADDRESS_COLLECTION).find({ _id: ObjectID(addressid) }).toArray()
            resolve(address)
        })
    },

    getOrderProducts: (orderid) => {
        return new Promise(async (resolve, reject) => {

            let item = await db.get().collection(collection.ORDER_COLLECTION).aggregate([

                {
                    $match: { _id: ObjectID(orderid) }
                },

                {
                    $project: {
                        quantitty: '$products.quantity',
                        totalAmount: 1,
                        products: 1,
                        deliverDetails: 1,
                        userId: 1,
                        status: 1

                    }
                },


                {
                    $unwind: '$products'

                },
                {
                    $lookup: {
                        from: 'product',
                        localField: 'products.item',
                        foreignField: '_id',
                        as: 'products'
                    }
                }, {
                    $unwind: '$products'

                }, {
                    $lookup: {
                        from: 'address',
                        localField: 'deliverDetails',
                        foreignField: '_id',
                        as: 'addressDetails'
                    }
                },

                {
                    $unwind: '$addressDetails'
                },

                {
                    $lookup: {
                        from: 'user',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'userDetails'
                    }
                }, {
                    $unwind: '$userDetails'

                }, {
                    $project: {
                        product: '$products.productId',
                        address: '$addressDetails.address',
                        user: '$userDetails.fname',
                        lname: '$userDetails.lname',
                        image: '$products.images',
                        totalAmount: 1,
                        price: '$products.Price',
                        quantitty: 1,
                        status: 1
                    }
                },


            ]).toArray()
            resolve(item)

        })
    },

    removeFromWishlist: (prodId, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: ObjectID(userId) },

                {
                    $pull: { products: { item: ObjectID(prodId) } }
                }
            ).then((response) => {
                console.log('here');
                resolve({ removeProduct: true })
                console.log(response);
            })

        })
    },

    getWishlistCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let wishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: ObjectID(userId) })
            let count = 0
            if (wishlist) {
                count = wishlist.products.length
            }
            resolve(count)
        })
    },


    getAllOrders: () => {
        return new Promise(async (resolve, reject) => {
            let allOrders = await db.get().collection(collection.ORDER_COLLECTION).aggregate(
                [
                    {
                        $unwind: '$products'

                    }, {
                        $lookup: {
                            from: 'product',
                            localField: 'products.item',
                            foreignField: '_id',
                            as: 'result'
                        }
                    }, {
                        $unwind: '$result'

                    }, {
                        $project: {
                            productname: '$result.productId',
                            quantity: '$products.quantity',
                            price: '$result.Price',
                            payment: 1,
                            totalAmount: 1,
                            status: 1,
                            deliverDetails: 1,
                            userId: 1,
                            date: 1
                        }
                    },
                    {
                        $lookup: {
                            from: 'user',
                            localField: 'userId',
                            foreignField: '_id',
                            as: 'userDetails'
                        }
                    },
                    {
                        $unwind: '$userDetails'

                    },
                    {
                        $lookup: {
                            from: 'address',
                            localField: 'deliverDetails',
                            foreignField: '_id',
                            as: 'address'
                        }
                    },
                    {
                        $unwind: '$address'

                    },
                    {
                        $project: {
                            totalAmount: 1,
                            quantity: 1,
                            status: 1,
                            payment: 1,
                            price: 1,
                            address: '$address.address.Address',
                            Name: '$userDetails.fname',
                            lastname: '$userDetails.lname',
                            email: '$userDetails.email',
                            Mobile: '$userDetails.mobile',
                            productname: 1,
                            date: 1
                        }
                    }
                ]).toArray()
            console.log(allOrders, 'allorders');
            resolve(allOrders)
        })
    },


    getWishlistCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let wishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ _id: ObjectID(userId) })
            let count = 0
            if (wishlist) {
                count = wishlist.products.length
            }
            resolve(count)
        })
    },
    getOneorder: (orderid) => {
        return new Promise(async (resolve, reject) => {

            let item = await db.get().collection(collection.ORDER_COLLECTION).aggregate([

                {
                    $match: { _id: ObjectID(orderid) }
                },

                {
                    $project: {
                        quantitty: '$products.quantity',
                        totalAmount: 1,
                        products: 1,
                        deliverDetails: 1,
                        userId: 1

                    }
                },


                {
                    $unwind: '$products'

                }, {
                    $lookup: {
                        from: 'product',
                        localField: 'products.item',
                        foreignField: '_id',
                        as: 'products'
                    }
                }, {
                    $unwind: '$products'

                }, {
                    $lookup: {
                        from: 'address',
                        localField: 'deliverDetails',
                        foreignField: '_id',
                        as: 'addressDetails'
                    }
                }, {
                    $unwind: '$addressDetails'

                }, {
                    $lookup: {
                        from: 'user',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'userDetails'
                    }
                }, {
                    $unwind: '$userDetails'

                }, {
                    $project: {
                        product: '$products.productId',
                        address: '$addressDetails.address',
                        user: '$userDetails.fname',
                        lname: '$userDetails.lname',
                        image: '$products.images',
                        totalAmount: 1,
                        price: '$products.Price',
                        quantitty: 1
                    }
                }

            ]).toArray()
            console.log(item);
            resolve(item)

        })
    },
    changeOrderStatus: (data) => {
        console.log(data);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectID(data.orderId) }, {
                $set: {
                    status: data.status
                }
            }).then(res => {
                resolve(res)
            })
        })
    },
    getWishlistCount: (userid) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let wishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({user: ObjectID(userid) })
            if (wishlist) {
                count = wishlist.products.length

            }
            resolve(count)

        })
    },
    changePassword:(data,userId)=>{
        let response={}
        return new Promise(async(resolve,reject)=>{
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({_id:ObjectID(userId)})

            let status=await bcrypt.compare(data.currentpassword,user.password)

            if(status){
                data.newpassword=await bcrypt.hash(data.newpassword,10)
                db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectID(userId)},{


                    $set:{

                        password:data.newpassword
                    }

                }).then((response)=>{
                    resolve(response)
                })

            }else{
                wrongcurrentpass=true
                response.wrongcurrentpass=wrongcurrentpass

            }
            resolve(response)

        })
    }

}