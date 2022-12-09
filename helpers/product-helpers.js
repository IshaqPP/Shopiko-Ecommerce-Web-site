var db = require('../config/connection')
var collection = require('../config/collection');
const { response } = require('express');
var objectId = require('mongodb').ObjectId

module.exports={
    
    addProduct: (product, urls) => {
        return new Promise(async (resolve, reject) => {
            product.date = new Date()
            product.image = urls
            product.category = product.category.toUpperCase()
            console.log("product",product);
            await db.get().collection('product').insertOne(product).then((data) => {
                // resolve(data.insertedId.toString())
                resolve()
            })
        })
    },

    getAllProduct:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },

    //UPDATE PRODUCT
    updateProduct: (prodId, prodDetails, urls) => {
        console.log(urls, '^^^^^^^^^^^^^^^^^6');
        console.log(prodDetails,"prodDetails -----------------------------------");
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION)
                .updateOne({ _id: objectId(prodId) }, {
                    $set: {
                        'Product-Name': prodDetails.ProductName,
                        Brand: prodDetails.Brand,
                        Price: prodDetails.Price,
                        Stock: prodDetails.Stock,
                        category: prodDetails.category,
                        'Prouct-Discription': prodDetails.ProductDiscrption,
                        image: urls
                    }
                }).then((response) => {
                    console.log(response, 'OOOOOOOOOOOOOOOOOOOOOOOOOOO');
                    resolve(response)
                })
        })
    },

    //DELETE PRODUCT
    deleteProduct: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: objectId(prodId) }).then((response) => {
                resolve(response)
                console.log("deleted successfuly");
            })
        })
    },

     //PRODUCT DETAILS
     getProductDetails: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(prodId) }).then((product) => {
                resolve(product)
            })
        })
    },

    //UPDATE PRODUCT CATEGORY
    updateProductCategory: (category) => {
        return new Promise(async (resolve, reject) => {
            category.inputValue = category.inputValue.toUpperCase()
            await db.get().collection(collection.PRODUCT_COLLECTION).updateMany({
                category: category.categoryName
            }, {
                $set: {
                    category: category.inputValue
                }
            })
            resolve()
        })
    },

    //DELETE PRODUCT CATEGORY
    deleteProductCategory: (catName) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteMany({ category: catName }).then((response) => {
                resolve(response)
                console.log("deleted successfuly");
            })
        })
    },


}