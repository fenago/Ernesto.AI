let azureConfig = require("../../services/constantsServices/azureContantService/azureDefaultConstantService");

var WEB_AUTH_CLIENT_ID = process.env.WEB_AUTH_CLIENT_ID;
var WEB_AUTH_CLIENT_SECRET = process.env.WEB_AUTH_CLIENT_SECRET;
var TENANT_ID = process.env.TENANT_ID;
var REDIRECT_URI = process.env.REDIRECT_URI;

azureConfig.creds.clientID = WEB_AUTH_CLIENT_ID;
azureConfig.creds.clientSecret = WEB_AUTH_CLIENT_SECRET;
azureConfig.creds.identityMetadata = `https://login.microsoftonline.com/${TENANT_ID}/v2.0/.well-known/openid-configuration`;
azureConfig.destroySessionUrl = azureConfig.destroySessionUrl + REDIRECT_URI;
azureConfig.creds.redirectUrl = REDIRECT_URI + "/auth/openid/return";

module.exports = {
  azureConfig,
};
