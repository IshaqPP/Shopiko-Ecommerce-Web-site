const { response } = require('express');
var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
const adminHelpers = require('../helpers/admin-helpers');
const swal = require('sweetalert');
const middleware = require('../middlewares/authentication-check')
require('dotenv').config()
const client = require('twilio')(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN)
const paypal = require('paypal-rest-sdk');
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': process.env.CLIENT_ID,
  'client_secret': process.env.CLIENT_SECRET
});

// redirecting to the current page
redirect = function (req, res, next) {
  if (!req.session.loggedIn) {
    req.session.redirectTo = req.originalUrl;
    console.log("path in redirect function");
    console.log(req.session.redirectTo);
    // res.redirect('/login');
    next();
  } else {
    next();
  }
};

/* GET home page. */
router.get('/',redirect, async(req, res, next)=> {
  let user=req.session.user;
  console.log(user);
  let cartCount = 0
  let wishCount = 0
  let category = await adminHelpers.getCategory()
  
  if(user != null){
    cartCount = await userHelpers.getCartCount(user._id);
    wishCount = await userHelpers.getWishCount(req.session.user._id)
  }
  console.log("cart count ===========",cartCount);
  productHelpers.getRandomProduct().then((RandomProduct) => {
    console.log("RandomProduct ================== ",RandomProduct);
    res.render('index',{RandomProduct,user,wishCount,cartCount,category})
  })
});

router.get('/logout',function(req,res) {
  req.session.destroy()
  res.redirect('/')
});

router.get('/login',middleware.loginchecked,function(req,res) {
 // console.log(req.session.loggedIn+" --------------req.session.loggedIn");
   res.render('login',{not: true});
});

router.post('/login',function(req,res) {
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.loggedIn=true;
      req.session.user=response.user;
      console.log("path ===========",req.session.redirectTo);
      res.json({status:true,url:req.session.redirectTo})
    }else{
      // ERRmsg="password";
      // console.log('Password Incorrecttttt');
      // res.redirect('/login')
      res.json({msg:"Password is incorrect"})
    }
      
  }).catch((response)=>{
    // console.log('login faileddddd');
    // ERRmsg="username and password"
    // res.redirect('/login')
    res.json({msg:"User is invalid"})
  })
});

//OTP LOGIN

router.get('/otp-login',middleware.loginchecked,function(req,res) {
  res.render('login-mob',{not: true});
});

router.post('/otp-login',function(req,res) {

  userHelpers.otpLogin(req.body).then((response) => {
    
    let phone = response.user.MobileNumber
    
    client
      .verify
      .services(process.env.SERVICE_ID)
      .verifications
      .create({
        to: `+91${phone}`,
        channel: 'sms'
      }).then((data) => {
        req.session.user = response.user;
        console.log(" mob 1 ===="+phone);

        // mobnum=phone
        // console.log(" mob 1 ===="+response.mobnum);
        res.json({status:true,phone})
        // res.render('user/otp-verification', { phone, not: true })
      }).catch((err) => {
        res.json({msg:"Please check your mobile number"})
        console.log(err);
      })
  }).catch((response) => {
    // req.session.loginErr = "Please check your mobile number";
    // res.redirect('/login')
    res.json({msg:"Please check your mobile number"})
  })

});

//OTP VERIFICATION

router.get('/otp-mob-subt/:phone',middleware.loginchecked,function(req,res) {
  console.log(req.params.phone+"ph no================");
  let phone=req.params.phone;
  res.render('login-otp-sbmt',{phone,not: true});
});

router.post('/otp-mob-subt', (req, res) => {
  client
    .verify
    .services(process.env.SERVICE_ID)
    .verificationChecks
    .create({
      to: `+91${req.body.mobile}`,
      code: req.body.otp
    }).then((data) => {
      console.log(data);
      if (data.valid) {
        req.session.loggedIn = true;
        res.json({status:true})
        // res.redirect('/')
      } else {
        // delete req.session.user
        // req.session.otpErr = "Enter valid OTP"
        // res.redirect('/login')

        res.json({msg:"Enter valid OTP"})
      }
    }).catch((err) => {
      delete req.session.user
      res.redirect('/login')
    })
})


router.get('/signup',function(req,res) {
  res.render('signup',{not: true});
});

router.post('/signup',function(req,res) {
  userHelpers.doSignup(req.body).then((response)=>{
    res.json({status:true})
    console.log(response);  
  }).catch((response)=>{
    res.json({status:false})
  })

});

