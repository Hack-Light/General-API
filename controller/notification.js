const { createInstance } = require("@engagespot/notifications");

const engagespotInstance = createInstance({
  apiKey: process.env.ENGAGESPOT_APIKEY,
  siteKey: process.env.ENGAGESPOT_SITEKEY
});

// let result = engagespotInstance
//   .setMessage({
//     campaign_name: "okkkkkkkkkkkkkkkkkkk",
//     notification: {
//       title: "You have a new message from John!",
//       message: "Hey Dave, Wassup...",
//       icon: "",
//       url: "https://google.com"
//     },
//     send_to: "identifiers"
//   })
//   .addIdentifiers([phone_number])
//   .send();

module.exports = engagespotInstance;
