const { response, request } = require('express');
let express = require('express');
const session = require('express-session');
const productHelpers = require('../helpers/product-helpers');
let router = express.Router()
const userHelper = require('../helpers/user-helpers')
const otpHelper = require('../helpers/otp-helper')
const producthelper = require('../helpers/product-helpers')
const bannerhelper = require('../helpers/banner-helper')
const addresshelper = require('../helpers/address-helper');
const adminhelper = require('../helpers/admin-helper');
const categoryhelper = require('../helpers/category-helper');



const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

const Blockstatus=(req,res,next)=>{
  if(req.session.userBlocked){
    res.redirect('/login')
  }else{
    next()
  }
}





/* GET home page. */
router.get('/', async (req, res) => {
  let user = req.session.user
  let CartCount = null
  let WishlistCount = null
  let userloggedin=req.session.loggedIn
  if (user) {
    CartCount = await userHelper.getCartCount(req.session.user._id)
    WishlistCount = await userHelper.getWishlistCount(req.session.user._id)

  }
  producthelper.getAllProduct().then((allProduct) => {
    bannerhelper.getAllBanner().then(async (allbanner) => {
      let allCategory = await categoryhelper.getAllCategory()
      res.render('./user/userhome', { user_header: true, user_footer: true, user, allProduct, allbanner, CartCount, WishlistCount, allCategory,userloggedin })
    })
  })
});

router.get('/signup', function (req, res) {
  if (req.session.user)
    res.redirect('/')
  else {
    let userexist = req.session.userexist
    req.session.userexist = null
    res.render('user/userregister', { userexist })
  }
})

router.post('/signup', (req, res) => {
  userHelper.doSignup(req.body).then(async (state) => {
    if (state.userexist) {
      req.session.userexist = true
      req.session.user = state.user
      res.redirect('/signup')
    } else {
      req.session.loggedIn = true
      req.session.user = state.user
      res.redirect('/')
    }
  })

})
router.get('/login', function (req, res) {
  if (req.session.user) {
    res.redirect('/')
  } else {
    let wrongpassword = req.session.wrongpassword
    req.session.wrongpassword = false
    let userNotFound = req.session.userNotFound
    req.session.userNotFound = false
    let userBlocked = req.session.userBlocked
    req.session.userBlocked = false
    let usernotfound = req.session.usernotfound
    req.session.usernotfound = false
    res.render('user/userlogin', { userBlocked, userNotFound, usernotfound, wrongpassword })
  }

})
router.get('/otpverify', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('user/otpverify')
  }
})

router.post('/otppage', (req, res) => {
  req.session.mobile = req.body.mobile;
  otpHelper.getOtp(req.body.mobile).then((response) => {
    if (response.exist) {
      if (response.ActiveStatus) {
        req.session.user = response.user
        res.redirect('/otpverify')
      } else {
        req.session.userBlocked = true;
        res.redirect('/login')
      }
    } else {
      req.session.usernotfound = true
      res.redirect('/login')
    }
  })
})

router.post('/otpverify', async (req, res) => {
  otpHelper.checkOtp(req.body.otp, req.session.mobile).then((response) => {
    if (response == 'approved') {
      req.session.loggedIn = true
      res.redirect('/')
    } else {
      res.redirect('/otpverify')
    }
  })
})

router.post('/login', function (req, res) {
  userHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect('/')
    } else {
      req.session.userBlocked = response.userBlocked
      res.redirect('/login')
    }

  }).catch((response) => {
    if (response.invalidPassword) {
      req.session.wrongpassword = response.invalidPassword
      res.redirect('/login')
    } else {
      req.session.userNotFound = response.userNotfound
      res.redirect('/login')
    }
  })

})


router.get('/userprofile', verifyLogin,Blockstatus, async (req, res,next) => {
  let user = req.session.user
  let userdetails = await userHelper.getUserdetails(user._id)
  let wrongcurrentpass = req.session.wrongcurrentpass
  req.session.wrongcurrentpass = false
  let address = await addresshelper.getAllAddress(req.session.user._id)
  let CartCount = await userHelper.getCartCount(user._id)
  let WishlistCount = await userHelper.getWishlistCount(req.session.user._id)
  res.render('user/userprofile', { user_header: true, user_footer:true, userdetails, user, address, CartCount, WishlistCount, wrongcurrentpass })

})


router.post('/editprofile', (req, res) => {
  userHelper.updateUserdetails(req.session.user._id, req.body).then((response) => {
    res.redirect('/userprofile')
  })
})

