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
var resource = "https://management.azure.com"

var cronList = [];

var CronJob = require('cron').CronJob;
var cronHistory = require("./cronhistory");

var fs = require('fs');
var util = require('util');

// var log_file = fs.createWriteStream(__dirname + '/cron.log', { flags: 'w' });
var log_file = fs.createWriteStream('./logs/cron.log', { flags: 'w' });

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

function createRefreshCronObject(pattern, timeZone, tenantID, subscriptionID, clientID, ClientSecret, ApiVersion) {

    cronLogger('******************************************************');
    cronLogger('[Info] Master cron setup!');
    cronLogger(`[Info] Refresh pattern: ${pattern}`);
    cronLogger(`[Note] Master cron will refresh container cron details from azure using pattern: "${pattern}"`);

    try {
        tenantId = tenantID;
        subscriptionId = subscriptionID;
        clientId = clientID;
        clientSecret = ClientSecret;
        apiVersion = ApiVersion;

        var job = new CronJob(
            pattern,
            async function () {

                cronLogger('-------------------------------------------------');

                cronLogger('[Setup] Cron setup started!');
                var accessToken = await getAccessToken();
                var response = await getSubscriptionContainers(accessToken);

                subscriptionContainersResp = JSON.parse(response)
                subscriptionContainersResp["subscriptionId"] = subscriptionId;

                cronLogger('[Cleanup] Started!');
                clearCrons();
                cronLogger('[Cleanup] Complete!');

                cronLogger('[Setup] Total Subscription containers: ' + subscriptionContainersResp.value.length);
                setupCrons(subscriptionContainersResp, accessToken);
                cronLogger(`[Setup] Complete!`);

            },
            null,
            true,
            timeZone
        );

        cronLogger('[Info] Master cron created!');
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
        cronLogger(`[Cleanup: Error] Failed!`);
        cronLogger(e);
    }

    cronLogger("[Cleanup] Total stopped Cron: " + count);
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

function setupCrons(subscriptionContainersResp, accessToken) {

    // var count = 0;
    var subscriptionContainers = subscriptionContainersResp.value
    for (x = 0; x < subscriptionContainers.length; x++) {

        if (subscriptionContainers[x].tags != undefined) {

            var containerObj = subscriptionContainers[x];
            var containerName = containerObj.name;
            var resourceGroup = containerObj.id.split("/")[4];

            if (containerObj.tags != undefined) {

                var timeZone = containerObj.tags["cronTimeZone"];
                if (timeZone == undefined) {
                    timeZone = "America/New_York"
                }

                Object.entries(containerObj.tags).forEach(([cronType, cronTime]) => {

                    if (cronType.indexOf("-cron") > -1) {

                        //convert to javascript date object
                        // cronTime = new Date(cronTime);
                        // cronTime = new Date(cronTime).toLocaleString("en-US", {timeZone: timeZone})
                        // get date in specifed timezone
                        // var cronTimeUTC = isDate(cronTime) ? moment.tz(cronTime, timeZone) : cronTime;

                        cronType = cronType.substring(0, cronType.indexOf("-cron"));
                        var cronFormat = convertTimeToCronFormat(cronTime);

                        var cronOperation = createContainerCronJobObject(cronFormat, timeZone, accessToken, containerName, resourceGroup, cronType, cronTime);
                        if (cronOperation != null)
                            cronList.push(cronOperation);
                    }

                });

            }

        }

    }

    cronLogger('[Setup] Cron count: ' + cronList.length);
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

function createContainerCronJobObject(pattern, originalTimezone, accessToken, containerGroupName, resourceGroup, operationType, originalCronPattern) {

    try {

        cronLogger(`[Add Cron] ContainerGroup: ${containerGroupName} , resourceGroup: ${resourceGroup} , operationType: ${operationType} , Timezone: ${originalTimezone} , Date: ${pattern}"`, false);
        var job = new CronJob(
            pattern,
            async function () {

                if (!shouldRunCron(originalTimezone, originalCronPattern)) {
                    cronLogger(`[Skipping Cron] ContainerGroup: ${containerGroupName} , resourceGroup: ${resourceGroup} , operationType: ${operationType} , Timezone: ${originalTimezone} , Date: ${pattern}"`, false);
                    return;
                }
                cronLogger(`[Cron Called] ContainerGroup: ${containerGroupName} , resourceGroup: ${resourceGroup} , operationType: ${operationType} , Timezone: ${originalTimezone} , Date: ${pattern}"`);
                await containerOperations(accessToken, resourceGroup, containerGroupName, operationType, originalTimezone, originalCronPattern);

            }.bind(accessToken, resourceGroup, containerGroupName, operationType, originalTimezone, originalCronPattern),
            null,
            true,
            originalTimezone
        );

        cronLogger(`[Success! Add Cron] ContainerGroup: ${containerGroupName} , resourceGroup: ${resourceGroup} , operationType: ${operationType} , Timezone: ${originalTimezone} , CronFormat: ${pattern}, Date: ${originalCronPattern}"`);

        job.start();
        return job;


    } catch (e) {

        cronLogger(`[Error! Add Cron] ContainerGroup: ${containerGroupName} , resourceGroup: ${resourceGroup} , operationType: ${operationType} , Timezone: ${originalTimezone} , CronFormat: ${pattern}, Date: ${originalCronPattern}"`);
        cronLogger(e);
        // throw e;
        return null;
    }

}


async function containerOperations(accessToken, resourceGroup, containerGroupName, operationType, originalTimezone, originalCronPattern) {

    var httpMethod = (operationType == "delete") ? "DELETE" : "POST"
    var urlPostfix = (operationType == "delete") ? "" : `/${operationType}`
    var address = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.ContainerInstance/containerGroups/${containerGroupName}${urlPostfix}?api-version=${apiVersion}`;
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
        name: containerGroupName,
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
        var message = `[${operationType}: Success] containerGroupName: ${containerGroupName}, resourceGroup: ${resourceGroup}`;
        cronLogger(message);

        history["status"] = "Success"
    }
    catch (err) {

        var error = (err.message != undefined) ? JSON.stringify(err.message) : JSON.stringify(err);
        var message = `[${operationType}: Error] containerGroupName: ${containerGroupName}, resourceGroup: ${resourceGroup}\n`;
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

async function getSubscriptionContainers(accessToken) {
    var address = `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.ContainerInstance/containerGroups?api-version=${apiVersion}`;
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

            error: "Failed to get subscription container(s): " + containerName,
            message: err
        }
    }

}


async function getSubscriptionContainersTags(accessToken) {

    try {
        var cronTypes = ["start", "restart", "stop", "delete", "TimeZone"];
        var resp = await getSubscriptionContainers(accessToken);
        subscriptionContainers = JSON.parse(resp);
        var containersTags = {};

        for (i = 0, len = subscriptionContainers.value.length; i < len; i++) {
            var containerDTO = subscriptionContainers.value[i]
            for (let key in containerDTO.tags) {

                if (new RegExp(cronTypes.join("|")).test(key)) {
                    // At least one match
                    delete containerDTO.tags[key];
                }
                var containerKey = containerDTO.name + '-' + containerDTO.id.split("/")[4]
                containersTags[containerKey.toLowerCase()] = containerDTO.tags;
            }
        }
        return containersTags;

    } catch (err) {

        cronLogger("Failed to get ContainersTags" + err);
        throw err;
    }
}


function getCronContainerTagJSON(
    existingTags,
    cronContainers
) {
    var tagsJSON = [];

    try {

        for (j = 0; j < cronContainers.containers.length; j++) {

            var containerDTO = cronContainers.containers[j];
            var containerTags = {
                tags: {},
            };

            var containerKey = containerDTO["containerName"] + '-' + containerDTO["resourceGroup"]
            //To Do
            // if (existingTags.filter(t => Object.keys(t).includes(containerKey))) {
            //     containerTags.tags = existingTags[containerKey.toLowerCase()];
            // }
            if (containerKey.toLowerCase() in existingTags)
                containerTags.tags = existingTags[containerKey.toLowerCase()];

            if (
                cronContainers.cronTimeZone != undefined &&
                cronContainers.cronValues != undefined
            ) {
                var cronCount = 1;
                containerTags.tags["cronTimeZone"] = cronContainers.cronTimeZone;

                for (i = 0, len = cronContainers.cronValues.length; i < len; i++) {
                    Object.entries(cronContainers.cronValues[i]).forEach(
                        ([cronType, cronTime]) => {
                            // console.log(`${cronType} ${cronTime}`);
                            var key = cronType + "-cron" + cronCount;
                            containerTags.tags[key] = cronTime;
                            cronCount++;
                        }
                    );
                }
            } else {
                console.log("Skipping cron tags: " + cronContainers);
            }

            tagsJSON[j] = containerTags
        }

        return tagsJSON;


    }
    catch (err) {
        throw err;
    }

}


module.exports.createRefreshCronObject = createRefreshCronObject;
module.exports.getSubscriptionContainersTags = getSubscriptionContainersTags;
module.exports.getCronContainerTagJSON = getCronContainerTagJSON;

module.exports.getCronHistory = cronHistory.getCronHistory;
module.exports.getCronHistoryByResourceGroup = cronHistory.getCronHistoryByResourceGroup;
module.exports.createCronHistory = cronHistory.createCronHistory;