//PRODUCTS LIST
router.get('/product',redirect, async function (req, res, next) {
  let cartCount
  let wishCount
  let user = req.session.user
  // cartCount = null
  if (user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
    wishCount = await userHelpers.getWishCount(req.session.user._id)
  }
  let category = await adminHelpers.getCategory()
  productHelpers.getAllProduct().then((products) => {
    console.log("category ----------",category);
    console.log(products,"---------------products");
    res.render('product',{category, user, cartCount,wishCount,products})
  })
})

//PRODUCTS LIST BY CATEGORY
router.get('/product/:category', async function (req, res, next) {
  let cartCount
  let wishCount
  let user = req.session.user
  let Category= req.params.category
  console.log("Category ----------------",Category);
  if (user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
    wishCount = await userHelpers.getWishCount(req.session.user._id)
  }
  let category = await adminHelpers.getCategory()
  productHelpers.getCategoryProduct(Category).then((products) => {
    console.log("category ----------",category);
    console.log(products,"---------------products");
  console.log("Category ----------------",Category);
    res.render('product',{category, user, cartCount,wishCount,products,Category})
  })
})

//PRODUCTS DETAILS
router.get('/product-details', redirect, async (req, res) => {
  let user = req.session.user

  let id=req.query.prod_id
  let category = req.query.category
  let related = await productHelpers.relatedProducts(id,category)
  let newCategory = category.charAt(0) + category.slice(1).toLowerCase();
  // console.log(id,category);
  let cartCount = null
  let wishCount = null
  
  //console.log("relatedProducts ----------------- ",related);
  if (user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
    wishCount = await userHelpers.getWishCount(req.session.user._id)
  }
  await productHelpers.getProductDetails(id).then((product) => {
    console.log("category ***************** ",newCategory);
    console.log("relatedProducts ----------------- ",related);
    console.log("product ++++++++++++++++++++ ",product);

    res.render('product-detail', { product, related,newCategory,user, cartCount,wishCount })
  })
})


//CART
router.get('/cart', redirect ,middleware.userChecked ,async (req, res) => {
  let userId = req.session.user._id
  let totalValue = await userHelpers.getTotalAmount(userId)
  let cartCount = await userHelpers.getCartCount(userId)
  let wishCount = await userHelpers.getWishCount(userId)
  let products = await userHelpers.getCartProducts(userId)
  let user = req.session.user

  console.log("total value ========",totalValue);
  console.log("cart count =================",cartCount);
  console.log("products ===========",products);
  res.render('shoping-cart', { products, user, userId, totalValue,wishCount, cartCount })
});

//ADD TO CART
router.get('/add-to-cart/:id',middleware.userChecked , (req, res) => {
  console.log("you are in add to carttt section");
  userHelpers.addToCart(req.params.id, req.session.user._id).then((count) => {
    res.json({ status: true })
  })
})

//CART PRODUCT QUANTITY
router.post('/change-product-quantity',middleware.userChecked , (req, res) => {
  console.log(req.body, 'EEeeeeeeeeeeeeeeEe');
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user)
    res.json(response)
  })
})

//DELETE CART PRODUCT
router.get('/delete-cart-product/:id',middleware.userChecked , (req, res) => {
  console.log(req.params.id);
  userHelpers.deleteProductFromCart(req.params.id, req.session.user._id).then((response) => {
    res.json(response)
  })
})

//CHECKOUT FORM
router.get('/place-order', middleware.userChecked , async (req, res) => {
  let offer;
  if(req.query.DiscountValue=='')
    offer=0;
  else
    offer=req.query.DiscountValue
  
  console.log("offer ====================",offer);
  let user = req.session.user
  let total = await userHelpers.getTotalAmount(user._id)
  let cartProducts = await userHelpers.getCartProducts(user._id)
  let wishCount = await userHelpers.getWishCount(user._id)
  let address = await userHelpers.addressDetails(user._id)
  let cartCount = await userHelpers.getCartCount(user._id)
  let wallet = await userHelpers.getWallet(user._id)

  console.log("user ===========",user);
  console.log("total  ========",total);
  console.log("cart count =================",cartCount);
  console.log("products ===========",cartProducts);
  console.log("address ===========",address);

  res.render('place-order', { total, user, cartProducts, address, cartCount,offer,wallet,wishCount})
})