router.get('/singleproduct/:id',verifyLogin, async (req, res, next) => {
  try {
    let allProduct = await productHelpers.getAllProduct()
    let CartCount = await userHelper.getCartCount(req.session.user._id)
    let WishlistCount = await userHelper.getWishlistCount(req.session.user._id)
    productHelpers.getProductDetails(req.params.id).then((product) => {
      let user = req.session.user
      res.render('user/singleproduct', { allProduct, user_header: true,user_footer:true, product, user, CartCount, WishlistCount })
    })
  } catch (err) {
    next(err)
  }
})

router.get('/addcart/:id', (req, res, next) => {
  try {
    if (req.session.user) {
      userHelper.addtoCart(req.params.id, req.session.user._id).then(() => {
        res.json({ status: true })
      })
    } else {
      res.redirect('/login')
    }
  } catch (err) {
    next(err)
  }
})

router.get('/cart', verifyLogin, (req, res) => {
  req.session.coupen = null;
  userHelper.getCartProducts(req.session.user._id).then(async (response) => {
    let products = response.cartItems
    let cartEmpty = response.cartEmpty
    let user = req.session.user
    let CartCount = await userHelper.getCartCount(req.session.user._id)
    let WishlistCount = await userHelper.getWishlistCount(req.session.user._id)
    let totalAmount = 0
    totalAmount = await userHelper.getTotalAmount(req.session.user._id)
    console.log(totalAmount,'total');
    res.render('user/cart', { totalAmount, user_header: true,user_footer: true, products, user: req.session.user, CartCount, cartEmpty, user,WishlistCount })

  })

})


router.get('/deletecart/:id', (req, res, next) => {
  try {
    userHelper.removeFromCart(req.params.id, req.session.user._id).then((response) => {
      res.redirect('/cart')
    })
  } catch (err) {
    next(err)
  }
})

router.post('/change-product-quantity', (req, res, next) => {
  userHelper.changeProductQuantity(req.body).then((response) => {
    res.json({ response })
  })
})

router.post('/addaddress', verifyLogin, (req, res) => {
  addresshelper.addAddress(req.body, req.session.user._id).then((response) => {
    res.redirect('/userprofile')
  })
})

router.post('/editaddress/:id', (req, res, next) => {
  try {
    addresshelper.updateAddress(req.params.id, req.body).then((response) => {
      res.redirect('/userprofile')
    })
  } catch (err) {
    next(err)
  }
})


router.get('/deleteaddress/:id', (req, res, next) => {
  try {
    addresshelper.deleteAddress(req.params.id).then((response) => {
      res.redirect('/userprofile')
    })
  } catch (err) {
    next(err)
  }
})

router.get('/checkout', verifyLogin, async (req, res) => {
  let allAddress = await addresshelper.getAllAddress(req.session.user._id)
  let response = await userHelper.getCartProducts(req.session.user._id)
  let products = response.cartItems
  let totalAmount = await userHelper.getTotalAmount(req.session.user._id)
  let CartCount = await userHelper.getCartCount(req.session.user._id)
  let WishlistCount = await userHelper.getWishlistCount(req.session.user._id)
  if(req.session.coupen){
    let coupendiscount= req.session.discount
    let discountPrice=req.session.discountprice
    res.render('user/checkout', { user: req.session.user, allAddress,totalAmount, products, user_header: true, CartCount ,coupendiscount,WishlistCount, discountPrice})
  }else{
  let products = response.cartItems
  let totalAmount = await userHelper.getTotalAmount(req.session.user._id)
  let CartCount = await userHelper.getCartCount(req.session.user._id)
  res.render('user/checkout', { user: req.session.user, allAddress, products, totalAmount, user_header: true, CartCount,WishlistCount})
  }
})


router.post('/place-order', verifyLogin,async (req, res) => {
  let products = await userHelper.getCartProductlist(req.body.userId)
  let totalAmount = await userHelper.getTotalAmount(req.body.userId)
  userHelper.placeOrder(req.body, products, totalAmount, req.session.coupen, req.session.user._id).then((orderId) => {
    req.session.order = orderId
    if (req.body.payment == 'COD') {
      res.json({ codSuccess: true })

    } else {
      userHelper.genrateRazorpay(orderId, req.body.GrandTotal).then((response) => {
        res.json(response)
      })
    }
  })
})

router.post('/verify-payment', (req, res) => {
  userHelper.verifyPayment(req.body).then(() => {
    userHelper.changePaymentStatus(req.body['order[receipt]']).then(() => {
      res.json({ status: true })
    })
  }).catch((err) => {
    res.json({ status: false })
  })

})

