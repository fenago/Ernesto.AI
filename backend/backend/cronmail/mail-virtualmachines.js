const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
var CronJob = require('cron').CronJob;
const request = require("request-promise");

let transporter, MailGenerator, azureClient;

// https://medium.com/javascript-in-plain-english/how-to-send-emails-with-node-js-1bb282f334fe

function sendSubscriptionVMStatus(VM, EMAIL, userEmail) {

  var name = "Admin";
  let response = {
    body: {
      name,
      title: 'Fenago Virtual Machines Status!',
      intro: `Running: ${VM.totalrunning} <br> Stopped ${VM.totalStopped} <br> Total Count: ${VM.totalCount}<br>`,
      table: {
        data: VM.data,
      },
      outro: `This is an automatically generated email, please do not reply to this e-mail.`,
    },
  };

  let mail = MailGenerator.generate(response);

  let message = {
    from: EMAIL,
    to: userEmail,
    subject: "Fenago VM Summary",
    html: mail,
  };

  transporter
    .sendMail(message)
    .then(() => {
      console.log("e-mail sent");

    })
    .catch((error) => console.error(error));
};


async function getSubscriptionData(resp, accessToken) {

  var data = [];
  var subVM = resp.value;
  var totalrunning = 0, totalStopped = 0;

  for (var i = 0, len = subVM.length; i < len; i++) {

    var VMspecs = subVM[i];
    var resourceGroup = VMspecs.id.split("/")[4]
    // var respInstance = await azureClient.getInstanceViewVM(accessToken, resourceGroup, VMspecs.name);
    // var dataInstance = JSON.parse(respInstance);
    // var status = dataInstance.statuses[1].displayStatus;
    var status = VMspecs.statuses[1].displayStatus;

    var VMData = {
      VirtualMachine: VMspecs.name,
      ResourceGroup: resourceGroup,
      ProvisioningState: VMspecs.properties.provisioningState,
      HardwareProfile: subVM[i].properties.hardwareProfile.vmSize,
      osType: VMspecs.properties.storageProfile.osDisk.osType,
      Status: status
    };

    (status === "VM running") ? totalrunning = ++totalrunning : totalStopped = ++totalStopped;
    data.push(VMData)

  }

  return {
    "totalrunning": totalrunning,
    "totalStopped": totalStopped,
    "totalCount": totalrunning + totalStopped,
    "data": data
  };

}

function setupVMMailCron(pattern, timeZone, EMAIL, PASSWORD, adminMail, MAIN_URL, azureObj) {

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
      copyright: 'Copyright © 2020 fenago. All rights reserved.',
    },
  });


  try {

    var job = new CronJob(
      pattern,
      async function () {

        try {
          var accessToken = await azureClient.getAccessToken();
          var resp = await azureClient.getSubscriptionVM(accessToken);
          var data = await getSubscriptionData(resp, accessToken);
          sendSubscriptionVMStatus(data, EMAIL, adminMail);

        } catch (err) {
          console.log("Failed to send subscription VM status mail" + err);

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
  setupVMMailCron,
};