router.post('/place-order', async (req, res) => {
  let products = await userHelpers.getCartProductList(req.session.user._id)
  console.log("products ----------------",products);
  let totalPrice = Number(req.body.total)
  console.log(totalPrice, '@@@@@@@@@@@@@@@');
  let walletBalance = Number(req.body.wallet)
  if (walletBalance) {
    if (totalPrice >= walletBalance) {
      totalPrice = totalPrice - walletBalance
      console.log(totalPrice, "QQQQQQQQQWWWWWWW");
      userHelpers.decreaseWallet(req.session.user._id, walletBalance)
    } else {
      userHelpers.decreaseWallet(req.session.user._id, totalPrice)
      totalPrice = walletBalance - totalPrice
    }
  } 
  let userAddress = await userHelpers.getOrderAddress(req.session.user._id, req.body.addressId)
  console.log("userAddress ----------------",userAddress);

  console.log("req.body ----------------",req.body);
  userHelpers.placeOrder(userAddress, products, totalPrice, req.body, req.session.user._id).then((orderId) => {
    if (req.body['paymentMethod'] === 'COD') {
      res.json({ codSuccess: true })
    } else if (req.body['paymentMethod'] === 'ONLINE') {
      userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
        res.json({ razorpay: true, response })
      })
    } else {
      let amount = Math.floor(totalPrice / 81.78);
      req.session.orderId = orderId
      var create_payment_json = {
        "intent": "sale",
        "payer": {
          "payment_method": "paypal"
        },
        "redirect_urls": {
          "return_url": "https://shopiko.online/success",
          "cancel_url": "https://shopiko.online/place-order"
        },
        "transactions": [{
          "item_list": {
            "items": [{
              "name": 'item',
              "sku": "item",
              "price": amount,
              "currency": "USD",
              "quantity": 1
            }]
          },
          "amount": {
            "currency": "USD",
            "total": amount
          },
          "description": "This is the payment description."
        }]
      };

      paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
          throw error;
        } else {
          console.log("Create Payment Response");
          console.log(payment);
          for (let i = 0; i < payment.links.length; i++) {
            if (payment.links[i].rel === 'approval_url') {
              console.log(payment.links[i].href);
              res.json({ url: payment.links[i].href, paypal: true });
            }
          }
        }
      });
    }
  })
})

router.get('/success', async (req, res) => {

  let products = await userHelpers.getCartProductList(req.session.user._id)
  userHelpers.changePaymentStatus(req.session.orderId, req.session.user._id, products).then(() => {
    req.session.orderId = null
    res.redirect('/orders')
  })
})

//ORDERS
router.get('/orders',redirect, middleware.userChecked, async (req, res) => {

  let orders = await userHelpers.getUserOrders(req.session.user._id)
  let cartCount = await userHelpers.getCartCount(req.session.user._id)
  let wishCount = await userHelpers.getWishCount(req.session.user._id)
  console.log("user ===========",req.session.user);
  console.log("orders  ========",orders);
  console.log("cart count =================",cartCount);

  res.render('orders', { orders, user: req.session.user, cartCount ,wishCount})

})

//CANCEL ORDER
router.put('/cancel-order', (req, res) => {
  userHelpers.cancelOrder(req.body.orderId, req.body.prodId).then((response) => {
    res.json({ status: true })
  })
})

//USER PROFILE
router.get('/profile',redirect, middleware.userChecked, async (req, res) => {
  let user = req.session.user
  let cartCount = await userHelpers.getCartCount(user._id)
  let wishCount = await userHelpers.getWishCount(req.session.user._id)
 console.log("user =============ok",user);
  res.render('profile', { user, cartCount,wishCount })
})

//EDIT PROFILE
router.post('/profile',middleware.userChecked, (req, res) => {
  userHelpers.editProfile(req.session.user._id, req.body).then(() => {
    console.log("req.body-----------",req.body);
     req.session.user = req.body
    res.redirect('/profile')
  })
})

//ADDRESS MODULE
router.get('/address',redirect, middleware.userChecked, async (req, res) => {
  let user = req.session.user
  let cartCount = await userHelpers.getCartCount(user._id)
  let wishCount = await userHelpers.getWishCount(req.session.user._id)
  let address = await userHelpers.addressDetails(user._id)

  res.render('address', { user, address, cartCount,wishCount})
})

//ADD ADDRESS IN PROFILE
router.post('/add-address', (req, res) => {
  let userId = req.session.user._id
  userHelpers.addAddress(req.body, userId).then(() => {
    res.redirect('/address')
  })
})

