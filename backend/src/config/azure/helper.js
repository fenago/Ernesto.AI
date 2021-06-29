const request = require("request-promise");
var generator = require('generate-password');

var subscriptionId;
var clientId;
var clientSecret;
var tenantId;
var billingAccountId;
var containerName = "labcontainer";
var resource = "https://management.azure.com";
var graphResource = "https://graph.microsoft.com";
var topUsageDetails = 300000;

var graphapiVersion = "v1.0";
var apiVersion = "2018-10-01";
var billingapiVersion = "2019-10-01";
var costAnalysisapiVersion = "2019-11-01";
var rgapiVersion = "2019-10-01";
var vmapiVersion = "2020-06-01";
var ipAdressapiVersion = "2020-07-01";
var subscriptionapiVersion = "2019-11-01";
// var domain = "@gei411gmail.onmicrosoft.com";

const regionOptions = {

  "eastus": "-eus",
  "eastus2": "-eus2",
  "westus": "-wus",
  "westus2": "-wus2",
  "centralus": "-cus",
  "canadacentral": "-cc",
  "northcentralus": "-nc",
  "westcentralus": "-wc"
}

const actionStatus = {

  "start": "started",
  "stop": "stopped",
  "restart": "restarted",
  "delete": "deleted"
}


const delay = sec => new Promise(res => setTimeout(res, sec * 1000));

//  Azure Rest API Calls
//////////////////////////////////////////////////////////////////

async function setupAzureConfig(subscriptionID, clientID, clientSec, tenantID, billingAccountID) {

  subscriptionId = subscriptionID;
  clientId = clientID;
  clientSecret = clientSec;
  tenantId = tenantID;
  billingAccountId = billingAccountID;
}

