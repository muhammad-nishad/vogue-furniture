let db = require('../config/connection')
let collection = require('../config/collections');
const { response } = require('express');

const env=require('dotenv').config()


let config = {
  serviceID: process.env.TWILIO_SERVICE_SID,
  accountSID: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
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