//DELETE ADDRESS
router.get('/delete-address/:id',redirect, middleware.userChecked, (req, res) => {
  userHelpers.deleteAddress(req.session.user._id, req.params.id).then(() => {
    res.json({ status: true })
  })
})

//CHANGE PASSWORD
router.get('/password',redirect, middleware.userChecked, async (req, res) => {
  let user = req.session.user
  let cartCount = await userHelpers.getCartCount(user._id)
  let wishCount = await userHelpers.getWishCount(req.session.user._id)
  res.render('password', { user, cartCount ,wishCount})
})

router.post('/password', (req, res) => {
  userHelpers.changePassword(req.body, req.session.user._id).then(() => {
    req.session.loggedIn = false
    req.session.user = null
    res.json({ status: true })
    
  }).catch((response)=>{
    console.log("wrong section -------------");
    res.json({msg:"Old password is incorrect"})
  })
})

//WALLET
router.get('/wallet',redirect, middleware.userChecked, async (req, res) => {
  let user = req.session.user
  let cartCount = await userHelpers.getCartCount(user._id)
  let wishCount = await userHelpers.getWishCount(req.session.user._id)
  let wallet = await userHelpers.getWallet(user._id)
  res.render('wallet', { user, wallet, cartCount,wishCount })
})

//REDEEM COUPON 
router.post('/redeem-coupon', async (req, res) => {
  console.log("COUPEN --------------------- ",req.body);
  let userId = req.session.user._id
  let totalAmount = await userHelpers.getTotalAmount(userId)
  console.log(totalAmount, '*******');

  await userHelpers.redeemCoupon(req.body,userId).then((couponData) => {
    console.log("couponData ====================",couponData);
    let Msg = "This coupen is only valid for purchase above ₹" + couponData.minPrice

    if (totalAmount >= couponData.minPrice) {
      console.log('yeyeyeeeeeeee');
      let temp = (totalAmount * couponData.couponOffer) / 100
      temp = Math.ceil(temp)
      console.log(temp, '__________________');

      if (temp < couponData.priceLimit) {
        console.log('temp<<<<<<<<<<<');
        totalAmount = (totalAmount - temp)
        console.log(totalAmount);
      } else if (temp >= couponData.priceLimit) {
        console.log('temp>>>>>>>>>>>>>');
        temp = couponData.priceLimit
        totalAmount = (totalAmount - temp)
      }

      res.json({ total: totalAmount, offer: temp })

    } else if (totalAmount <= couponData.minPrice) {

      res.json({ Msg})

    }
  }).catch((Msg) => {
    //let msg = "Invalid Coupon Or It's already Expired"
    res.json({ Msg})
  })
})

//VERIFY PAYMENT
router.post('/verify-payment', async (req, res) => {
  console.log(req.body);
  let products = await userHelpers.getCartProductList(req.session.user._id)
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]'], req.session.user._id, products).then(() => {
      console.log('Payment Successfull');
      res.json({ status: true })
    })
  }).catch((err) => {
    console.log(err);
    res.json({ status: false, errMsg: '' })
  })
})

//RETURN PRODUCT
router.post('/return-product', async (req, res) => {
  console.log(req.body, ' return-product ************************8');
  let product = await productHelpers.getProductDetails(req.body.prodId)
  userHelpers.returnOrder(req.session.user._id, req.body, product).then(async (response) => {
    res.json({ status: true })
  }).catch(() => {
    res.json({ status: false })
  })
})

//WISHLIST
router.get('/wishlist',redirect, middleware.userChecked, async (req, res) => {
  let userId = req.session.user._id
  let products = await userHelpers.getWishProducts(userId)
  let cartCount = await userHelpers.getCartCount(userId)
  let wishCount = await userHelpers.getWishCount(userId)
  let user = req.session.user

  console.log("products ========== ",products);
  res.render('wishlist', { products, user, userId, cartCount, wishCount })
})

//ADD TO WISHLIST
router.get('/add-to-wishlist/:id',redirect, middleware.userChecked,(req, res) => {
  console.log(" ur in wish list function ==================");
  userHelpers.addToWishlist(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true })
  }).catch((response) => {
    res.json({ status: false })
  })
})

//DELETE WISHLIST PRODUCT
router.get('/delete-wish-product/:id',redirect, middleware.userChecked, (req, res) => {
  userHelpers.deleteProductFromWish(req.params.id, req.session.user._id).then(() => {
    res.redirect('/wishlist')
  })
})

module.exports = router;