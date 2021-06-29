var path = require("path");
var fs = require("fs");
const request = require("request-promise");
var moment = require('moment-timezone');
var ObjectID = require('mongodb').ObjectID;

var tenantId;
var subscriptionId;
var clientId;
var clientSecret;
var apiVersion;
var vmapiVersion;
var resource = "https://management.azure.com"

var cronList = [];

var CronJob = require('cron').CronJob;
var cronHistory = require("./cronhistory-vm");

var fs = require('fs');
var util = require('util');

// var log_file = fs.createWriteStream(__dirname + '/cron.log', { flags: 'w' });
var log_file = fs.createWriteStream('./logs/cron-vm.log', { flags: 'w' });

function cronLogger(message, logToConsole = true) {
    try {
        var logTime = new Date().toISOString().
            replace(/T/, ' ').      // replace T with a space
            replace(/\..+/, '')
        message = logTime + " " + message;
        log_file.write(util.format(message) + '\n');
        if (logToConsole)
            console.log(util.format(message));
        // console.log(message);

    } catch (err) {
        console.log(err);
    }

}

function createRefreshCronObject(pattern, timeZone, tenantID, subscriptionID, clientID, ClientSecret, ApiVersion, VMapiVersion) {

    cronLogger('******************************************************');
    cronLogger('[Info] VM Master cron setup!');
    cronLogger(`[Info] VM Refresh pattern: ${pattern}`);
    cronLogger(`[Note] VM Master cron will refresh VM cron details from azure using pattern: "${pattern}"`);

    try {
        tenantId = tenantID;
        subscriptionId = subscriptionID;
        clientId = clientID;
        clientSecret = ClientSecret;
        apiVersion = ApiVersion;
        vmapiVersion = VMapiVersion

        var job = new CronJob(
            pattern,
            async function () {

                cronLogger('-------------------------------------------------');

                cronLogger('[Setup] VM Cron setup started!');
                var accessToken = await getAccessToken();
                var response = await getSubscriptionVMs(accessToken);

                subscriptionVMsResp = JSON.parse(response)
                subscriptionVMsResp["subscriptionId"] = subscriptionId;

                cronLogger('[Cleanup] VM Started!');
                clearCrons();
                cronLogger('[Cleanup] VM Complete!');

                cronLogger('[Setup] Total Subscription VMs: ' + subscriptionVMsResp.value.length);
                setupCrons(subscriptionVMsResp, accessToken);
                cronLogger(`[Setup] VM Complete!`);

            },
            null,
            true,
            timeZone
        );

        cronLogger('[Info] VM Master cron created!');
        job.start();
        return job;

    } catch (e) {
        cronLogger(`[Setup: Error] Failed!`);
        cronLogger(e);
        throw e;
    }

}

function clearCrons() {
    try {
        var count = 0;
        for (x = 0; x < cronList.length; x++) {

            cronList[x].stop();
            count++;

        }
        cronList = [];

    } catch (e) {
        cronLogger(`[Cleanup: Error] VM Cron Failed!`);
        cronLogger(e);
    }

    cronLogger("[Cleanup] Total stopped Cron VM: " + count);
}

function convertTimeToCronFormat(dateTime) {

    // 2020-11-05,2020-12-05,15:01  ===> 01 15 * * *  
    // * * * * *
    // | | | | |
    // | | | | +---- Day of the Week   (range: 0-6, 0 standing for Sunday)
    // | | | +------ Month of the Year (range: 1-12)
    // | | +-------- Day of the Month  (range: 1-31)
    // | +---------- Hour              (range: 0-23)
    // +------------ Minute            (range: 0-59)

    dateTime = dateTime.split(",")
    var time = dateTime[2].split(":")
    return `${time[1]} ${time[0]} * * *`
}

function setupCrons(subscriptionVMsResp, accessToken) {

    // var count = 0;
    var subscriptionVMs = subscriptionVMsResp.value
    for (x = 0; x < subscriptionVMs.length; x++) {

        if (subscriptionVMs[x].tags != undefined) {

            var VMObj = subscriptionVMs[x];
            var vmName = VMObj.name;
            var resourceGroup = VMObj.id.split("/")[4];

            if (VMObj.tags != undefined) {

                var timeZone = VMObj.tags["cronTimeZone"];
                if (timeZone == undefined) {
                    timeZone = "America/New_York"
                }

                Object.entries(VMObj.tags).forEach(([cronType, cronTime]) => {

                    if (cronType.indexOf("-cron") > -1) {

                        cronType = cronType.substring(0, cronType.indexOf("-cron"));
                        var cronFormat = convertTimeToCronFormat(cronTime);

                        var cronOperation = createVMCronJobObject(cronFormat, timeZone, accessToken, vmName, resourceGroup, cronType, cronTime);
                        if (cronOperation != null)
                            cronList.push(cronOperation);
                    }

                });

            }

        }

    }

    cronLogger('[Setup] VM Cron count: ' + cronList.length);
    return cronList;
}

