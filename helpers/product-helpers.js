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
            product.productOffer = 0
            product.categoryOffer = 0
            product.currentOffer = 0
            console.log("product",product);
            await db.get().collection('product').insertOne(product).then((data) => {
                // resolve(data.insertedId.toString())
                resolve()
            })
        })
    },
    getCategoryProduct:(Category)=>{
        console.log(" category ******************",Category);
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find({category:Category}).toArray()
            resolve(products)
        })
    },
    getAllProduct:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    getRandomProduct:()=>{
        return new Promise((resolve, reject) => {
            let RandomProduct = db.get().collection(collection.PRODUCT_COLLECTION).aggregate(
                [
                    {
                        '$group':{
                            _id: '$category',
                            product:{$push : "$$ROOT"}
                            
                            
                          }
                    }, {
                        '$project': {
                            product:{
                              $slice:[
                                '$product',0,4
                                ]
                            }
                          }
                    }
                ]
            ).toArray()
            resolve(RandomProduct)
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

    //RANDOM PRODUCTS
    relatedProducts: (prodId,category) => {
        return new Promise((resolve, reject) => {
            

            let related = db.get().collection(collection.PRODUCT_COLLECTION).find(
               { $and: [{_id:{$ne:objectId(prodId)}},{category:category}] }).limit(4).toArray()
            resolve(related)
        })
    },

    //GET UPDATED PRODUCT WITH OFFER
    getProductOffer: () => {
        return new Promise((resolve, reject) => {
            let productOffer = db.get().collection(collection.PRODUCT_COLLECTION).aggregate(
                [
                    {
                        '$match': {
                            'productOffer': {
                                '$gt': 0
                            }
                        }
                    }, {
                        '$project': {
                            'Product-Name': 1,
                            'productOffer': 1
                        }
                    }
                ]
            ).toArray()
            resolve(productOffer)
        })
    },

     //GET UPDATED CATEGORY WITH OFFER
     getCategoryOffer: () => {
        return new Promise(async (resolve, reject) => {
            let categoryOffer = await db.get().collection(collection.CATEGORY_COLLECTION).find(
                {
                    categoryOffer: { $gt: 0 }
                }
            ).toArray()
            resolve(categoryOffer)
        })
    },

    //ADD PRODUCT OFFER
    addProductOffer: (offer) => {
        let prodId = objectId(offer.product)
        let offerPercentage = Number(offer.productOffer)
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
                {
                    _id: objectId(prodId)
                },
                {
                    $set: { productOffer: offerPercentage }
                }
            )
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: prodId })
            if (product.productOffer >= product.categoryOffer) {
                let temp = (product.Price * product.productOffer) / 100
                
                let updatedOfferPrice = (product.Price - temp)
                updatedOfferPrice = Math.ceil(updatedOfferPrice)
                let updatedProduct = await db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
                    {
                        _id: objectId(prodId)
                    },
                    {
                        $set: {
                            offerPrice: updatedOfferPrice,
                            currentOffer: product.productOffer
                        }
                    }
                )
                resolve(updatedProduct)
            } else if (product.productOffer < product.categoryOffer) {
                let temp = (product.Price * product.categoryOffer) / 100
                
                let updatedOfferPrice = (product.Price - temp)
                updatedOfferPrice = Math.ceil(updatedOfferPrice)
                let updatedProduct = await db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
                    {
                        _id: objectId(prodId)
                    },
                    {
                        $set: {
                            offerPrice: updatedOfferPrice,
                            currentOffer: product.categoryOffer
                        }
                    }
                )
                resolve(updatedProduct)
            }
            resolve()
        })
    },

    // //ADD PRODUCT OFFER
    // addProductOffer: (offer) => {
    //     return new Promise(async (resolve, reject) => {
    //         await db.get().collection(collection.PRODUCT_COLLECTION).updateMany(
                
    //             {productOffer : 0,
    //                     categoryOffer : 0,
    //                     currentOffer : 0 
    //             })
            
    //         resolve()
    //     })
    // },

    //ADD CATEGORY OFFER
    addCategoryOffer: (offer) => {
        let category = offer.category
        let offerPercentage = Number(offer.categoryOffer)
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.CATEGORY_COLLECTION).updateOne(
                {
                    category: category
                },
                {
                    $set: {
                        categoryOffer: offerPercentage
                    }
                }
            )
            await db.get().collection(collection.PRODUCT_COLLECTION).updateMany(
                {
                    category: category
                },
                {
                    $set: {
                        categoryOffer: offerPercentage
                    }
                }
            )
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({
                category: category
            }).toArray()

            for (let i = 0; i < products.length; i++) {
                if (products[i].categoryOffer >= products[i].productOffer) {
                    let temp = (products[i].Price * products[i].categoryOffer) / 100
                    let updatedOfferPrice = (products[i].Price - temp)
                    updatedOfferPrice = Math.ceil(updatedOfferPrice)
                    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({
                        _id: objectId(products[i]._id)
                    },
                        {
                            $set: {
                                offerPrice: updatedOfferPrice,
                                currentOffer: products[i].categoryOffer
                            }
                        }
                    )
                } else if (products[i].categoryOffer < products[i].productOffer) {
                    let temp = (products[i].Price * products[i].productOffer) / 100
                    let updatedOfferPrice = (products[i].Price - temp)
                    updatedOfferPrice = Math.ceil(updatedOfferPrice)
                    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({
                        _id: objectId(products[i]._id)
                    },
                        {
                            $set: {
                                offerPrice: updatedOfferPrice,
                                currentOffer: products[i].productOffer
                            }
                        }
                    )
                }
            }
            resolve()
        })

    },

    //DELETE PORDUCT OFFER
    deleteProductOffer: (prodId, product) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(prodId) },
                {
                    $set: { productOffer: 0 }
                }
            ).then(() => {
                db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(prodId) }).then(async (response) => {
                    console.log("response ******************* ",response);
                    if (response.productOffer == 0 && response.categoryOffer == 0) {
                        console.log("ia INNN            productOffer == 0 && categoryOffer == 0    ");
                        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(prodId) }, {
                            $set: {
                                offerPrice: response.Price,
                                currentOffer: 0
                            }
                        })
                    } else if (response.productOffer < response.categoryOffer) {
                        console.log("ia INNN            productOffer <  categoryOffer   ");
                        let temp = (response.Price * response.categoryOffer) / 100
                        let updatedOfferPrice = (response.Price - temp)
                        updatedOfferPrice = Math.ceil(updatedOfferPrice)


                        let updatedProduct = await db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
                            {
                                _id: objectId(prodId)
                            },
                            {
                                $set: {
                                    offerPrice: updatedOfferPrice,
                                    currentOffer: response.categoryOffer
                                }
                            }
                        )
                        resolve(updatedProduct)
                    }
                })
                resolve()
            })
        })
    },

    //DELTE CATEGORY OFFER
    deleteCategoryOffer: (category) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ category: category }, { $set: { categoryOffer: 0 } })
            db.get().collection(collection.PRODUCT_COLLECTION).updateMany({ category: category }, { $set: { categoryOffer: 0 } }).then(async (response) => {
                let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: category }).toArray()
                for (i = 0; i < products.length; i++) {
                    if (products[i].productOffer == 0 && products[i].categoryOffer == 0) {
                        products[i].offerPrice = products[i].Price
                        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(products[i]._id) }, { $set: { offerPrice: products[i].offerPrice, currentOffer: 0 } })
                    } else if (products[i].categoryOffer < products[i].productOffer) {
                        let temp = (products[i].Price * products[i].productOffer) / 100
                        let updatedOfferPrice = (products[i].Price - temp)
                        updatedOfferPrice = Math.ceil(updatedOfferPrice)
                        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({
                            _id: objectId(products[i]._id)
                        },
                            {
                                $set: {
                                    offerPrice: updatedOfferPrice,
                                    currentOffer: products[i].productOffer
                                }
                            }
                        )
                    }
                }
            })
            resolve()
        })
    },

}