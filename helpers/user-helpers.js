var db = require('../config/connection');
var collection = require('../config/collection');
var bcrypt = require('bcrypt')
var objectId = require('mongodb').ObjectId

module.exports = {

    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            let emailChecking = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })

            console.log(userData.Email + "user email is");
            console.log(emailChecking + "ur email is");

            if (emailChecking == null) {
                userData.password = await bcrypt.hash(userData.password, 10)
                userData.Rpassword = await bcrypt.hash(userData.Rpassword, 10)
                userData.status=true;
                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => resolve(userData))

            }
            else {
                reject("This email is Already Existing")
            }
        })
    },


    //USER LOGIN
    doLogin: (userData) => {
        let response = {};
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.email , status: true })
            console.log(user);
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        response.user = user;
                        response.status = true;
                        resolve(response);
                        console.log("login success");
                    } else {
                        console.log('Password Incorrect');
                        response.status = false;
                        resolve(response);
                       // reject({ status: false })
                    }
                }
                )
            }
            else {
                console.log('Login Failed');
                reject({ status: false })
            }

        })
    },

    //OTP LOGIN
    otpLogin: (userData) => {
        let response = {};
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ 
                MobileNumber: userData.mobile })
            if (user) {
                response.user = user;
                response.status = true;
                resolve(response);
                console.log("login success");
            } else {
                console.log('Mobile number is wrong');
                reject({ status: false })
            }
        }
        )
    },

    //ADD TO CART
    addToCart: (prodId, userId) => {
        let prodObj = {
            item: objectId(prodId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            let count;
            if (userCart) {
                console.log("userCart =======================",userCart);
                count = userCart.products.length
                let prodExist = userCart.products.findIndex(product => product.item == prodId)
                if (prodExist != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId), 'products.item': objectId(prodId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }).then(() => {
                                resolve()
                            })
                } else {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId) },
                            {

                                $push: { products: prodObj }

                            }).then((response) => {
                                resolve(count)
                            })
                }

            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [prodObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    count = 0;
                    resolve(count)
                })
            }
        })
    },

    //CART PRODUCTS
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
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
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            resolve(cartItems)
        })
    },

    //CART PRODUCTS
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            resolve(cart.products)
        })
    },
    
    //CART COUNT
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },

    //TOTAL AMOUNT OF CART PRODUCTS
    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
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
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$product.Price' }] } }
                    }
                }
            ]).toArray()
            resolve(total[0]?.total)
        })
    },

     //CART PRODUCT QUANTITY
     changeProductQuantity: (details) => {
        console.log(details, 'Itscominggg');
        let count = parseInt(details.count)
        let quantity = parseInt(details.quantity)
        return new Promise((resolve, reject) => {
            if (count == -1 && quantity == 1) {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart) },
                        {
                            $pull: { products: { item: objectId(details.product) } }
                        }
                    ).then((response) => {
                        resolve({ removeProduct: true })
                    })
            } else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': count }
                        }).then((response) => {
                            console.log(response, '*******************');
                            resolve({ status: true })
                        })
            }

        })
    },

     //DELTE PRODUCT FROM CART
     deleteProductFromCart: (prodId, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).updateOne({
                user: objectId(userId)
            },
                {
                    $pull: { products: { item: objectId(prodId) } }
                }
            ).then((response) => {
                resolve(response)
            })
        })
    },

    //PLACE ORDER
    placeOrder: ( products, total, body, userId) => {
        console.log(body.COD, 'paymmmmmeeeeennnnnt');
        return new Promise((resolve, reject) => {
            let status = 'placed' 
            products.forEach(element => {
                element.status = status
            });
            
            let orderObj = {
                deliveryDetails: {
                    fullname: body.firstname + " " + body.lastname,
                    email: body.email,
                    address: body.address,
                    mobile: body.mobile,
                    country: body.country,
                    state: body.state,
                    district: body.district,
                    city: body.city,
                    pincode: body.pincode
                },
                userId: objectId(userId),
                paymentMethod: body.COD,
                products: products,
                totalAmount: total,
                status : 'placed',
                displayDate: new Date().toDateString(),
                date: new Date(),
                return: false
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                if (status === 'placed') {
                    db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(userId) })
                    
                    resolve(response.insertedId)
                } 
            })
        })
    },

    //USER ORDERS
        getUserOrders: (userId) => {
        return new Promise((resolve, reject) => {
            let orders = db.get().collection(collection.ORDER_COLLECTION)
                .aggregate([
                    {
                        $match: {
                            userId: objectId(userId),
                        }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity',
                            // price: '$products.Price',
                            deliveryDetails: '$deliveryDetails',
                            paymentMethod: '$paymentMethod',
                            totalAmount: '$totalAmount',
                            status: '$products.status',
                            displayDate: '$displayDate',
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
            resolve(orders)
        })
    },

    //CANCEL ORDER
    cancelOrder: (orderId, prodId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId), 'products.item': objectId(prodId) }, { $set: { 'products.$.status': 'canceled' } }).then(() => {
                resolve('Success')
            })
        })
    },

     //EDIT PROFILE
     editProfile: (userId, updatedData) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.USER_COLLECTION)
                .updateOne(
                    {
                        _id: objectId(userId)
                    },
                    {
                        "$set": {
                            username: updatedData.username,
                            Email: updatedData.Email,
                            MobileNumber: updatedData.MobileNumber
                        }
                    }
                )
            resolve()
        })
    },

}