// var isDate = function (date) {
//     return (new Date(date) !== "Invalid Date") && !isNaN(new Date(date));
// }

var shouldRunCron = function (timezone, cronPattern) {
    var currentDate = moment.tz(moment(), timezone).format('YYYY-MM-DD')
    var dateRange = cronPattern.split(",")
    var from = Date.parse(dateRange[0]);
    var to = (dateRange[1] == "") ? dateRange[0] : dateRange[1];
    currentDate = Date.parse(currentDate);
    to = Date.parse(to);

    // return (currentDate.getTime() <= to.getTime() && currentDate.getTime() >= from.getTime())
    return (currentDate <= to && currentDate >= from)
}

function createVMCronJobObject(pattern, originalTimezone, accessToken, vmName, resourceGroup, operationType, originalCronPattern) {

    try {

        cronLogger(`[Add Cron] VM: ${vmName} , resourceGroup: ${resourceGroup} , operationType: ${operationType} , Timezone: ${originalTimezone} , Date: ${pattern}"`, false);
        var job = new CronJob(
            pattern,
            async function () {

                if (!shouldRunCron(originalTimezone, originalCronPattern)) {
                    cronLogger(`[Skipping Cron] VM: ${vmName} , resourceGroup: ${resourceGroup} , operationType: ${operationType} , Timezone: ${originalTimezone} , Date: ${pattern}"`, false);
                    return;
                }
                cronLogger(`[Cron Called] VM: ${vmName} , resourceGroup: ${resourceGroup} , operationType: ${operationType} , Timezone: ${originalTimezone} , Date: ${pattern}"`);
                await VMOperations(accessToken, resourceGroup, vmName, operationType, originalTimezone, originalCronPattern);

            }.bind(accessToken, resourceGroup, vmName, operationType, originalTimezone, originalCronPattern),
            null,
            true,
            originalTimezone
        );

        cronLogger(`[Success! Add Cron] VM: ${vmName} , resourceGroup: ${resourceGroup} , operationType: ${operationType} , Timezone: ${originalTimezone} , CronFormat: ${pattern}, Date: ${originalCronPattern}"`);

        job.start();
        return job;


    } catch (e) {

        cronLogger(`[Error! Add Cron] VM: ${vmName} , resourceGroup: ${resourceGroup} , operationType: ${operationType} , Timezone: ${originalTimezone} , CronFormat: ${pattern}, Date: ${originalCronPattern}"`);
        cronLogger(e);
        // throw e;
        return null;
    }

}


async function VMOperations(accessToken, resourceGroup, vmName, operationType, originalTimezone, originalCronPattern) {

    var httpMethod = (operationType == "delete") ? "DELETE" : "POST"
    var urlPostfix = (operationType == "delete") ? "" : `/${operationType}`
    var address = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Compute/virtualMachines/${vmName}${urlPostfix}?api-version=${vmapiVersion}`;

    var options = {
        method: httpMethod,
        uri: address,
        headers: {
            'Authorization': accessToken
        },
    };

    var objectId = new ObjectID();
    originalCronPattern = originalCronPattern.replace(/-/g, "/").split(",");
    var startDate = originalCronPattern[0];
    var endDate = (originalCronPattern[1] === "") ? originalCronPattern[0] : originalCronPattern[1]
    var dateRange = startDate + ' - ' + endDate;

    var history = {
        id: objectId,
        name: vmName,
        resourceGroup: resourceGroup,
        action: operationType,
        timezone: originalTimezone,
        scheduledDateRange: dateRange,
        scheduledTime: originalCronPattern[2],
        triggedDate: moment.tz(moment(), originalTimezone).format('DD/MM/YYYY HH:mm'),  //new Date().toString(),
        status: "",
    };

    try {
        var response = await request(options)
        // empty response means success (start,stop,restart)
        var message = `[${operationType}: Success] vmName: ${vmName}, resourceGroup: ${resourceGroup}`;
        cronLogger(message);

        history["status"] = "Success"
    }
    catch (err) {

        var error = (err.message != undefined) ? JSON.stringify(err.message) : JSON.stringify(err);
        var message = `[${operationType}: Error] vmName: ${vmName}, resourceGroup: ${resourceGroup}\n`;
        message = message + error;
        cronLogger(message);

        history["status"] = "Failed"
    }

    cronHistory.createCronHistory(history)
        .then((result) => {
            cronLogger("Cron History Updated Successfully: " + result);
        })
        .catch((err) => {
            cronLogger("Wrror while creating cron history: " + err);
        });

}


//  Azure Rest API Calls
//////////////////////////////////////////////////////////////////

async function getAccessToken() {

    var address = `https://login.microsoftonline.com/${tenantId}/oauth2/token`;
    let options = {
        uri: address,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: {
            "grant_type": "client_credentials",
            "client_id": clientId,
            "client_secret": clientSecret,
            "resource": resource
        }
    };

    try {
        var response = await request(options)
        var resp = JSON.parse(response);
        var accessToken = resp.token_type + " " + resp.access_token
        return accessToken;
    }
    catch (err) {
        throw err;
    }
}

