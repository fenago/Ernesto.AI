const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
var CronJob = require('cron').CronJob;
const request = require("request-promise");

var resourceGroup = "trivera";
let transporter, MailGenerator, azureClient;

// https://medium.com/javascript-in-plain-english/how-to-send-emails-with-node-js-1bb282f334fe
function sendTriveraContainersStatus(containers, EMAIL, userEmail) {

  var name = "Admin";
  let response = {
    body: {
      name,
      title: 'Trivera Containers Status!',
      intro: `Running: ${containers.totalrunning} <br> Stopped ${containers.totalStopped} <br> Total Count: ${containers.totalCount}<br>`,
      table: {
        data: containers.data,
      },
      outro: `This is an automatically generated email, please do not reply to this e-mail.`,
    },
  };

  let mail = MailGenerator.generate(response);

  let message = {
    from: EMAIL,
    to: userEmail,
    subject: "Fenago Containers Summary",
    html: mail,
  };

  transporter
    .sendMail(message)
    .then(() => {
      console.log("e-mail sent");

    })
    .catch((error) => console.error(error));
};


function getTriveraData(resp) {

  var data = [];
  var subContainers = resp.value;
  var totalrunning = 0, totalStopped = 0;

  for (var i = 0, len = subContainers.length; i < len; i++) {

    var containerData = {
      ContainerName: subContainers[i].name,
      ResourceGroup: subContainers[i].id.split("/")[4],
      ProvisioningState: subContainers[i].properties.provisioningState,
      Status: (subContainers[i].properties.ipAddress.ip != undefined) ? "Running" : "Stopped",
      DNS: subContainers[i].properties.ipAddress.fqdn
    };

    (subContainers[i].properties.ipAddress.ip != undefined) ? totalrunning = ++totalrunning : totalStopped = ++totalStopped;
    data.push(containerData)

  }

  return {
    "totalrunning": totalrunning,
    "totalStopped": totalStopped,
    "totalCount": totalrunning + totalStopped,
    "data": data
  };

}

function setupTriveraMailCron(pattern, timeZone, EMAIL, PASSWORD, adminMail, MAIN_URL, azureObj) {

  console.log('******************************************************');
  console.log('[Info] e-mail cron setup!');
  console.log(`[Info] Refresh pattern: ${pattern}`);

  azureClient = azureObj;

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
      copyright: 'Copyright © 2021 fenago. All rights reserved.',
    },
  });


  try {

    var job = new CronJob(
      pattern,
      async function () {

        try {
          var accessToken = await azureClient.getAccessToken();
          var resp = await azureClient.getContainers(accessToken, resourceGroup);
          var data = getTriveraData(JSON.parse(resp));

          if (data.totalrunning > 2)
            sendTriveraContainersStatus(data, EMAIL, adminMail);

        } catch (err) {
          console.log("Failed to send Trivera container status mail" + err);

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
  setupTriveraMailCron,
};
