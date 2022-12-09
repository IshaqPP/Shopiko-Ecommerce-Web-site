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


/* GET home page. */
router.get('/', async(req, res, next)=> {
  let user=req.session.user;
  console.log(user);
  let cartCount = 0
  if(user != null){
    cartCount = await userHelpers.getCartCount(user._id);
  }
  console.log("cart count ===========",cartCount);
  productHelpers.getAllProduct().then((products) => {
    res.render('index',{products,user,cartCount})
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
      res.json({status:true})
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

//CART
router.get('/cart',middleware.userChecked ,async (req, res) => {
  let userId = req.session.user._id
  let totalValue = await userHelpers.getTotalAmount(userId)
  let cartCount = await userHelpers.getCartCount(userId)
  //let wishCount = await userHelpers.getWishCount(userId)
  let products = await userHelpers.getCartProducts(userId)
  let user = req.session.user

  console.log("total value ========",totalValue);
  console.log("cart count =================",cartCount);
  console.log("products ===========",products);
  res.render('shoping-cart', { products, user, userId, totalValue, cartCount })
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
  let user = req.session.user
  let total = await userHelpers.getTotalAmount(user._id)
  let cartProducts = await userHelpers.getCartProducts(user._id)
  //let wishCount = await userHelpers.getWishCount(user._id)
  //let address = await userHelpers.addressDetails(user._id)
  let cartCount = await userHelpers.getCartCount(user._id)
 // let wallet = await userHelpers.getWallet(user._id)

  console.log("user ===========",user);
  console.log("total  ========",total);
  console.log("cart count =================",cartCount);
  console.log("products ===========",cartProducts);

  res.render('place-order', { total, user, cartProducts,  cartCount })
})

router.post('/place-order', async (req, res) => {
  console.log("---------------------------------------");
  let products = await userHelpers.getCartProductList(req.session.user._id)
  let totalPrice = await userHelpers.getTotalAmount(req.session.user._id)
  console.log(totalPrice, '@@@@@@@@@@@@@@@');
  

  userHelpers.placeOrder( products, totalPrice, req.body, req.session.user._id).then((orderId) => {
      res.json({ codSuccess: true }) 
  })
})

//ORDERS
router.get('/orders', middleware.userChecked, async (req, res) => {

  let orders = await userHelpers.getUserOrders(req.session.user._id)
  let cartCount = await userHelpers.getCartCount(req.session.user._id)

  console.log("user ===========",req.session.user);
  console.log("orders  ========",orders);
  console.log("cart count =================",cartCount);

  res.render('orders', { orders, user: req.session.user, cartCount })

})

//CANCEL ORDER
router.put('/cancel-order', (req, res) => {
  userHelpers.cancelOrder(req.body.orderId, req.body.prodId).then((response) => {
    res.json({ status: true })
  })
})

//USER PROFILE
router.get('/profile', middleware.userChecked, async (req, res) => {
  let user = req.session.user
  let cartCount = await userHelpers.getCartCount(user._id)
 // let wishCount = await userHelpers.getWishCount(req.session.user._id)
 console.log("user =============ok",user);
  res.render('profile', { user, cartCount })
})

//EDIT PROFILE
router.post('/profile',middleware.userChecked, (req, res) => {
  userHelpers.editProfile(req.session.user._id, req.body).then(() => {
    console.log("req.body-----------",req.body);
     req.session.user = req.body
    res.redirect('/profile')
  })
})


module.exports = router;