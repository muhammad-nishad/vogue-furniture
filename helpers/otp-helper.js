let db = require('../config/connection')
let collection = require('../config/collections');
const { response } = require('express');


let config = {
  serviceID: "VA11d4891d0e19a7dc99bd9ca01d456773",
  accountSID: "AC854c1858bab3f0f6a53993976e5d6d45",
  authToken: "7226eb3fb4e7fc8510ea9162a5976ae9"
};


let client = require("twilio")(config.accountSID, config.authToken);

module.exports = {
  getOtp: (number) => {
    return new Promise(async (resolve, reject) => {
      let user = await db.get().collection(collection.USER_COLLECTION).findOne({ mobile: number })

      let response = {}
      if (user) {
        response.exist = true
        if (user.ActiveStatus) {
          client.verify.v2.services(config.serviceID).verifications.create({ to: '+91' + number, channel: "sms" }).then((data) => {
            response.data = data
            response.user = user
            response.ActiveStatus = true;
            resolve(response);
          });
        } else {
          response.userBlocked = true
          resolve(response)
        }
      } else {
        response.exist = false
        resolve(response)
      }
    });
  },
  checkOtp: (otp, number) => {
    number = "+91" + number;
    return new Promise((resolve, reject) => {
      client.verify.v2.services(config.serviceID).verificationChecks.create({ to: number, code: otp }).then((verification_check) => {
        console.log(verification_check.status);
        resolve(verification_check.status);
      });
    });
  },
};