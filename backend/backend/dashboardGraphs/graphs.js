
let azureClient;

function setupGraphClient(azureObj) {
  console.log('******************************************************');
  azureClient = azureObj;
}

////////////////////////////////////////////////////

async function getAzureContainersforDashboard(req, accessToken) {

  if (req.user.userType == "student") {
    var rGroup = req.user.resourceGroup;
    var containerGroupName = req.user.containerResourceId.split("/").pop(); // last index
    var studentContainer = {
      value: []
    };
    var resp = await azureClient.getContainer(
      accessToken,
      rGroup,
      containerGroupName
    );
    studentContainer.value.push(resp);
    containerData = studentContainer;

  } else if (req.user.userType == "admin") {
    var resp = await azureClient.getSubscriptionContainers(accessToken);
    containerData = JSON.parse(resp);
  }
  else {
    var resourceGroup = req.user.resourceGroup;
    var resp = await azureClient.getContainers(accessToken, resourceGroup);
    resp = JSON.parse(resp);
    // check access and filter container for trainer account
    if (req.user.userType == "trainer") {
      resp.value = resp.value.filter(function (containerGroup) {
        var trainer =
          containerGroup.tags.allowedTrainers != undefined
            ? containerGroup.tags.allowedTrainers.split(",")
            : {};
        var allowed = trainer.indexOf(req.user.userInfo.userPrincipalName) > -1;
        return allowed == true;
      });
    }
    containerData = resp;
  }

  return containerData;
}

function convertAzureContainerRespToGraphFormat(data, dataType) {
  var graphField;
  var containers = data.value;
  result = [];
  var processing = {};

  for (i = 0; i < containers.length; i++) {

    // Filter data based on provisioningState or Status
    if (dataType == "provisioningstate" || containers[i].properties.provisioningState === "Creating") {
      graphField = containers[i].properties.provisioningState;
    } else {
      graphField = (containers[i].properties.ipAddress.ip != undefined) ? "Running" : "Stopped";
    }

    if (processing.hasOwnProperty(graphField)) {
      processing[graphField] = processing[graphField] + 1;
    } else {
      processing[graphField] = 1;
    }
  }
  // convert data to following format:
  // chartData: [
  //  ["fieldKey", 10], 
  // ]
  var graphFormat = {
    chartData: Object.keys(processing).map((key) => [key, processing[key]])
  }
  return graphFormat;
}

async function getAzureVMsforDashboard(req, accessToken) {

  if (req.user.userType == "student") {
    var rGroup = req.user.resourceGroup;
    var vmName = req.user.vmResourceId.split("/").pop(); // last index
    var studentvm = {
      value: []
    };

    var resp = await azureClient.getVirtualMachineDetail(
      accessToken,
      rGroup,
      vmName
    );

    studentvm.value.push(resp);
    vmData = studentvm;

  } else if (req.user.userType == "admin") {
    var resp = await azureClient.getSubscriptionVM(accessToken, resourceGroup);
    vmData = resp;
  }
  else {
    var resourceGroup = req.user.resourceGroup;
    var resp = await azureClient.getVirtualMachineByResourceGroup(accessToken, resourceGroup);
    resp = JSON.parse(resp);
    // check access and filter vm for trainer account
    if (req.user.userType == "trainer") {

      resp.value = resp.value.filter(function (vmGroup) {
        var trainer =
          vmGroup.tags.allowedTrainers != undefined
            ? vmGroup.tags.allowedTrainers.split(",")
            : {};
        var allowed = trainer.indexOf(req.user.userInfo.userPrincipalName) > -1;
        return allowed == true;
      });
    }
    vmData = resp;
  }
  return vmData;
}

function convertAzureVMRespToGraphFormat(data, dataType) {
  var graphField;
  var vms = data.value;
  result = [];
  var processing = {};

  for (i = 0; i < vms.length; i++) {
    // Filter data based on provisioningState or PowerState
    if (dataType == "provisioningstate") {
      graphField = vms[i].properties.provisioningState;
    } else {
      graphField = vms[i].statuses[1].code.replace("PowerState/", "");
      graphField = graphField.charAt(0).toUpperCase() + graphField.slice(1); // Make first letter uppercase
    }

    if (processing.hasOwnProperty(graphField)) {
      processing[graphField] = processing[graphField] + 1;
    } else {
      processing[graphField] = 1;
    }
  }
  var graphFormat = {
    chartData: Object.keys(processing).map((key) => [key, processing[key]])
  }
  return graphFormat;

}

////////////////////////////////////////////////////////////////



module.exports = {
  setupGraphClient,
  getAzureContainersforDashboard,
  convertAzureContainerRespToGraphFormat,
  getAzureVMsforDashboard,
  convertAzureVMRespToGraphFormat
};
