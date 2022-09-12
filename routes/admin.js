const { response } = require('express');
const express = require('express');
let router = express.Router();
const adminhelper = require('../helpers/admin-helper')
const userhelper = require('../helpers/user-helpers')
const producthelper = require('../helpers/product-helpers')
const categoryhelper = require('../helpers/category-helper');
const { addCategory } = require('../helpers/category-helper');
let multer = require('multer')
const bannerhelper = require('../helpers/banner-helper')


const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/admin/login')
  }
}







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

router.get('/',async(req, res) => {
  if (req.session.admin) {
   let totalRevenue=await adminhelper.totalRevenue()
   let cashOnDelivery=await adminhelper.cashOndeivery()
   let onlinebanking=await adminhelper.netBanking()
   let allorders=await adminhelper.allOrders()
    res.render('admin/adminhome', { layout: 'dashboard-layout',totalRevenue,cashOnDelivery,onlinebanking ,allorders})
  } else {
    let invalid = req.session.invalid
    let notfound = req.session.notfound
    res.render('admin/adminlogin', { invalid, notfound })
    req.session.invalid = false
    req.session.notfound = false
  }
});

router.get('/userdetails', verifyLogin, (req, res) => {
  userhelper.getAllUsers().then((allusers) => {
    res.render('admin/userdetails', { allusers, users: true, layout: 'dashboard-layout' })
  })
})
router.get('/userblock/:id', (req, res, next) => {
  try {
    adminhelper.blockuser(req.params.id)
    req.session.userBlocked=true
    res.redirect('/admin/userdetails')
  } catch (err) {
    next(err)
  }
})

router.get('/useractive/:id', verifyLogin, (req, res, next) => {
  try {
    adminhelper.activeUser(req.params.id)
    res.redirect('/admin/userdetails')
  } catch (err) {
    next(err)
  }
})

