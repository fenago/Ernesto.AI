let azureConfig = require("./defaultCreds");

var webauth_clientId = process.env.webauth_clientId;
var webauth_clientSecret = process.env.webauth_clientSecret;
var tenantId = process.env.tenantId;
var redirectUrl = process.env.redirectUrl;

azureConfig.creds.clientID = webauth_clientId;
azureConfig.creds.clientSecret = webauth_clientSecret;
azureConfig.creds.identityMetadata = `https://login.microsoftonline.com/${tenantId}/v2.0/.well-known/openid-configuration`;
azureConfig.destroySessionUrl = azureConfig.destroySessionUrl + redirectUrl;
azureConfig.creds.redirectUrl = redirectUrl + "/auth/openid/return";

module.exports = azureConfig;