router.get('/ordersuccess', verifyLogin, (req, res) => {
  let orderId = req.session.order
  userHelper.getOrderProducts(orderId).then(async (item) => {
    console.log(item,'items');
    let user = req.session.user
    let CartCount = await userHelper.getCartCount(req.session.user._id)
    let WishlistCount = await userHelper.getWishlistCount(req.session.user._id)
    res.render('user/ordersuccess', { item, user_header: true, user, CartCount,WishlistCount })
  })

})

router.get('/addwishlist/:id', (req, res, next) => {
  try {
    if (req.session.loggedIn) {
      userHelper.addtoWishlist(req.params.id, req.session.user._id).then((response) => {
        console.log(response,'response');
        res.json({ response })
      })
    } else {
      res.redirect('/signup')
    }
  } catch (err) {
    next(err)
  }

})

router.get('/wishlist', verifyLogin, async (req, res) => {
  userHelper.getWishlistProducts(req.session.user._id).then(async (response) => {
    let wishlistEmpty = response.wishlistEmpty
    let Products = response.wislistItems
    console.log(Products,'products');
    let user = req.session.user
    let CartCount = await userHelper.getCartCount(user._id)
    let WishlistCount = await userHelper.getWishlistCount(req.session.user._id)
    res.render('user/wishlist', { Products, user_header: true, user_footer: true, user, CartCount, wishlistEmpty, WishlistCount })
  })
})



router.get('/view-orders', verifyLogin, async (req, res) => {
  let orders = await userHelper.getUserOrder(req.session.user._id)
  let user = req.session.user
  let CartCount = await userHelper.getCartCount(user._id)
  let WishlistCount = await userHelper.getWishlistCount(req.session.user._id)
  res.render('user/vieworders', { user_header: true, orders, user, CartCount, WishlistCount })
})

router.get('/view-single-order/:id', verifyLogin, async (req, res, next) => {
  try {
    let item = await userHelper.getOrderProducts(req.params.id)
    let user = req.session.user
    let CartCount = await userHelper.getCartCount(user._id)
    let WishlistCount = await userHelper.getWishlistCount(req.session.user._id)
    res.render('user/singleorder', { item, user_header: true, user, CartCount, WishlistCount, user_footer: true })
  } catch (err) {
    next(err)
  }
})

router.get('/deletewishlist/:id', (req, res, next) => {
  try {
    userHelper.removeFromWishlist(req.params.id, req.session.user._id).then((response) => {
      res.redirect('/wishlist')
    })
  } catch (err) {
    next(err)
  }

})

router.post('/apply-coupen', verifyLogin, (req, res) => {
  adminhelper.ApplyCoupen(req.body, req.session.user._id).then((response) => {
    if (response.status) {
      req.session.coupen = response.coupen
      req.session.discount = response.discount
      console.log(req.session.discount,'discount');
      req.session.discountprice=response.discountPrice
    }
    res.json(response)
  })
})


router.post('/shippingaddress', (req, res) => {
  addresshelper.addAddress(req.body).then((response) => {
    res.redirect('/checkout')
  })
})



router.get('/view-allproducts/:category', verifyLogin, async (req, res) => {
  let allCategory = await categoryhelper.getAllCategory()
  let products = await producthelper.getCategoryProduct(req.params.category)
  let user = req.session.user
  let CartCount = await userHelper.getCartCount(user._id)
  let WishlistCount = await userHelper.getWishlistCount(req.session.user._id)
  res.render('user/viewallproduct', { allCategory, products, user_header: true,user_footer:true, user, CartCount, WishlistCount })

})


router.get('/view-allproducts', verifyLogin, async (req, res) => {
  let allCategory = await categoryhelper.getAllCategory()
  let products = await producthelper.getAllProduct()
  let user = req.session.user
  let CartCount = await userHelper.getCartCount(user._id)
  let WishlistCount = await userHelper.getWishlistCount(req.session.user._id)
  res.render('user/viewallproduct', { allCategory, products, user_header: true,user_footer:true, user, CartCount, WishlistCount })

})

router.post('/editpassword', (req, res) => {
  userHelper.changePassword(req.body, req.session.user._id).then((response) => {
    if (response.wrongcurrentpass) {
      req.session.wrongcurrentpass = response.wrongcurrentpass
      res.redirect('/userprofile')
    } else {
      res.redirect('/userprofile')
    }

  })
})


router.post('/cancelOrder/:id', (req, res, next) => {
  try {
    userHelper.cancelOrder(req.params.id).then((response) => {
      res.json({ response })
    })
  } catch (err) {
    next(err)
  }
})


router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})

module.exports = router;
