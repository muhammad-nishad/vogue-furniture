let db = require('../config/connection')
let collection = require('../config/collections')
let bcrypt = require('bcrypt')

let ObjectID = require('mongodb').ObjectID


module.exports = {

    addproduct: (product) => {
        product.Price = parseInt(product.Price)
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {
                resolve(data)
            })
        })
    },
    getAllProduct: () => {
        return new Promise(async (resolve, reject) => {
            let allProduct = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(allProduct)
        })
    },


    deleteProduct: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: ObjectID(prodId) }).then((response) => {
                resolve(response)
            })
        })

    },

    getProductDetails: (prodId) => {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: ObjectID(prodId) })
            resolve(product)
        })
    },


    updateProduct: (prodId, proDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION)
                .updateOne({ _id: ObjectID(prodId) }, {
                    $set: {
                        productId: proDetails.productId,
                        Description: proDetails.Description,
                        Stock: proDetails.Stock,
                        Price: parseInt(proDetails.Price),
                        Discount: proDetails.Discount,
                        image: proDetails.image
                    }

                }).then((response) => {
                    resolve(response)
                })
        })
    },
    // getCategoryProduct:(category)=>{
    //     return new Promise(async(resolvse,reject)=>{
    //         console.log(category);
    //        let cat=await  db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
    //             {
    //                 $match:{ categoryName:categoryName(category)}

    //             }

    //         ]).toArray(cat)
    //         console.log(cat ,'hi');
    //         resolvse(cat)
    //     })
    // }
    getCategoryProduct:(category)=>{
        console.log(category ,'category');
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
                {
                    $match:{'categoryName':category}
                }
            ]).toArray()
            console.log(products);
            resolve(products)
        
        })
    }
}