async function getSubscriptionVMs(accessToken) {
    var address = `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.Compute/virtualMachines?api-version=${vmapiVersion}`;
    var options = {
        method: 'GET',
        uri: address,
        headers: {
            'Authorization': accessToken
        },
    };

    try {
        var response = await request(options)
        return response;
    }
    catch (err) {

        throw {

            error: "Failed to get subscription VM(s): " + vmName,
            message: err
        }
    }

}


async function getSubscriptionVMsTags(accessToken) {

    try {
        var cronTypes = ["start", "restart", "stop", "delete", "TimeZone"];
        var resp = await getSubscriptionVMs(accessToken);
        subscriptionVMs = JSON.parse(resp);
        var VMsTags = {};

        for (i = 0, len = subscriptionVMs.value.length; i < len; i++) {
            var VMDTO = subscriptionVMs.value[i]
            for (let key in VMDTO.tags) {

                if (new RegExp(cronTypes.join("|")).test(key)) {
                    // At least one match
                    delete VMDTO.tags[key];
                }
                var VMKey = VMDTO.name + '-' + VMDTO.id.split("/")[4]
                VMsTags[VMKey.toLowerCase()] = VMDTO.tags;
            }
        }
        return VMsTags;

    } catch (err) {

        cronLogger("Failed to get VMsTags" + err);
        throw err;
    }
}


function getCronVMTagJSON(
    existingTags,
    cronVMs
) {
    var tagsJSON = [];

    try {

        for (j = 0; j < cronVMs.virtualmachines.length; j++) {

            var VMDTO = cronVMs.virtualmachines[j];
            var VMTags = {
                tags: {},
            };

            var VMKey = VMDTO["vmName"] + '-' + VMDTO["resourceGroup"]
            //To Do
            // if (existingTags.filter(t => Object.keys(t).includes(VMKey))) {
            //     VMTags.tags = existingTags[VMKey.toLowerCase()];
            // }
            if (VMKey.toLowerCase() in existingTags)
                VMTags.tags = existingTags[VMKey.toLowerCase()];

            if (
                cronVMs.cronTimeZone != undefined &&
                cronVMs.cronValues != undefined
            ) {
                var cronCount = 1;
                VMTags.tags["cronTimeZone"] = cronVMs.cronTimeZone;

                for (i = 0, len = cronVMs.cronValues.length; i < len; i++) {
                    Object.entries(cronVMs.cronValues[i]).forEach(
                        ([cronType, cronTime]) => {
                            // console.log(`${cronType} ${cronTime}`);
                            var key = cronType + "-cron" + cronCount;
                            VMTags.tags[key] = cronTime;
                            cronCount++;
                        }
                    );
                }
            } else {
                console.log("Skipping cron tags: " + cronVMs);
            }

            tagsJSON[j] = VMTags
        }

        return tagsJSON;


    }
    catch (err) {
        throw err;
    }

}


module.exports.createRefreshCronObject = createRefreshCronObject;
module.exports.getSubscriptionVMsTags = getSubscriptionVMsTags;
module.exports.getCronVMTagJSON = getCronVMTagJSON;

module.exports.getCronHistory = cronHistory.getCronHistory;
module.exports.getCronHistoryByResourceGroup = cronHistory.getCronHistoryByResourceGroup;
module.exports.createCronHistory = cronHistory.createCronHistory;
