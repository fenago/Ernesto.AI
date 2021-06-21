const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
var CronJob = require('cron').CronJob;
const request = require("request-promise");

let transporter, MailGenerator, azureClient;

var vncPorts = [5900, 5901];  // skip these ports during liveness probe check

// https://medium.com/javascript-in-plain-english/how-to-send-emails-with-node-js-1bb282f334fe

function sendSubscriptionContainersStatus(containers, EMAIL, userEmail) {

  var name = "Admin";
  let response = {
    body: {
      name,
      title: 'Fenago Containers Status!',
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


function getSubscriptionData(resp) {

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

function setupMailCron(pattern, timeZone, EMAIL, PASSWORD, adminMail, MAIN_URL, azureObj) {

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
          var resp = await azureClient.getSubscriptionContainers(accessToken);
          var data = getSubscriptionData(JSON.parse(resp));
          sendSubscriptionContainersStatus(data, EMAIL, adminMail);

        } catch (err) {
          console.log("Failed to send subscription container status mail" + err);

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


/////////////////////////////////////////////////////////////////////////////////////////////////

function sendLivenessProbeStatus(containers, EMAIL, userEmail) {

  var name = "Admin";
  let response = {
    body: {
      name,
      title: 'Lab Environments Not Accessible',
      intro: `Failing: ${containers.totalFailing} <br> Total Count: ${containers.totalCount}<br>
      Action Required: Stop lab environments and start again`,
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
    subject: "[Urgent] Lab Environments Not Accessible!",
    html: mail,
  };

  transporter
    .sendMail(message)
    .then(() => {
      console.log("e-mail sent");

    })
    .catch((error) => console.error(error));
};



async function getProbeDataAllPorts(baseDNS, ports) {

  var errorCode = "", errorMessage = "";

  // if no port is opened, container does not expose any api.
  if (ports == undefined || ports.length <= 0)
    return { statusCode: 200 };

  for (var i = 0, len = ports.length; i < len; i++) {

    var fqdn = `http://${baseDNS}:${ports[i].port}`;

    if (vncPorts.indexOf(ports[i].port) > -1) {
      console.log(`[LivenessProbe] Skipping vnc port: ${baseDNS}:${ports[i].port}`);
      continue;
    }
    console.log(`[LivenessProbe] Checking port: ${fqdn}`);

    var options = {
      method: "GET",
      uri: fqdn,
      resolveWithFullResponse: true,
      strictSSL: false,
      rejectUnauthorized: false
    };

    try {
      await request(options);
      return { statusCode: 200 };

    } catch (err) {

      if (err.message.indexOf("ERR_TLS_CERT_ALTNAME_INVALID") > -1) {
        return { statusCode: 200 };
      } else {
        console.log(err.message);
        errorCode = err.error.code;
        errorMessage = err.error.message
      }
    }
  }

  // all ports checked, container is down
  return {
    statusCode: errorCode,
    message: errorMessage
  }

}

async function getProbeData(resp) {

  var data = [];
  var subContainers = resp.value;
  var totalFailing = 0, message = '';

  for (var i = 0, len = subContainers.length; i < len; i++) {

    var provisioningState = subContainers[i].properties.provisioningState;
    var fqdn = "http://" + subContainers[i].properties.ipAddress.fqdn;
    var ip = subContainers[i].properties.ipAddress.ip;
    var ports = subContainers[i].properties.ipAddress.ports;
    var baseDNS = subContainers[i].properties.ipAddress.fqdn;

    if ((provisioningState == "Succeeded" || provisioningState == "Failed") && ip != undefined) {

      var statusCode;
      var options = {
        method: "GET",
        uri: fqdn,
        resolveWithFullResponse: true,
        strictSSL: false,
        rejectUnauthorized: false
      };

      try {
        var response = await request(options);
        statusCode = response.statusCode;
      } catch (err) {

        if (err.message.indexOf("ERR_TLS_CERT_ALTNAME_INVALID") > -1) {
          statusCode = 200;
        }
        else {
          console.log(err.message);

          // probe all opened ports
          var probeStatus = await getProbeDataAllPorts(baseDNS, ports);
          statusCode = probeStatus.statusCode;  // statusCode = err.error.code;
          message = probeStatus.message;  // message = err.error.message;

        }

      }

      if (statusCode != 200) {

        var containerData = {
          ContainerName: subContainers[i].name,
          ResourceGroup: subContainers[i].id.split("/")[4],
          LivenessProbe: "Failed",
          StatusCode: statusCode,
          ProvisioningState: subContainers[i].properties.provisioningState,
          DNS: subContainers[i].properties.ipAddress.fqdn,
          Message: message
        };

        totalFailing = totalFailing + 1;
        data.push(containerData);
      }
    }
  }

  return {
    "totalFailing": totalFailing,
    "totalCount": subContainers.length,
    "data": data
  };

}


function setupLivenessProbeMailCron(pattern, timeZone, EMAIL, PASSWORD, adminMail, MAIN_URL, azureObj) {

  console.log('******************************************************');
  console.log('[Info] e-mail livenessprobe cron setup!');
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

          console.log('[Info] Livenessprobe check started!');
          var accessToken = await azureClient.getAccessToken();
          var resp = await azureClient.getSubscriptionContainers(accessToken);
          var jsonResp = JSON.parse(resp);
          console.log('[Info] Livenessprobe: Total Subscription containers: ' + jsonResp.value.length);
          var probeData = await getProbeData(jsonResp);
          if (probeData.data.length > 0)
            sendLivenessProbeStatus(probeData, EMAIL, adminMail);
          else
            console.log(`[Info] All Containers are up!`);

          console.log('[Info] Livenessprobe check completed!');

        } catch (err) {
          console.log("Failed to send container liveness probe mail" + err);
        }
      },
      null,
      true,
      timeZone
    );

    console.log('[Info] Mail livenessprobe cron created!');
    job.start();
    return job;

  } catch (e) {
    console.log(`[LiveProbeSetup: Error]  Failed! ` + e);
  }

}

module.exports = {
  setupMailCron,
  setupLivenessProbeMailCron,
};