router.get('/login', (req, res) => {
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
      req.session.loggedIn = true
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

router.post('/addcategory', verifyLogin, uploads.single('image'), (req, res) => {
  req.body.image = req.file.filename
  categoryhelper.addCategory(req.body).then((state) => {
    if (state.categoryexist) {
      req.session.categoryexist = true
      req.session.category = state.category
      res.redirect('/admin/viewcategory')
    } else {
      req.session.category = state.category
      res.redirect('/admin/viewcategory')
    }
  })

})

router.get('/viewcategory', verifyLogin, (req, res) => {
  categoryhelper.getAllCategory().then((allCategory) => {
    let categoryexist = req.session.categoryexist
    if (categoryexist) {
      let categoryexist = req.session.categoryexist
      req.session.categoryexist = null
      res.render('admin/viewcategory', { categoryexist, categoryactive: true, allCategory, layout: 'dashboard-layout' })
    } else {
      res.render('admin/viewcategory', { allCategory, categoryactive: true, layout: 'dashboard-layout' })
    }
  })
})


router.post('/editcategory/:id', verifyLogin, (req, res, next) => {
  try {
    categoryhelper.updateCategory(req.params.id, req.body).then(() => {
      res.redirect('/admin/viewcategory')
    })
  } catch (err) {
    next(err)
  }
})


router.get('/deletecategory/:id', verifyLogin, (req, res, next) => {
  try {
    categoryhelper.deleteCategory(req.params.id).then((response) => {
      res.redirect('/admin/viewcategory')
    })
  } catch (err) {
    next(err)
  }
})

router.post('/submit', verifyLogin, uploads.array('image', 3), (req, res) => {
  const images = [];
  for (i = 0; i < req.files.length; i++) {
    images[i] = req.files[i].filename;
  }
  req.body.images = images
  producthelper.addproduct(req.body).then((data) => {
    res.redirect('/admin/viewproduct')

  })
})



router.get('/viewproduct', verifyLogin, (req, res) => {
  producthelper.getAllProduct().then(async (allProduct) => {
    let allCategory = await categoryhelper.getAllCategory()
    res.render('admin/viewproducts', { allProduct, products: true, allCategory, layout: 'dashboard-layout' })

  })
})

router.post('/editproduct/:id', verifyLogin, uploads.array('image', 3), (req, res, next) => {
  try {
    // const images = req.files
    // let array = []
    // array = images.map((value) => value.filename)
    // req.body.image = array
    producthelper.updateProduct(req.params.id, req.body).then(async (response) => {
      res.redirect('/admin/viewproduct')
    })
  } catch (err) {
    next(err)
  }
})

router.get('/deleteproduct/:id', verifyLogin, (req, res, next) => {
  try {
    let prodId = req.params.id
    producthelper.deleteProduct(prodId).then((response) => {
      res.redirect('/admin/viewproduct')
    })
  } catch (err) {
    next(err)
  }
})


router.post('/addbanner', verifyLogin, uploads.single('image'), (req, res) => {
  req.body.image = req.file.filename
  bannerhelper.addBanner(req.body).then((data) => {
    res.redirect('/admin/viewbanner')
  })
})

router.get('/viewbanner', verifyLogin, (req, res) => {
  bannerhelper.getAllBanner().then((allbanner) => {
    res.render('admin/viewbanner', { allbanner, banners: true, layout: 'dashboard-layout' })
  })
})


router.post('/editbanner/:id', verifyLogin, (req, res, next) => {
  try {
    req.body.image = req.file.filename
    bannerhelper.updateBanner(req.params.id, req.body).then(() => {
      res.redirect('/admin/viewbanner')
    })
  } catch (err) {
    next(err)
  }
})

router.get('/deletebanner/:id', verifyLogin, (req, res, next) => {
  try {
    bannerhelper.deleteBanner(req.params.id).then((response) => {
      res.redirect('/admin/viewbanner')
    })
  } catch (err) {
    next(err)
  }
})


router.post('/addcoupen', verifyLogin, (req, res) => {
  adminhelper.addCoupen(req.body).then((response) => {
    if (response.coupenExist) {
      req.session.coupenExist = response.coupenExist
      req.session.coupenExist = true
      res.redirect('/admin/viewcoupens')
    } else {
      res.redirect('/admin/viewcoupens')
    }

  })

})

router.get('/viewcoupens', verifyLogin, async (req, res) => {
  let allCoupens = await adminhelper.getAllCoupens()
  if (req.session.coupenExist) {
    let coupenExist = req.session.coupenExist
    req.session.coupenExist = false
    res.render('admin/viewcoupens', { allCoupens, coupon: true, coupenExist, layout: 'dashboard-layout' })
  } else {
    res.render('admin/viewcoupens', { allCoupens, coupon: true, layout: 'dashboard-layout' })
  }
})

router.post('/update-coupen/:id', verifyLogin, (req, res, next) => {
  try {
    adminhelper.updateCoupen(req.params.id, req.body).then((response) => {
      res.redirect('/admin/viewcoupens')
    })
  } catch (err) {
    next(err)
  }
})

router.get('/delete-coupen/:id', verifyLogin, (req, res, next) => {
  try {
    adminhelper.deleteCoupen(req.params.id).then((response) => {
      res.redirect('/admin/viewcoupens')
    })
  } catch (err) {
    next(err)
  }
})

router.get('/vieworders', verifyLogin, async (req, res) => {
  let allOrders = await userhelper.getAllOrders()
  res.render('admin/vieworders', { allOrders, orders: true, layout: 'dashboard-layout' })
})


router.get("/salesReportChart", verifyLogin, (req, res) => {
  userhelper.getAllOrders().then((orders) => {
    res.json({ orders });
  });
});

router.post('/changeOrderStatus', verifyLogin, (req, res) => {
  userhelper.changeOrderStatus(req.body).then(response => {
    res.json(response)
  })
})




router.get('/reportData', verifyLogin, (req, res) => {
  userhelper.sampleorder().then((orders) => {
    res.json(orders);
  })

})

router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/admin')
})



////last
router.use((req, res, next) => {
  let err = {}
  err.admin = true
  next(err)
})
module.exports = router;  
