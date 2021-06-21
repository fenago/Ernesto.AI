var fs = require("fs");
const request = require("request-promise");

function getContainerCostAnalysisJSON(
  granularity,
  ResourceId,
  timePeriodFrom,
  timePeriodTo
) {

  var costJSON = JSON.parse(
    fs.readFileSync("./backend/cost-analysis/cost_analysis_container.json", "utf8")
  );

  costJSON.dataSet.granularity = granularity;
  costJSON.timePeriod.from = timePeriodFrom;
  costJSON.timePeriod.to = timePeriodTo;
  costJSON.dataSet.filter.Dimensions["Values"] = [ResourceId];

  return costJSON;
}

function getResourceGroupsCostAnalysisJSON(
  granularity,
  timePeriodFrom,
  timePeriodTo
) {

  var costJSON = JSON.parse(
    fs.readFileSync("./backend/cost-analysis/cost_analysis_resourcegroup.json", "utf8")
  );

  costJSON.dataSet.granularity = granularity;
  costJSON.timePeriod.from = timePeriodFrom;
  costJSON.timePeriod.to = timePeriodTo;

  return costJSON;
}

function getCostAnalysisJSON(
  granularity,
  resourceGroupName,
  timePeriodFrom,
  timePeriodTo
) {

  var costJSON = JSON.parse(
    fs.readFileSync("./backend/cost-analysis/cost_analysis.json", "utf8")
  );

  costJSON.dataSet.granularity = granularity;
  costJSON.timePeriod.from = timePeriodFrom;
  costJSON.timePeriod.to = timePeriodTo;

  if (resourceGroupName != null && resourceGroupName != undefined && resourceGroupName.toLowerCase() != "all")
    costJSON.dataSet.filter.Dimensions["Values"] = [resourceGroupName];
  else
    delete costJSON.dataSet.filter;

  return costJSON;
}

async function getContainerCostAnalysis(accessToken, billingAccountId, costAnalysisapiVersion, topUsageDetails, costAnalysisJSON) {

  var address = `https://management.azure.com/providers/Microsoft.Billing/billingAccounts/${billingAccountId}/providers/Microsoft.CostManagement/query?api-version=${costAnalysisapiVersion}&$top=${topUsageDetails}`;

  var options = {
    uri: address,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: accessToken,
    },
    body: costAnalysisJSON,
    json: true,
  };

  try {
    var response = await request(options);
    return response;
  } catch (err) {
    throw {
      error: "Failed to get container cost analysis data",
      message: err.message,
    };
  }
}

async function getResourceGroupsCostAnalysis(accessToken, billingAccountId, costAnalysisapiVersion, topUsageDetails, costAnalysisJSON) {

  var address = `https://management.azure.com/providers/Microsoft.Billing/billingAccounts/${billingAccountId}/providers/Microsoft.CostManagement/query?api-version=${costAnalysisapiVersion}&$top=${topUsageDetails}`;

  var options = {
    uri: address,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: accessToken,
    },
    body: costAnalysisJSON,
    json: true,
  };

  try {
    var response = await request(options);
    return response;
  } catch (err) {
    throw {
      code: "Failed to get rg cost analysis data",
      message: err.message,
    };
  }
}

async function getCostAnalysis(accessToken, billingAccountId, costAnalysisapiVersion, topUsageDetails, costAnalysisJSON) {

  var address = `https://management.azure.com/providers/Microsoft.Billing/billingAccounts/${billingAccountId}/providers/Microsoft.CostManagement/query?api-version=${costAnalysisapiVersion}&$top=${topUsageDetails}`;

  var options = {
    uri: address,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: accessToken,
    },
    body: costAnalysisJSON,
    json: true,
  };

  try {
    var response = await request(options);
    return response;
  } catch (err) {
    throw {
      error: "Failed to get cost analysis data",
      message: err.message,
    };
  }
}



module.exports = {
  getContainerCostAnalysisJSON,
  getContainerCostAnalysis,
  getResourceGroupsCostAnalysisJSON,
  getResourceGroupsCostAnalysis,
  getCostAnalysisJSON,
  getCostAnalysis,
};
