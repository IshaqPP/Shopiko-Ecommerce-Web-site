require('dotenv').config()
var db = require('../config/connection');
var collection = require('../config/collection');
var bcrypt = require('bcrypt')
var objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay' );

var instance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET,
})


module.exports = {

    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            let emailChecking = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })

            console.log(userData.Email + "user email is");
            console.log(emailChecking + "ur email is");

            if (emailChecking == null) {
                userData.password = await bcrypt.hash(userData.password, 10)
                userData.Rpassword = await bcrypt.hash(userData.Rpassword, 10)
                userData.referralId = userData.username + new objectId().toString().slice(1, 7)
                userData.status = true;
                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) =>{
                    db.get().collection(collection.WALLET_COLLECTION).insertOne({
                        userId: userData._id,
                        walletBalance: 0,
                        referralId: userData.referralId,
                        transaction: []
                    })
                    resolve(userData)
                } )

            }
            else {
                reject("This email is Already Existing")
            }
            if (userData.referralCode) {
                console.log("userData.referralCode================",userData.referralCode);
                console.log("objectId(userData._id) ==================",objectId(userData._id));
                db.get().collection(collection.USER_COLLECTION).findOne({ referralId: userData.referralCode }).then(async (response) => {
                    if (response != null) {
                        await db.get().collection(collection.WALLET_COLLECTION).updateOne({ userId: objectId(userData._id) }, { $set: { walletBalance: 100 } })
                        await db.get().collection(collection.WALLET_COLLECTION).updateOne({ referralId: userData.referralCode }, { $inc: { walletBalance: 100 } })
                    }
                })
            }
        })
    },


    //USER LOGIN
    doLogin: (userData) => {
        let response = {};
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.email, status: true })
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
                MobileNumber: userData.mobile
            })
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
                console.log("userCart =======================", userCart);
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
                        total: { $sum: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$product.offerPrice' }] } }
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
    placeOrder: (orderAddress, products, total, body, userId) => {
        console.log(body.paymentMethod, 'paymmmmmeeeeennnnnt');
        return new Promise((resolve, reject) => {
            let status = body.paymentMethod === 'COD' ? 'placed' : 'pending'
            products.forEach(element => {
                element.status = status
            });
            let orderObj = {
                deliveryDetails: {
                    fullname: orderAddress[0]?.address.firstname + " " + orderAddress[0]?.address.lastname,
                    email: orderAddress[0]?.address.email,
                    address: orderAddress[0]?.address.address,
                    mobile: orderAddress[0]?.address.mobile,
                    country: orderAddress[0]?.address.country,
                    state: orderAddress[0]?.address.state,
                    district: orderAddress[0]?.address.district,
                    city: orderAddress[0]?.address.city,
                    pincode: orderAddress[0]?.address.pincode
                },
                userId: objectId(userId),
                paymentMethod: body.paymentMethod,
                products: products,
                totalAmount: total,
                displayDate: new Date().toDateString(),
                date: new Date(),
                return: false
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                if (status === 'placed') {
                    db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(userId) })
                    products.forEach(element => {
                        console.log('innnnnnnnnnnnnnnnnnnnnnn');
                        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(element.item) }, { $inc: { stock: -(element.quantity) } })
                    })
                    resolve(response.insertedId)
                } else {
                    console.log('ooouttttttttttttttttttttt');
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

    //ADD ADDRESS
    addAddress: (data, userId) => {
        return new Promise((resolve, reject) => {
            data._id = new objectId()
            db.get().collection(collection.USER_COLLECTION).updateOne({
                _id: objectId(userId)
            }, {
                $push: {
                    address: data
                }
            }).then()
            resolve()
        })
    },

    //ADDRESS DETAILS
    addressDetails: (userId) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.USER_COLLECTION).aggregate([
                {
                    $match: {
                        _id: objectId(userId)
                    }
                },
                {
                    $unwind: { path: '$address' }
                }, {
                    $project: {
                        address: 1,
                    }
                }
            ]).toArray()
            resolve(address)
        })
    },

    //DELETE ADDRESS
    deleteAddress: (userId, addressId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({
                _id: objectId(userId)
            },
                {
                    $pull: { address: { _id: objectId(addressId) } }
                }
            ).then((response) => {
                resolve()
            })
        })
    },

    //ORDER ADDRESS
    getOrderAddress: (userId, addressId) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.USER_COLLECTION).aggregate([
                {
                    $match: {
                        _id: objectId(userId)
                    }
                },
                {
                    $unwind: {
                        'path': '$address'
                    }

                },
                {
                    $match: {
                        'address._id': objectId(addressId)
                    }
                },
                {
                    $project: {
                        'address': 1,
                    }
                }
            ]).toArray()
            resolve(address)
        })
    },

    //CHANGE PASSWORD
    changePassword: (password, userId) => {
        console.log(password, "----------------  body");
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).find({ _id: objectId(userId) }).toArray()
            console.log(user, user[0].password, password.password);
            if (user) {
                bcrypt.compare(password.password, user[0].password).then(async (status) => {
                    if (status) {
                        password.newPassword = await bcrypt.hash(password.newPassword, 10)
                        db.get().collection(collection.USER_COLLECTION).updateOne({
                            _id: objectId(userId)
                        },
                            {
                                $set: { password: password.newPassword }
                            }).then((response) => {
                                resolve(response)
                            })
                    } else {
                        console.log("Password is wrong");
                        reject("Password is wrong")
                    }
                }).catch((response) => {
                    console.log("Password is wrong");
                    reject("Password is wrong")
                })
            }
        })
    },

     //RAZORPAY
     generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100,
                currency: "INR",
                receipt: "" + orderId
            };
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('New order :', order);
                    resolve(order)
                }

            })
        })
    },

     //VERIFY PAYMENT
     verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', process.env.KEY_SECRET);
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                console.log("success--------------------------------");
                resolve()
            } else {
                console.log("reject--------------------------------");
                reject()
            }
        })
    },

    //CHANGE PAYMENT STATUS
    changePaymentStatus: (orderId, userId, products) => {
        return new Promise((resolve, reject) => {
            products.forEach(async (item) => {
                let response = await db.get().collection(collection.ORDER_COLLECTION)
                    .updateOne({
                        _id: objectId(orderId), 'products.item': objectId(item.item)
                    }, {
                        $set: {
                            'products.$.status': 'placed'
                        }
                    })
                await db.get().collection(collection.PRODUCT_COLLECTION)
                    .updateOne({
                        _id: objectId(item.item)
                    }, {
                        $inc: {
                            stock: -(item.quantity)
                        }
                    })
                console.log(response, 'responseeeeeeeeeeeeeee');
            })
            db.get().collection(collection.CART_COLLECTION)
                .deleteOne({
                    user: objectId(userId)
                })
            resolve()
        })
    },


    //REDEEM COUPON
    redeemCoupon: (couponDetails, userId) => {
        let couponName = couponDetails.coupon.toUpperCase()
        console.log(couponName);
        return new Promise(async (resolve, reject) => {
            currentDate = new Date()
            console.log(currentDate, "-------------------currentDate");
            let couponCheck = await db.get().collection(collection.COUPON_COLLECTION).findOne({ coupon: couponName })
            console.log(couponCheck);
            if (couponCheck !== null) {
                console.log(couponCheck, '$$$$$$$$$$$$$$$couponCheck');
                let DateCheck = await db.get().collection(collection.COUPON_COLLECTION).findOne({ $and: [{ coupon: couponName }, { expDate: { $gte: currentDate } }]})
                console.log(DateCheck);
                if (DateCheck !== null) {
                    console.log(DateCheck, '$$$$$$$$$$$$$$$ DateCheck');
                    let userExistCheck = await db.get().collection(collection.COUPON_COLLECTION).findOne({ $and: [{ coupon: couponName }, { user: objectId(userId) }] })
                    console.log(userExistCheck);
                    if (userExistCheck !== null) {
                        
                        console.log(userExistCheck, '$$$$$$$$$$$$$$$ userExistCheck');
                        reject({ msg: "It's already Used" })
                        
                    } else {

                        await db.get().collection(collection.COUPON_COLLECTION).updateOne({ coupon:couponName},
                            {
                                $push: { user:objectId(userId) }
                            }
                        )
                        resolve(DateCheck)
                    }
                } else {
                    
                    reject({ msg: "It's already Expired" })
                }
            } else {
                reject({ msg: "Invalid Coupon" })
            }




        })
    },

    //RETURN PRODUCT
    returnOrder: (userId, data, product) => {
        console.log(product, '^^^^^');
        return new Promise(async(resolve, reject) => {
            await db.get().collection(collection.ORDER_COLLECTION).updateOne({
                _id: objectId(data.orderId),
                'products.item': objectId(data.prodId)
            },
                {
                    $set: { 'products.$.status': 'returned' }
                }
            )

            let addWallet = await db.get().collection(collection.WALLET_COLLECTION).updateOne({
                userId: objectId(userId)
            }, {
                $inc: { walletBalance: (product.offerPrice) }
            })

            resolve(addWallet)

            
        })
    },

    //GET WALLET
    getWallet: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.WALLET_COLLECTION).findOne({ userId: objectId(userId) }).then((response) => {
                resolve(response)
                console.log(response, 'respooooooooooooooonse');
            })
        })
    },

    //DECREASE WALLET
    decreaseWallet: (userId, amount) => {
        db.get().collection(collection.WALLET_COLLECTION).findOne({ userId: objectId(userId) }).then((response) => {
            console.log(response, '000000000000000000000000');
            let updatedBalance = response.walletBalance - amount
            db.get().collection(collection.WALLET_COLLECTION).updateOne({ userId: objectId(userId) }, { $set: { walletBalance: updatedBalance } })
        })
    },

    //ADD TO WISHLIST
    addToWishlist: (prodId, userId) => {

        return new Promise(async (resolve, reject) => {
            let userWish = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })
            let count;
            let prodObj = {
                item: objectId(prodId),
            }

            if (userWish) {
                count = userWish.products.length
                let prodExist = userWish.products.findIndex(product => product.item == prodId)
                console.log(prodExist);
                if (prodExist == -1) {
                    db.get().collection(collection.WISHLIST_COLLECTION).updateOne({
                        user: objectId(userId)
                    },
                        {
                            $push: { products: { item: objectId(prodId) } }
                        }
                    ).then((response) => {
                        resolve(count)
                    })
                } else {
                    db.get().collection(collection.WISHLIST_COLLECTION)
                        .updateOne({ user: objectId(userId) },
                            {
                                $pull: { products: { item: objectId(prodId) } }
                            }).then((response) => {
                                reject()
                            })
                }
            } else {
                let wishObj = {
                    user: objectId(userId),
                    products: [prodObj]
                }
                db.get().collection(collection.WISHLIST_COLLECTION).insertOne(wishObj).then((response) => {
                    count = 0
                    resolve(count)
                })
            }
        })
    },

     //WISHLIST PRODUCTS
     getWishProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let wishlist = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
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
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            resolve(wishlist)
        })
    },

    //WISHLIST COUNT
    getWishCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count
            let wish = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })
            if (wish) {
                count = wish.products.length
            }
            resolve(count)
        })
    },

    
    //DELTE PRODUCT FROM WISH LIST
    deleteProductFromWish: (prodId, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.WISHLIST_COLLECTION).updateOne({
                user: objectId(userId)
            },
                {
                    $pull: { products: { item: objectId(prodId) } }
                }
            ).then(() => {
                resolve()
            })
        })
    },


}