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


     //ORDER STATUS
     changeOrderStatus: (prodId, orderId, status) => {
        return new Promise((resolve, reject) => {
            let dateStatus = new Date().toDateString()
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId), 'products.item': objectId(prodId) },
                { $set: { 'products.$.status': status, statusUpdateDate: dateStatus } }).then((response) => {
                    resolve(response)
                })
        })
    },


    //SALES REPORT
    deliveredOrderList: (yy, mm) => {
        console.log("yy .................",yy,"mm .............",mm);
        return new Promise(async (resolve, reject) => {
            let agg = [{
                $match: {
                    'products.status': 'delivered'
                }
            }, {
                $unwind: {
                    path: '$products'
                }
            }, {
                $project: {
                    item: '$products.item',
                    totalAmount: '$totalAmount',
                    paymentMethod: '$paymentMethod',
                    statusUpdateDate: '$statusUpdateDate',
                }
            }, {
                $lookup: {
                    from: 'product',
                    localField: 'item',
                    foreignField: '_id',
                    as: 'result'
                }
            }, {
                $project: {
                    totalAmount: 1,
                    productPrice: '$result.Price',
                    statusUpdateDate: 1,
                    paymentMethod: '$paymentMethod'
                }
            }]

            if (mm) {
                let start = "1"
                let end = "30"
                let fromDate = mm.concat("/" + start + "/" + yy)
                let fromD = new Date(new Date(fromDate).getTime() + 3600 * 24 * 1000)

                let endDate = mm.concat("/" + end + "/" + yy)
                let endD = new Date(new Date(endDate).getTime() + 3600 * 24 * 1000)
                dbQuery = {
                    $match: {
                        statusUpdateDate: {
                            $gte: fromD,
                            $lte: endD
                        }
                    }
                }
                agg.unshift(dbQuery)
                let deliveredOrders = await db
                    .get()
                    .collection(collection.ORDER_COLLECTION)
                    .aggregate(agg).toArray()
                resolve(deliveredOrders)
            } else if (yy) {
                let dateRange = yy.daterange.split("-")
                let [from, to] = dateRange
                from = from.trim("")
                to = to.trim("")
                fromDate = new Date(new Date(from).getTime() + 3600 * 24 * 1000)
                toDate = new Date(new Date(to).getTime() + 3600 * 24 * 1000)
                dbQuery = {
                    $match: {
                        statusUpdateDate: {
                            $gte: fromDate,
                            $lte: toDate
                        }
                    }
                }
                agg.unshift(dbQuery)
                let deliveredOrders = await db
                    .get()
                    .collection(collection.ORDER_COLLECTION)
                    .aggregate(agg).toArray()
                resolve(deliveredOrders)
            } else {
                let deliveredOrders = await db
                    .get()
                    .collection(collection.ORDER_COLLECTION)
                    .aggregate(agg).toArray()
                resolve(deliveredOrders)
            }
        })
    },

    //TOTAL AMOUNT OF DELIVERED PRODUCTS
    totalAmountOfdelivered: () => {
        return new Promise(async (resolve, reject) => {
            let amount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    '$match': {
                        'products.status': 'delivered'
                    }
                }, {
                    '$group': {
                        '_id': null,
                        'total': {
                            '$sum': '$totalAmount'
                        }
                    }
                }
            ]).toArray()
            resolve(amount[0]?.total)
        })
    },

    //DASHBOARD COUNT
    dashboardCount: (days) => {
        days = parseInt(days)
        return new Promise(async (resolve, reject) => {
            let startDate = new Date();
            let endDate = new Date();
            startDate.setDate(startDate.getDate() - days)

            console.log("startDate",startDate,"endDate",endDate);

            let data = {};

            data.deliveredOrders = await db.get().collection(collection.ORDER_COLLECTION).find({
                date: { $gt: startDate, $lte: endDate }, 'products.status': 'delivered'
            }).count()
            data.shippedOrders = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gt: startDate, $lte: endDate }, 'products.status': 'shipped' }).count()
            data.placedOrders = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gt: startDate, $lte: endDate }, 'products.status': 'placed' }).count()
            data.pendingOrders = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gt: startDate, $lte: endDate }, 'products.status': 'pending' }).count()
            data.canceledOrders = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gt: startDate, $lte: endDate }, 'products.status': 'canceled' }).count()
            data.returnedOrders = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gt: startDate, $lte: endDate }, 'products.status': 'returned' }).count()

            let codTotal = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        date: {
                            $gte: startDate, $lte: endDate
                        },
                        paymentMethod: 'COD'
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: {
                            $sum: "$totalAmount"
                        }
                    }
                }
            ]).toArray()
            data.codTotal = codTotal?.[0]?.totalAmount
            let onlineTotal = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        date: {
                            $gte: startDate, $lte: endDate
                        },
                        paymentMethod: 'PAYPAL'
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: {
                            $sum: "$totalAmount"
                        }
                    }
                }
            ]).toArray()
            data.onlineTotal = onlineTotal?.[0]?.totalAmount
            let RazorpayTotal = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        date: {
                            $gte: startDate, $lte: endDate
                        },
                        paymentMethod: 'ONLINE'
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: {
                            $sum: "$totalAmount"
                        }
                    }
                }
            ]).toArray()
            data.RazorpayTotal = RazorpayTotal?.[0]?.totalAmount
            let totalAmount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        date: {
                            $gte: startDate, $lte: endDate
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: {
                            $sum: "$totalAmount"
                        }
                    }
                }
            ]).toArray()
            data.totalAmount = totalAmount?.[0]?.totalAmount
            resolve(data)
        })
    },

     //GET COUPONS
     getCoupon: () => {
        return new Promise(async (resolve, reject) => {
            let coupons = await db.get().collection(collection.COUPON_COLLECTION).find({}).toArray()
            resolve(coupons)
        })
    },

    //ADD COUPON
    addCoupon: (data) => {
        data.coupon = data.coupon.toUpperCase()
        data.couponOffer = Number(data.couponOffer)
        data.minPrice = Number(data.minPrice)
        data.priceLimit = Number(data.priceLimit)
        data.expDate = new Date(data.expDate)
        data.user = []
        return new Promise(async (resolve, reject) => {
            let couponCheck = await db.get().collection(collection.COUPON_COLLECTION).findOne({ coupon: data.coupon })
            if (couponCheck == null) {
                db.get().collection(collection.COUPON_COLLECTION).insertOne(data).then((response) => {
                    resolve()
                })
            } else {
                console.log('Rejected');
                reject()
            }
        })
    },
    
    //DELETE COUPON
    deleteCoupon: (data) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPON_COLLECTION).deleteOne({ coupon: data })
            resolve()
        })
    },


}