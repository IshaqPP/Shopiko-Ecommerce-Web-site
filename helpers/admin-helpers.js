var db = require('../config/connection');
var collection = require('../config/collection');
var bcrypt = require('bcrypt')
var objectId = require('mongodb').ObjectId

module.exports={
    
    //ADMIN LOG IN
    adminLogin:(adminData)=>{
        let response = {};
        return new Promise(async(resolve,reject)=>{
            console.log("entered email id "+adminData.email);
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({Email:adminData.email})
            console.log(admin);
            console.log("entered password====== "+adminData.password);
            if (admin) {
                bcrypt.compare(adminData.password,admin.password).then((status)=>{
                    if (status) {
                        response.admin = admin;
                        response.status = true;
                        resolve(response);
                        console.log("login success");
                    } else {
                        console.log('Password Incorrect');
                        response.status = false;
                        resolve(response);
                    }
                })
            }else{
                console.log('Login Failed');
                reject({ status: false })
            }
        })
    },


    //ALL USERS
    listAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray();
            resolve(users)
        })
    },
    
    //USER STATUS
    userStatus: (userId) => {
        console.log("userId -------------",userId);
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, [{ $set: { status: { "$not": "$status" } } }])
            resolve('Success')
        })
    },
    
    //CATEGORY
    getCategory: () => {
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).find({}).sort({ date: -1 }).toArray()
            resolve(category);
        })
    },

    //ADD CATEGORY
    addCategory: (categoryData) => {
        return new Promise(async (resolve, reject) => {
            categoryData.category = categoryData.category.toUpperCase()
            categoryData.date = new Date();
            let categoryCheck = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ category: categoryData.category })
            if (categoryCheck == null) {
                db.get().collection(collection.CATEGORY_COLLECTION).insertOne(categoryData).then((response) => {
                    resolve(response.insertedId)
                })
            } else {
                reject()
            }
        })
    },

    editCategory: (categoryData) => {
        return new Promise(async (resolve, reject) => {
            categoryData.inputValue = categoryData.inputValue.toUpperCase()

            console.log("category data --------------",categoryData);
           // console.log("categoryData.categoryName -----------",categoryData.categoryName);
            let categoryCheck = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ category: categoryData.inputValue })
            if (categoryCheck == null) {
                db.get().collection(collection.CATEGORY_COLLECTION).updateOne(
                    {
                        // _id: objectId(categoryData.categoryId),
                        category: categoryData.categoryName
                    }, {
                    $set: {
                        category: categoryData.inputValue
                    }
                }
                ).then((response) => {
                    resolve(response.insertedId)
                })
            } else {
                reject()
            }
        })
    },


    //DELETE CATEGORY
    deleteCategory: (data) => {
        console.log("+++++++++++++++++++",data.catName);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({ category:data.catName  }).then((response) => {
                resolve(response)
                console.log("deleted from catgory collection");
            })
        })
    },

    //ORDER DETAILS
    getOrderDetails: () => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([

                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        deliveryDetails: '$deliveryDetails',
                        paymentMethod: '$paymentMethod',
                        totalAmount: '$totalAmount',
                        // offerPrice: '$offerPrice',
                        displayDate: '$displayDate',
                        status: '$products.status',
                        date: '$date'
                    }
                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ['$product', 0] },
                        deliveryDetails: 1,
                        paymentMethod: 1,
                        totalAmount: 1,
                        // offerPrice: '$product.offerPrice',
                        status: 1,
                        displayDate: 1,
                        date: 1

                    }
                }
            ]).toArray()
            resolve(orderItems)
        })
    },
}