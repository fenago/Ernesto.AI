const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
var CronJob = require('cron').CronJob;
const request = require("request-promise");

let transporter, MailGenerator, azureClient, costAnalysisClient;
let billingAccountId, costAnalysisapiVersion;
var granularity = "None";

// https://medium.com/javascript-in-plain-english/how-to-send-emails-with-node-js-1bb282f334fe

function sendCostStatus(CA, EMAIL, userEmail) {

  var name = "Admin";
  let response = {
    body: {
      name,
      title: 'Fenago Cost Analysis!',
      intro: `Total Cost: ${CA.totalCost} $ <br> Billing Period: ${CA.billingPeriod}<br>`,
      table: {
        data: CA.data,
      },
      outro: `This is an automatically generated email, please do not reply to this e-mail.`,
    },
  };

  let mail = MailGenerator.generate(response);

  let message = {
    from: EMAIL,
    to: userEmail,
    subject: "Fenago Cost Analysis Summary",
    html: mail,
  };

  transporter
    .sendMail(message)
    .then(() => {
      console.log("e-mail sent (cost analysis)");

    })
    .catch((error) => console.error(error));
};


async function getCostData(resp, billingPeriod) {

  var data = [];
  var columns = resp.properties.columns;
  var rows = resp.properties.rows;
  var totalCost = 0;

  for (var i = 0, len = rows.length; i < len; i++) {
    var rgData = rows[i];
    var RGFormat = {};

    for (var j = 0; j < columns.length; j++) {
      var name = columns[j].name;
      RGFormat[name] = rgData[j];

      if (name == "CostUSD") {
        totalCost = totalCost + rgData[j];
        RGFormat[name] = rgData[j].toFixed(2);
      } else {
        RGFormat[name] = rgData[j];
      }

    }

    // Move resource group name to the first place
    var RGName = RGFormat['ResourceGroupName'];
    delete RGFormat['ResourceGroupName'];
    var rg = { "ResourceGroupName": RGName }
    var RGData = { ...rg, ...RGFormat }

    data.push(RGData);
  }

  return {
    "totalCost": totalCost.toFixed(2),
    "billingPeriod": billingPeriod,
    "data": data
  };

}

function setupCAMailCron(pattern, timeZone, EMAIL, PASSWORD, adminMail, MAIN_URL, azureObj, costAnalysisObj, billingAccount, costapiVersion) {

  console.log('******************************************************');
  console.log('[Info] e-mail cost analysis cron setup!');
  console.log(`[Info] Refresh pattern: ${pattern}`);

  azureClient = azureObj;
  costAnalysisClient = costAnalysisObj;
  billingAccountId = billingAccount;
  costAnalysisapiVersion = costapiVersion;

  transporter = nodemailer.createTransport({
    service: "gmail",
    secure: true,
    auth: {
      user: EMAIL,
      pass: PASSWORD,
    },
  });

  MailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Fenago Support",
      link: MAIN_URL,
      logo: 'https://raw.githubusercontent.com/fenago/applied-tensorflow-and-keras/master/logo.png',
      copyright: 'Copyright © 2020 fenago. All rights reserved.',
    },
  });


  try {

    var job = new CronJob(
      pattern,
      async function () {

        var date = new Date();
        var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        firstDay = new Date(firstDay.getTime() - (firstDay.getTimezoneOffset() * 60000))
          .toISOString()
          .split("T")[0];


        var currentDay = new Date();
        currentDay.setDate(currentDay.getDate() - 1);
        var previousDay = new Date(currentDay.getTime() - (currentDay.getTimezoneOffset() * 60000))
          .toISOString()
          .split("T")[0];

        var timePeriodFrom = firstDay + "T00:00";
        var timePeriodTo = previousDay + "T23:59";
        var billingPeriod = firstDay.split("-").join("/") + " - " + previousDay.split("-").join("/");

        try {
          var accessToken = await azureClient.getAccessToken();
          var costAnalysisJSON = costAnalysisClient.getResourceGroupsCostAnalysisJSON(
            granularity,
            timePeriodFrom,
            timePeriodTo
          );
          var resp = await costAnalysisClient.getResourceGroupsCostAnalysis(
            accessToken,
            billingAccountId,
            costAnalysisapiVersion,
            "1000",
            costAnalysisJSON
          );

          var data = await getCostData(resp, billingPeriod);
          sendCostStatus(data, EMAIL, adminMail);

        } catch (err) {
          console.log("Failed to send cost analysis mail" + err);
        }
      },
      null,
      true,
      timeZone
    );

    console.log('[Info] Mail cron created!');
    job.start();
    return job;

  } catch (e) {
    console.log(`[Setup: Error] Failed! ` + e);
  }

}


module.exports = {
  setupCAMailCron,
};
