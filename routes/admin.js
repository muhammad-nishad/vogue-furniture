const { response } = require('express');
const express = require('express');
let router = express.Router();
const adminhelper = require('../helpers/admin-helper')
const userhelper = require('../helpers/user-helpers')
const producthelper = require('../helpers/product-helpers')
const categoryhelper=require('../helpers/category-helper');
const { addCategory } = require('../helpers/category-helper');
let multer=require('multer')
const bannerhelper=require('../helpers/banner-helper')

const storage = multer.diskStorage({
  destination: "public/product-images",
  filename: (req, file, cb) => {
    cb(null, Date.now() + '--' + file.originalname);
  },
});

const uploads = multer({
  storage
});

/* GET users listing. */

router.get('/',  (req, res)=> {
  if (req.session.admin) {
    res.render('admin/adminhome',{layout:'dashboard-layout'})
  } else {
    let invalid = req.session.invalid
    let notfound=req.session.notfound
    res.render('admin/adminlogin', { invalid,notfound })
    req.session.invalid = false
    req.session.notfound=false
  }
});

router.get('/userdetails', (req, res) => {
  userhelper.getAllUsers().then((allusers) => {
    res.render('admin/userdetails', { allusers,layout:'dashboard-layout' })
  })
})
router.get('/userblock/:id', (req, res) => {
  adminhelper.blockuser(req.params.id)
  res.redirect('/admin/userdetails')
})

router.get('/useractive/:id',(req,res)=>{
  adminhelper.activeUser(req.params.id)
  res.redirect('/admin/userdetails')
})

router.get('/login',  (req, res)=> {
  if (req.session.admin) {
    res.redirect('/admin/')

  } else {
    res.redirect('/admin/')
  }
}
)
router.post('/login', function (req, res) {
  adminhelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.admin = response.admin
      res.redirect('/admin/')
    }
  }).catch((response) => {
    if (response.invalidPassword) {
      req.session.invalid = response.invalidPassword
      res.redirect('/admin/')
    } else if (response.userBlocked) {
      req.session.userBlocked = response.userBlocked
      res.redirect('/userdetails')
    } else {
      req.session.notfound = response.userNotfound
      res.redirect('/admin/')
    }

  })

})

router.post('/addcategory',uploads.single('image'),(req,res)=>{
  req.body.image=req.file.filename
 categoryhelper.addCategory(req.body).then((state)=>{
  if(state.categoryexist){
    req.session.categoryexist=true
    req.session.category=state.category
    res.redirect('/admin/viewcategory')
  }else{
    req.session.category=state.category
    res.redirect('/admin/viewcategory')
  }
 })

})

router.get('/viewcategory',(req,res)=>{
  categoryhelper.getAllCategory().then((allCategory)=>{
    let categoryexist=req.session.categoryexist
    if(categoryexist){
      let categoryexist=req.session.categoryexist
           req.session.categoryexist=null
      res.render('admin/viewcategory',{categoryexist, allCategory, layout:'dashboard-layout'})
    }else{
      res.render('admin/viewcategory',{allCategory,layout:'dashboard-layout'})
    }
  })
})


router.post('/editcategory/:id',(req,res)=>{
  categoryhelper.updateCategory(req.params.id,req.body).then(()=>{
    res.redirect('/admin/viewcategory')
  })
})


router.get('/deletecategory/:id',(req,res)=>{
  categoryhelper.deleteCategory(req.params.id).then((response)=>{
    res.redirect('/admin/viewcategory')
  })
})

router.post('/submit', uploads.array('image',3),(req, res)=> {
  const images = [];
  for (i = 0; i < req.files.length; i++) {
    images[i] = req.files[i].filename;
  }
  req.body.images=images
  producthelper.addproduct(req.body).then((data) => {
      res.redirect('/admin/viewproduct')

    })
 })



router.get('/viewproduct',(req,res)=>{
  producthelper.getAllProduct().then(async(allProduct)=>{
    let allCategory=await categoryhelper.getAllCategory()
    res.render('admin/viewproducts',{allProduct,allCategory,layout:'dashboard-layout'})

  })
})

router.post('/editproduct/:id',uploads.array('image',3),(req,res)=>{
  producthelper.updateProduct(req.params.id,req.body).then((response)=>{
    res.redirect('/admin/viewproduct')
  }) 
})

router.get('/deleteproduct/:id',(req,res)=>{
  let prodId=req.params.id
  producthelper.deleteProduct(prodId).then((response)=>{
    res.redirect('/admin/viewproduct')
  })
})


router.post('/addbanner', uploads.single('image'), (req,res)=>{
  req.body.image = req.file.filename
  bannerhelper.addBanner(req.body).then((data)=>{
    res.redirect('/admin/viewbanner')
  })
})

router.get('/viewbanner',(req,res)=>{
  bannerhelper.getAllBanner().then((allbanner)=>{
    res.render('admin/viewbanner',{allbanner,layout:'dashboard-layout'})
  })
})


router.post('/editbanner/:id',(req,res)=>{
  req.body.image = req.file.filename
  bannerhelper.updateBanner(req.params.id,req.body).then(()=>{
    res.redirect('/admin/viewbanner')
  })
})

router.get('/deletebanner/:id',(req,res)=>{
  bannerhelper.deleteBanner(req.params.id).then((response)=>{
    res.redirect('/admin/viewbanner')
  })
})


router.post('/addcoupen', (req,res)=>{
  adminhelper.addCoupen(req.body).then((response)=>{
    if(response.coupenExist){
      req.session.coupenExist=response.coupenExist
      req.session.coupenExist=true
      res.redirect('/admin/viewcoupens')
    }else{
      res.redirect('/admin/viewcoupens')
    }
    
  })

})

router.get('/viewcoupens',async(req,res)=>{
  let allCoupens=await adminhelper.getAllCoupens()
  if(req.session.coupenExist){
    let coupenExist=req.session.coupenExist
    req.session.coupenExist=false
    res.render('admin/viewcoupens',{allCoupens,coupenExist,layout:'dashboard-layout' })
  }else{
    res.render('admin/viewcoupens',{allCoupens,layout:'dashboard-layout' })
  }
})

router.post('/update-coupen/:id',(req,res)=>{
  adminhelper.updateCoupen(req.params.id,req.body).then((response)=>{
    res.redirect('/admin/viewcoupens')
  })
})

router.get('/delete-coupen/:id',(req,res)=>{
  adminhelper.deleteCoupen(req.params.id).then((response)=>{
    res.redirect('/admin/viewcoupens')
  })
})

router.get('/vieworders',async(req,res)=>{
  let allOrders=await userhelper.getAllOrders()
  res.render('admin/vieworders',{allOrders,layout:'dashboard-layout' })
})


router.get("/salesReportChart", (req, res) => {
  userhelper.getAllOrders().then((orders) => {
    res.json({ orders });
  });
});

router.post('/changeOrderStatus', (req, res)=>{
  userhelper.changeOrderStatus(req.body).then(response =>{
    res.json(response)
  })
})


router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/admin')
})

module.exports = router;  