async function getAccessToken(resourceType) {
  if (resourceType == undefined || resourceType == "") resourceType = resource;

  var address = `https://login.microsoftonline.com/${tenantId}/oauth2/token`;
  let options = {
    uri: address,
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    form: {
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      resource: resourceType,
    },
  };

  try {
    var response = await request(options);
    var resp = JSON.parse(response);
    var accessToken = resp.token_type + " " + resp.access_token;
    return accessToken;
  } catch (err) {
    throw err;
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////// Containers ///////////////////////////////////////////////////////

async function getContainer(accessToken, resourceGroup, containerGroupName) {
  var address = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.ContainerInstance/containerGroups/${containerGroupName}?api-version=${apiVersion}`;
  var options = {
    method: "GET",
    uri: address,
    headers: {
      Authorization: accessToken,
    },
  };

  try {
    var response = await request(options);
    return JSON.parse(response);
  } catch (err) {
    return {
      error: "Failed to get Container(s): " + containerGroupName,
      message: err,
    };
  }
}

async function getContainers(accessToken, resourceGroup) {
  var address = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.ContainerInstance/containerGroups?api-version=${apiVersion}`;
  var options = {
    method: "GET",
    uri: address,
    headers: {
      Authorization: accessToken,
    },
  };

  try {
    var response = await request(options);
    return response;
  } catch (err) {
    return {
      error: "Failed to get resourcegroup container(s)",
      message: err,
    };
  }
}

async function getSubscriptionContainers(accessToken) {
  var address = `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.ContainerInstance/containerGroups?api-version=${apiVersion}`;
  var options = {
    method: "GET",
    uri: address,
    headers: {
      Authorization: accessToken,
    },
  };

  try {
    var response = await request(options);
    return response;
  } catch (err) {
    throw {
      error: "Failed to get subscription container(s)",
      message: err,
    };
  }
}

async function launchContainer(accessToken, resourceGroup, data) {
  var containerName = data.name;
  var address = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.ContainerInstance/containerGroups/${containerName}?api-version=${apiVersion}`;

  let options = {
    uri: address,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: accessToken,
    },
    body: data,
    json: true,
  };

  try {
    var response = await request(options);
    // var resp = JSON.parse(response);
    return response;
  } catch (err) {
    var msg = err.error.error["message"];
    if (
      msg.includes("delete it first") ||
      msg.includes("already exists") ||
      msg.includes("transitioning")
    ) {
      var resp = await getContainer(accessToken, resourceGroup, containerName);
      return resp;
    }
    throw {
      error: "Failed to provision Container: " + containerName,
      message: err.error.error,
    };
  }
}

async function launchContainers(
  accessToken,
  resourceGroup,
  containerJSON,
  containerName,
  studentPassword,
  total,
  tagJSON
) {
  var result = [];
  var total = parseInt(total);

  var createContainerpromises = [];
  var updateTagpromises = [];
  var prefix = '';

  // create containers in parallel
  for (i = 1; i <= total; i++) {

    // add region prefix in azure resource name to enable multiple region DNS from same account
    var location = containerJSON.location.toLowerCase();
    location = location.replace(/\s/g, '');
    prefix = (regionOptions[location] != undefined) ? regionOptions[location] : ""

    containerJSON.name = containerName + i + prefix;
    containerJSON.properties.ipAddress.dnsNameLabel = containerName + i;
    createContainerpromises[i - 1] = launchContainer(accessToken, resourceGroup, containerJSON);

    await delay(0.4);
  }

  result = await Promise.all(createContainerpromises)

  await delay(1);
  // tag created containers
  for (i = 1; i <= total; i++) {

    var containerGroupName = containerName + i + prefix;

    // set password as tag for student login
    if (studentPassword == undefined || studentPassword == '') {
      var randomPassword = generator.generate({
        length: 6,
        numbers: true
      });
      tagJSON.tags["studentPassword"] = randomPassword;
    }
    else {
      tagJSON.tags["studentPassword"] = studentPassword;
    }

    updateTagpromises[i - 1] = tagContainerGroup(
      accessToken,
      resourceGroup,
      containerGroupName,
      tagJSON
    );

  }
  var tagResults = await Promise.all(updateTagpromises)

  return result;
}


async function VMOperations(
  accessToken,
  resourceGroup,
  vmName,
  operationType
) {
  var httpMethod = operationType == "delete" ? "DELETE" : "POST";
  var urlPostfix = operationType == "delete" ? "" : `/${operationType}`;
  var address = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Compute/virtualMachines/${vmName}${urlPostfix}?api-version=${vmapiVersion}`;

  var options = {
    method: httpMethod,
    uri: address,
    headers: {
      Authorization: accessToken,
    },
  };

  try {
    var response = await request(options);

    // // empty response means success (start,stop,restart)
    return {
      name: vmName,
      status:
        actionStatus.operationType,
    };


  } catch (err) {
    throw {
      name: vmName,
      status: `Failed to ${operationType} VM ${err}`,
    };
  }
}

async function containerOperations(
  accessToken,
  resourceGroup,
  containerGroupName,
  operationType
) {
  var httpMethod = operationType == "delete" ? "DELETE" : "POST";
  var urlPostfix = operationType == "delete" ? "" : `/${operationType}`;
  var address = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.ContainerInstance/containerGroups/${containerGroupName}${urlPostfix}?api-version=${apiVersion}`;
  var options = {
    method: httpMethod,
    uri: address,
    headers: {
      Authorization: accessToken,
    },
  };

  try {
    var response = await request(options);

    // // empty response means success (start,stop,restart)
    return {
      name: containerGroupName,
      status:
        operationType.charAt(0).toUpperCase() + operationType.substring(1),
    };
    // if (response == "" || response.includes(containerGroupName)) {
    // }
    // return {
    // 	name: containerGroupName,
    // 	status: "Unknown status"
    // }
  } catch (err) {
    // throw {
    //   name: containerGroupName,
    //   status: `Failed to ${operationType} container ${err}`,
    // };
    err = JSON.parse(err.error);
    throw {
      message: `Failed to ${operationType} container: ${containerGroupName}`,
      error: err.error,
    };

  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////// AzureAD Users ////////////////////////////////////////////////////////

async function getUser(accessToken, id) {
  var filter =
    "?$select=id,displayName,surname,streetAddress,givenName,mobilePhone,jobTitle,officeLocation,preferredLanguage,userPrincipalName&$expand=extensions";
  var address = `https://graph.microsoft.com/${graphapiVersion}/users/${id}${filter}`;
  var options = {
    method: "GET",
    uri: address,
    headers: {
      Authorization: accessToken,
    },
  };

  try {
    var response = await request(options);
    return response;
  } catch (err) {
    throw {
      error: "Failed to get user",
      message: err,
    };
  }
}

async function getUsers(accessToken) {
  var filter =
    "?$select=id,displayName,surname,streetAddress,givenName,mobilePhone,jobTitle,officeLocation,preferredLanguage,userPrincipalName&$expand=extensions";
  var address = `https://graph.microsoft.com/${graphapiVersion}/users${filter}`;
  var options = {
    method: "GET",
    uri: address,
    headers: {
      Authorization: accessToken,
    },
  };

  try {
    var response = await request(options);
    return response;
  } catch (err) {
    return {
      error: "Failed to get user(s)",
      message: err,
    };
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////// Virtual Machines /////////////////////////////////////////////////////

async function getVirtualMachine(accessToken, resourceGroup, vmName) {

  var address = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Compute/virtualMachines/${vmName}?api-version=${vmapiVersion}`;

  var options = {
    method: "GET",
    uri: address,
    headers: {
      Authorization: accessToken,
    },
  };

  try {
    var response = await request(options);
    return response;
  } catch (err) {
    throw {
      error: "Failed to get virtual machine: " + vmName,
      message: err,
    };
  }
}


async function getVirtualMachineDetail(accessToken, resourceGroup, vmId, ipAddressId) {

  // Get IPAdress & virtualmachines
  // Add fqdn field to virtualmachine
  var ipAddressName = ipAddressId.split("/").pop();
  var vmName = vmId.split("/").pop();

  var ipAddressVM = await getpublicIPAddress(accessToken, resourceGroup, ipAddressName);

  try {

    var finalResponse = {
      "value": [
      ]
    };

    // instance view returns provisioning and power state only
    var instanceView = await getInstanceViewVM(accessToken, resourceGroup, vmName)
    var vmMetadata = await getVirtualMachine(accessToken, resourceGroup, vmName);

    let vmCompleteData = { ...JSON.parse(instanceView), ...JSON.parse(vmMetadata) };

    if (ipAddressVM != undefined && ipAddressVM[0].properties.dnsSettings != undefined && ipAddressVM[0].properties.dnsSettings.fqdn != undefined) {
      vmCompleteData.dnsName = ipAddressVM.properties.dnsSettings.fqdn;
      vmCompleteData.ipAddress = ipAddressVM.properties.ipAddress;
      vmCompleteData.publicIPAllocationMethod = ipAddressVM.properties.publicIPAllocationMethod;
      vmCompleteData.idleTimeoutInMinutes = ipAddressVM.properties.idleTimeoutInMinutes;
    } else {
      vmCompleteData.dnsName = "N/A";
      vmCompleteData.ipAddress = "N/A";
      vmCompleteData.publicIPAllocationMethod = "N/A";
      vmCompleteData.idleTimeoutInMinutes = "N/A";
    }

    finalResponse.value.push(vmCompleteData)

    return finalResponse;

  } catch (err) {
    throw {
      error: "Failed to get student virtual machines",
      message: err,
    };
  }
}

async function getVirtualMachineByResourceGroup(accessToken, resourceGroup) {

  // Get all resourcegroup IPAdresses
  // Get all resourcegroup virtualmachines
  // Add fqdn field to resourcegroup virtualmachines
  var rgIPAdresses = await getpublicIPAddressesByResourceGroup(accessToken, resourceGroup);

  var address = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Compute/virtualMachines?api-version=${vmapiVersion}`;

  var options = {
    method: "GET",
    uri: address,
    headers: {
      Authorization: accessToken,
    },
  };

  try {

    var finalResponse = {
      "value": [
      ]
    };
    var response = await request(options);
    var jsonResp = JSON.parse(response);

    for (i = 0; i < jsonResp.value.length; i++) {

      var vmData = jsonResp.value[i];
      // instance view returns provisioning and power state only
      var instanceView = await getInstanceViewVM(accessToken, vmData.id.split("/")[4], vmData.name)
      var vmMetadata = await getVirtualMachine(accessToken, vmData.id.split("/")[4], vmData.name);

      let vmCompleteData = { ...JSON.parse(instanceView), ...JSON.parse(vmMetadata) };

      // Get IPAddress object of VM using nicId 
      var nicId = vmCompleteData.properties.networkProfile.networkInterfaces[0].id;
      var ipAddressVM = rgIPAdresses.value.filter(function (ipAddress) {

        if (ipAddress.properties.ipConfiguration != undefined)
          return nicId == ipAddress.properties.ipConfiguration.id.replace("/ipConfigurations/ipconfig1", "");

      });

      if (ipAddressVM != undefined && ipAddressVM[0].properties.dnsSettings != undefined && ipAddressVM[0].properties.dnsSettings.fqdn != undefined) {
        vmCompleteData.dnsName = ipAddressVM[0].properties.dnsSettings.fqdn;
        vmCompleteData.ipAddress = ipAddressVM[0].properties.ipAddress;
        vmCompleteData.publicIPAllocationMethod = ipAddressVM[0].properties.publicIPAllocationMethod;
        vmCompleteData.idleTimeoutInMinutes = ipAddressVM[0].properties.idleTimeoutInMinutes;
      } else {
        vmCompleteData.dnsName = "N/A";
        vmCompleteData.ipAddress = "N/A";
        vmCompleteData.publicIPAllocationMethod = "N/A";
        vmCompleteData.idleTimeoutInMinutes = "N/A";
      }

      // if (ipAddressVM != undefined || ipAddressVM[0].properties.dnsSettings != undefined)
      //   vmCompleteData.dnsName = ipAddressVM[0].properties.dnsSettings.fqdn;
      // else
      //   vmCompleteData.dnsName = "N/A";

      finalResponse.value.push(vmCompleteData)
    }

    return finalResponse;

  } catch (err) {
    throw {
      error: "Failed to get resourcegroup virtual machines",
      message: err,
    };
  }
}

async function getSubscriptionVM(accessToken) {

  // Get all IPAdresses
  // Get all virtualmachines
  // Add fqdn field to virtualmachines

  var subIPAdresses = await getSubscriptionPublicIPAddresses(accessToken);

  var address = `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.Compute/virtualMachines?api-version=${vmapiVersion}`;
  var options = {
    method: "GET",
    uri: address,
    headers: {
      Authorization: accessToken,
    },
  };

  try {

    var finalResponse = {
      "value": [
      ]
    };
    var response = await request(options);
    var jsonResp = JSON.parse(response);

    for (i = 0; i < jsonResp.value.length; i++) {

      var vmData = jsonResp.value[i];
      // instance view returns provisioning and power state only
      var instanceView = await getInstanceViewVM(accessToken, vmData.id.split("/")[4], vmData.name)
      var vmMetadata = await getVirtualMachine(accessToken, vmData.id.split("/")[4], vmData.name);

      let vmCompleteData = { ...JSON.parse(instanceView), ...JSON.parse(vmMetadata) };

      // To Do:
      // vmCompleteData.dnsName = "N/A";

      // Get IPAddress object of VM using nicId 
      var nicId = vmCompleteData.properties.networkProfile.networkInterfaces[0].id;
      var ipAddressVM = subIPAdresses.value.filter(function (ipAddress) {

        if (ipAddress.properties.ipConfiguration != undefined)
          return nicId == ipAddress.properties.ipConfiguration.id.replace("/ipConfigurations/ipconfig1", "");

      });

      if (ipAddressVM != undefined && ipAddressVM[0].properties.dnsSettings != undefined && ipAddressVM[0].properties.dnsSettings.fqdn != undefined) {
        vmCompleteData.dnsName = ipAddressVM[0].properties.dnsSettings.fqdn;
        vmCompleteData.ipAddress = ipAddressVM[0].properties.ipAddress;
        vmCompleteData.publicIPAllocationMethod = ipAddressVM[0].properties.publicIPAllocationMethod;
        vmCompleteData.idleTimeoutInMinutes = ipAddressVM[0].properties.idleTimeoutInMinutes;
      }

      else {
        vmCompleteData.dnsName = "N/A";
        vmCompleteData.ipAddress = "N/A";
        vmCompleteData.publicIPAllocationMethod = "N/A";
        vmCompleteData.idleTimeoutInMinutes = "N/A";
      }

      finalResponse.value.push(vmCompleteData)
    }

    return finalResponse;

  } catch (err) {
    throw {
      error: "Failed to get subscription virtual machines",
      message: err,
    };
  }
}

async function getInstanceViewVM(accessToken,
  resourceGroup,
  VM_Name
) {
  var address = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Compute/virtualMachines/${VM_Name}/instanceView?api-version=${vmapiVersion}`;
  var options = {
    method: "GET",
    uri: address,
    headers: {
      Authorization: accessToken,
    },
  };

  try {
    var response = await request(options);
    return response;
  } catch (err) {
    throw {
      error: "Failed to get virtual machine: " + VM_Name,
      message: err,
    };
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////// PublicIP Address and NIC ////////////////////////////////////////////////

async function getNetworkInterface(accessToken, resourceGroup, nicName) {

  var address = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Network/networkInterfaces/${nicName}?api-version=${ipAdressapiVersion}`;
  var options = {
    method: "GET",
    uri: address,
    headers: {
      Authorization: accessToken,
    },
  };

  try {
    var response = await request(options);
    return JSON.parse(response);
  } catch (err) {
    throw {
      error: "Failed to get NetworkInterface: " + nicName,
      message: err,
    };
  }
}

async function getpublicIPAddress(accessToken, resourceGroup, ipAddressName) {

  var address = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Network/publicIPAddresses/${ipAddressName}?api-version=${ipAdressapiVersion}`;

  var options = {
    method: "GET",
    uri: address,
    headers: {
      Authorization: accessToken,
    },
  };

  try {
    var response = await request(options);
    return JSON.parse(response);
  } catch (err) {
    throw {
      error: "Failed to get publicIPAddress: " + ipAddressName,
      message: err,
    };
  }
}

async function getpublicIPAddressesByResourceGroup(accessToken, resourceGroup) {
  var address = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Network/publicIPAddresses?api-version=${ipAdressapiVersion}`;

  var options = {
    method: "GET",
    uri: address,
    headers: {
      Authorization: accessToken,
    },
  };

  try {

    var response = await request(options);
    var jsonResp = JSON.parse(response);
    return jsonResp;

  } catch (err) {
    throw {
      error: "Failed to get resourcegroup publicIPAddresses",
      message: err,
    };
  }
}

async function getSubscriptionPublicIPAddresses(accessToken) {
  var address = `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.Network/publicIPAddresses?api-version=${ipAdressapiVersion}`;
  var options = {
    method: "GET",
    uri: address,
    headers: {
      Authorization: accessToken,
    },
  };

  try {

    var response = await request(options);
    var jsonResp = JSON.parse(response);
    return jsonResp;

  } catch (err) {
    throw {
      error: "Failed to get subscription publicIPAddresses",
      message: err,
    };
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////// Other Azure API /////////////////////////////////////////////////////////

async function getBillingInfo(accessToken, type) {
  if (type == undefined || type.length == 0) {
    return {
      error: "invalid type",
      message: "invalid billing type: " + type,
    };
  }

  var address = `https://management.azure.com/providers/Microsoft.Billing/billingAccounts/${billingAccountId}/providers/Microsoft.Consumption/${type}?api-version=${billingapiVersion}&$top=${topUsageDetails}`;
  var options = {
    method: "GET",
    uri: address,
    headers: {
      Authorization: accessToken,
    },
  };

  try {
    var response = await request(options);
    return response;
  } catch (err) {
    throw {
      error: "Failed to get billing info: " + type,
      message: err,
    };
  }
}

async function getSubscriptions(accessToken) {
  var address = `https://management.azure.com/subscriptions?api-version=${subscriptionapiVersion}`;
  var options = {
    method: "GET",
    uri: address,
    headers: {
      Authorization: accessToken,
    },
  };

  try {
    var response = await request(options);
    return response;
  } catch (err) {
    return {
      error: "Failed to get subscription(s): " + containerName,
      message: err,
    };
  }
}

async function getResourceGroups(accessToken, subscriptionID) {
  var address = `https://management.azure.com/subscriptions/${subscriptionID}/resourcegroups?api-version=${rgapiVersion}`;
  var options = {
    method: "GET",
    uri: address,
    headers: {
      Authorization: accessToken,
    },
  };

  try {
    var response = await request(options);
    return response;
  } catch (err) {
    return {
      error: "Failed to get subscription(s): " + containerName,
      message: err,
    };
  }
}


async function tagResourceGroupOwner(accessToken, resourceGroup, requestBody) {
  var address = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}?api-version=${rgapiVersion}`;
  var options = {
    method: "PATCH",
    uri: address,
    headers: {
      Authorization: accessToken,
    },
    body: requestBody,
    json: true,
    resolveWithFullResponse: true,
  };

  try {
    var response = await request(options);
    return response.body;
  } catch (err) {
    throw {
      error: "Failed to patch resource group: " + resourceGroup,
      message: err,
    };
  }
}

async function tagVirtualMachine(
  accessToken,
  resourceGroup,
  vmName,
  requestBody
) {

  var address = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Compute/virtualMachines/${vmName}?api-version=${vmapiVersion}`;

  var options = {
    method: "PATCH",
    uri: address,
    headers: {
      Authorization: accessToken,
    },
    body: requestBody,
    json: true,
    resolveWithFullResponse: true,
  };

  try {
    var response = await request(options);
    return response.body;
  } catch (err) {
    console.log("Failed to patch virtual machine: " + vmName + "\n Error: " + err);
    throw {
      error: "Failed to patch virtual machine: " + vmName,
      message: err.error.error,
    };
  }
}

async function tagContainerGroup(
  accessToken,
  resourceGroup,
  containerGroupName,
  requestBody
) {
  var address = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.ContainerInstance/containerGroups/${containerGroupName}?api-version=${apiVersion}`;
  var options = {
    method: "PATCH",
    uri: address,
    headers: {
      Authorization: accessToken,
    },
    body: requestBody,
    json: true,
    resolveWithFullResponse: true,
  };

  try {
    var response = await request(options);
    return response.body;
  } catch (err) {
    console.log("Failed to patch container: " + containerGroupName + "\n Error: " + err);
    throw {
      error: "Failed to patch container: " + containerGroupName,
      message: err.error.error,
    };
  }
}

async function getContainerLogs(
  accessToken,
  resourceGroup,
  containerGroupName,
  tail
) {
  var address = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.ContainerInstance/containerGroups/${containerGroupName}/containers/${containerName}/logs?api-version=${apiVersion}`;
  if (tail != undefined) {
    address = address + `&tail=${tail}`;
    logger.log(address);
  }
  var options = {
    method: "GET",
    uri: address,
    headers: {
      Authorization: accessToken,
    },
  };

  try {
    var response = await request(options);
    return JSON.parse(response);
  } catch (err) {
    throw {
      error: "Failed to get container logs: " + containerName,
      message: err,
    };
  }
}

async function execContainer(accessToken, resourceGroup, data) {
  var containerGroupName = data.name;
  var address = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.ContainerInstance/containerGroups/${containerGroupName}/containers/${containerName}/exec?api-version=${apiVersion}`;

  var requestBody = {
    command: data.command,
    terminalSize: {
      rows: data.row,
      cols: data.column,
    },
  };

  let options = {
    uri: address,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: accessToken,
    },
    body: requestBody,
    json: true,
  };

  try {
    var response = await request(options);
    // var resp = JSON.parse(response);
    return response;
  } catch (err) {
    var msg = err.error.error["message"];
    if (msg.includes("")) {
    }
    throw {
      error: "Failed to exec container: " + containerGroupName,
      message: err,
    };
  }
}

// variables
module.exports.graphResource = graphResource;


// functions
module.exports.setupAzureConfig = setupAzureConfig;
module.exports.getAccessToken = getAccessToken;

module.exports.getContainer = getContainer;
module.exports.getContainers = getContainers;
module.exports.getSubscriptionContainers = getSubscriptionContainers;

module.exports.launchContainer = launchContainer;
module.exports.launchContainers = launchContainers;
module.exports.containerOperations = containerOperations;

module.exports.getUser = getUser;
module.exports.getUsers = getUsers;

module.exports.VMOperations = VMOperations;
module.exports.tagVirtualMachine = tagVirtualMachine;
module.exports.getInstanceViewVM = getInstanceViewVM;
module.exports.getVirtualMachine = getVirtualMachine;
module.exports.getVirtualMachineDetail = getVirtualMachineDetail;
module.exports.getSubscriptionVM = getSubscriptionVM;
module.exports.getVirtualMachineByResourceGroup = getVirtualMachineByResourceGroup;

module.exports.getNetworkInterface = getNetworkInterface;
module.exports.getpublicIPAddress = getpublicIPAddress;
module.exports.getpublicIPAddressesByResourceGroup = getpublicIPAddressesByResourceGroup;
module.exports.getSubscriptionPublicIPAddresses = getSubscriptionPublicIPAddresses;

module.exports.getBillingInfo = getBillingInfo;

module.exports.getSubscriptions = getSubscriptions;
module.exports.getResourceGroups = getResourceGroups;


module.exports.tagResourceGroupOwner = tagResourceGroupOwner;
module.exports.tagContainerGroup = tagContainerGroup;
module.exports.getContainerLogs = getContainerLogs;
module.exports.execContainer = execContainer;

