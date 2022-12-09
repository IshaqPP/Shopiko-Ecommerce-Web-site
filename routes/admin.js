var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const cloudinary = require('../utils/cloudinary')
const multer = require('multer')
const path = require('path');
const AdminMidleware= require('../middlewares/authentication-check')
const adminHelpers = require('../helpers/admin-helpers');

// console.log(cloudinary.cloud_name,'6666666666');
// console.log(cloudinary.api_key,'6666666666');
// console.log(cloudinary.api_secret,'6666666666');

// console.log("--------------",process.env.CLOUD_NAME);

upload = multer({
  storage: multer.diskStorage({}),
  fileFilter: (req, file, cb) => {
    console.log('Its workinggggggggggggggggggggg-------------');
    let ext = path.extname(file.originalname)
    if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png" && ext !== ".webp") {
      cb(new Error("File type is not supported"), false)
      return
    }
    console.log('Its workinggggggggggggggggggggg');
    cb(null, true)
  }
})


// ADMIN SECETION 

router.get('/',AdminMidleware.AdminLoginCheck, function (req, res, next) {
  res.render('Admin/admin-login',{not: true});
});

router.post('/adminLogin',function(req,res) {

  adminHelpers.adminLogin(req.body).then((response)=>{
    if(response.status){
      req.session.AdminloggedIn=true;
      req.session.admin=response.admin;
      res.json({status:true})
    }else{
      res.json({msg:"Password is incorrect"})
    }
  }).catch((response)=>{
    
    res.json({msg:"Email is invalid"})
  })
});

router.get('/adminLogin',AdminMidleware.AdminLoginCheck, function (req, res, next) {
  res.render('Admin/admin-login',{not: true});
});

//USERS LISTING

router.get('/users',AdminMidleware.AdminFunActionCheck ,function (req, res) {
  adminHelpers.listAllUsers().then((users) => {
    res.render('Admin/users', {users,admin: true})
  })
});

//USER STATUS
router.get('/users/:id',AdminMidleware.AdminFunActionCheck , (req, res) => {
  console.log("id ---- -    ",req.params.id);
  adminHelpers.userStatus(req.params.id).then((response) => {
    res.json({ status: true })
    
  })
})

//PRODUCTS LISTING
router.get('/allProducts',AdminMidleware.AdminFunActionCheck , function (req, res) {
  productHelpers.getAllProduct().then((products) => {
    res.render('Admin/All-product',{products,admin: true})
  })
});

//ADD PRODUCT

router.get('/addProduct',AdminMidleware.AdminFunActionCheck , async (req, res)=> {
  let category = await adminHelpers.getCategory()
  console.log(category,"category-------------------");
  res.render('Admin/Add-product',{category,admin: true})
});



router.post('/addProduct', upload.fields([
  { name: 'Image1', maxCount: 1 },
  { name: 'Image2', maxCount: 1 },
  { name: 'Image3', maxCount: 1 },
  { name: 'Image4', maxCount: 1 }
]), async (req, res) => {
  console.log(req.files," filesssssssssssssssssssssssssss");
  const cloudinaryImageUploadMethod = (file) => {
    console.log(" UR in Cloud upload section");
    return new Promise((resolve) => {
      cloudinary.uploader.upload(file, (err, res) => {
        console.log(err, " asdfgh");
        if (err) return res.status(500).send("Upload Image Error")
        resolve(res.secure_url)
      })
    })
  }

  const files = req.files
  let arr1 = Object.values(files)
  let arr2 = arr1.flat()
  const urls = await Promise.all(
    arr2.map(async (file) => {
      const { path } = file
      const result = await cloudinaryImageUploadMethod(path)
      return result
    })
  )
  console.log(urls);

  productHelpers.addProduct(req.body, urls).then((response)=>{
    res.redirect('/admin/allProducts')
  })
})


//EDIT PRODUCT
router.get('/edit-product/:prodId',AdminMidleware.AdminFunActionCheck , async (req, res) => {
  // let admin = req.session.admin;
  let product = await productHelpers.getProductDetails(req.params.prodId)
  let category = await adminHelpers.getCategory()

  console.log("product ==========",product);
  console.log("category ==============",category);
  res.render('Admin/Edit-product',{product,category,admin: true})
})

router.post('/edit-product/:id', upload.fields([
  { name: 'Image1', maxCount: 1 },
  { name: 'Image2', maxCount: 1 },
  { name: 'Image3', maxCount: 1 },
  { name: 'Image4', maxCount: 1 },
]), async (req, res) => {
  console.log(req.files);
  const cloudinaryImageUploadMethod = (file) => {
    console.log(" UR in Cloud upload section");
    return new Promise((resolve) => {
      cloudinary.uploader.upload(file, (err, res) => {
        console.log(err, " asdfgh");
        if (err) return res.status(500).send("Upload Image Error")
        resolve(res.secure_url)
      })
    })
  }

  const files = req.files
  let arr1 = Object.values(files)
  let arr2 = arr1.flat()
  const urls = await Promise.all(
    arr2.map(async (file) => {
      const { path } = file
      const result = await cloudinaryImageUploadMethod(path)
      return result
    })
  )
  console.log(urls);
  productHelpers.updateProduct(req.params.id, req.body, urls).then((id) => {
    res.redirect('/admin/allProducts')
  })
})

//DELETE PRODUCT
router.delete('/delete-product',AdminMidleware.AdminFunActionCheck , (req, res) => {
  console.log(",,,,,,,,,,,,,,,,,",req.body.prdctId);
  productHelpers.deleteProduct(req.body.prdctId).then((response) => {
    // res.redirect('/admin/allProducts')
    res.json({status:true})
  })
})

//CATEGORY LISTING
router.get('/category',AdminMidleware.AdminFunActionCheck , (req, res) => {
  adminHelpers.getCategory().then((category) => {
    let admin = req.session.admin
    res.render('Admin/category', {category,admin: true})
  })
})


router.post('/category', (req, res) => {
  adminHelpers.addCategory(req.body).then(() => {
    res.redirect('/admin/category');
  }).catch(() => {
    res.redirect('/admin/category');
  })
})


//EDIT CATEGORY
router.put('/edit-category',AdminMidleware.AdminFunActionCheck , (req, res) => {
  console.log(req.body, '###########');
  adminHelpers.editCategory(req.body).then(async () => {
    console.log(req.body, 'INNNNNNnnnnnnnnnnnnnnnn');
    await productHelpers.updateProductCategory(req.body)
    res.json({ status: true })
  }).catch(() => {
    res.json({ status: false })
  })
})

//DELETE CATEGORY 
router.delete('/delete-category',AdminMidleware.AdminFunActionCheck , (req, res) => {
  console.log(req.body,"..................................");
  
  adminHelpers.deleteCategory(req.body).then(async () => {
    await productHelpers.deleteProductCategory(req.body.catName)
    res.json({ status: true })
  }).catch(() => {
    res.json({ status: false })
  })
})


//ORDERS
router.get('/orders',AdminMidleware.AdminFunActionCheck , (req, res) => {
  adminHelpers.getOrderDetails('placed').then((orderItems) => {
    console.log("orderItems -----------------------",orderItems);
    res.render('admin/orders', { orderItems ,admin: true})
  })
})

module.exports = router;
