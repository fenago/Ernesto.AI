var fs = require("fs");

function getResourceGroupTagJSON(ownerPrincipalName, tagDate) {
    var tagJSON = {
        tags: {},
    };

    tagJSON.tags["owner"] = ownerPrincipalName;
    tagJSON.tags["ownerTagDate"] = tagDate;

    return tagJSON;
}

function getContainerTagJSON(
    trainers,
    createdBy,
    createdDateTime,
    cronContainers,
    containerSize
) {
    var tagJSON = {
        tags: {},
    };

    var trainersValues = "";

    if (trainers != undefined) {
        for (i = 0, len = trainers.length; i < len; i++) {
            trainersValues += trainers[i] + ",";
        }
    }

    tagJSON.tags["allowedTrainers"] = trainersValues;
    tagJSON.tags["createdBy"] = createdBy;
    tagJSON.tags["createdDateTime"] = createdDateTime;
    tagJSON.tags["containerSize"] = containerSize;

    if (
        cronContainers.cronTimeZone != undefined &&
        cronContainers.cronValues != undefined
    ) {
        var cronCount = 1;
        tagJSON.tags["cronTimeZone"] = cronContainers.cronTimeZone;

        for (i = 0, len = cronContainers.cronValues.length; i < len; i++) {
            Object.entries(cronContainers.cronValues[i]).forEach(
                ([cronType, cronTime]) => {
                    // console.log(`${cronType} ${cronTime}`);
                    var key = cronType + "-cron" + cronCount;
                    tagJSON.tags[key] = cronTime;
                    cronCount++;
                }
            );
        }
    } else {
        console.log("Skipping cron tags: " + cronContainers);
    }

    return tagJSON;
}

function getContainerJSON(
    dockerimage,
    openPorts,
    cpuInputName,
    ramInputName,
    gpuSpecs,
    envVariables,
    region,
    dockerUrl,
    dockerUsername,
    dockerPassword
) {
    var containerJSON = JSON.parse(
        fs.readFileSync("./backend/azure/config.json", "utf8")
    );
    // containerJSON.name = containername
    // containerJSON.properties.ipAddress.dnsNameLabel = containername
    containerJSON.location = region;
    containerJSON.properties.containers[0].properties.image = dockerimage;
    containerJSON.properties.containers[0].properties.resources.requests.cpu = cpuInputName;
    containerJSON.properties.containers[0].properties.resources.requests.memoryInGB = ramInputName;
    containerJSON.properties.imageRegistryCredentials = [
        {
            "server": dockerUrl,
            "username": dockerUsername,
            "password": dockerPassword
        }
    ];

    if (gpuSpecs != null)
        containerJSON.properties.containers[0].properties.resources.requests.gpu = gpuSpecs;
    if (envVariables != null)
        containerJSON.properties.containers[0].properties.environmentVariables = containerJSON.properties.containers[0].properties.environmentVariables.concat(
            envVariables
        );

    for (i = 0, len = openPorts.length; i < len; i++) {
        containerJSON.properties.containers[0].properties.ports[i] = {
            port: openPorts[i],
        };

        containerJSON.properties.ipAddress.ports[i] = {
            protocol: "TCP",
            port: openPorts[i],
        };
    }

    return containerJSON;
}


module.exports.getContainerTagJSON = getContainerTagJSON;
module.exports.getContainerJSON = getContainerJSON;
module.exports.getResourceGroupTagJSON = getResourceGroupTagJSON;