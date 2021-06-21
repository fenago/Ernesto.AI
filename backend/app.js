var express = require("express");
var session = require("express-session");
var bodyParser = require("body-parser");
var path = require("path");
var fs = require("fs");
const request = require("request-promise");
const Mongoose = require("mongoose");
const BodyParser = require("body-parser");
const CronJob = require("cron").CronJob;
var serveIndex = require("serve-index");
var { isEmpty } = require("lodash");

var utils = require("./backend/utils.js");
var stripeClient = require("./backend/stripes");
var cronClient = require("./backend/cron/cron");
var cronVMClient = require("./backend/cron/cron-vm");
var azureClient = require("./backend/azure/azure");
var azureUtils = require("./backend/azure/azure_utils");
const costAnalysisClient = require("./backend/cost-analysis/cost_analysis");
const mailContainerClient = require("./backend/cronmail/mail-containers");
const mailTriveraContainerClient = require("./backend/cronmail/mail-containers-trivera");
const mailVMClient = require("./backend/cronmail/mail-virtualmachines");
const mailCostAnalysisClient = require("./backend/cronmail/mail-costanalysis");
const dashboardGraphClient = require("./backend/dashboardGraphs/graphs");

const logger = require("./backend/logger");
const {
  currentDate,
  lastWeekDate,
  currentDateTime,
  dayMinusFromTodayDate
} = require("./backend/functionUtilService");

const UsageModel = require("./models/usage");
const UserModel = require("./models/user");
const ResourceGroupModel = require("./models/resourceGroup");
const BillingHistoryModel = require("./models/billingHistory");

var expressPort = 8080;
var webauth_clientId = process.env.webauth_clientId;
var webauth_clientSecret = process.env.webauth_clientSecret;
var subscriptionId = process.env.subscriptionId || process.env.SubscriptionId;
var clientId = process.env.clientId;
var clientSecret = process.env.clientSecret;
var tenantId = process.env.tenantId;
var redirectUrl = process.env.redirectUrl;
var billingAccountId = process.env.billingAccountId;
var stripePublishableKey = process.env.stripePublishableKey;
var stripeAPIKey = process.env.stripeAPIKey;
const mongodbUrl = process.env.mongodbUrl;
const stripeProductId = process.env.stripeProductId;
const stripePriceId = process.env.stripePriceId;
const email = process.env.email;
const mailPassword = process.env.mailPassword;
const adminMail = process.env.adminMail;
// private docker image credentials
var dockerUrl = "index.docker.io";
var dockerUsername = process.env.dockerUsername;
var dockerPassword = process.env.dockerPassword;

const cronRefreshPattern =
  process.env.cronRefreshPattern != undefined
    ? process.env.cronRefreshPattern
    : "0 */5 * * * *";

const cronVMRefreshPattern =
  process.env.cronVMRefreshPattern != undefined
    ? process.env.cronVMRefreshPattern
    : "0 */15 * * * *";

const mailCronPattern =
  process.env.mailCronPattern != undefined
    ? process.env.mailCronPattern
    : "0 0 * * *";

const livenessProbeCronPattern =
  process.env.livenessProbeCronPattern != undefined
    ? process.env.livenessProbeCronPattern
    : "*/30 * * * *";

const enableBillingCron =
  process.env.enableBillingCron != undefined
    ? !(process.env.enableBillingCron == "false")
    : true;

var defaultTimeZone = "America/New_York";
var topUsageDetails = 300000;
var userTypes = ["admin", "client", "trainer", "student"];
var billingTypes = ["charges", "usageDetails"];
var validGpuSku = ["K80", "P100"];
var validGpuCount = [1, 2, 4];
var validGranularity = ["None", "Accumulated", "Daily", "Monthly"];

var graphapiVersion = "v1.0";
var apiVersion = "2018-10-01";
var billingapiVersion = "2019-10-01";
var costAnalysisapiVersion = "2019-11-01";
var rgapiVersion = "2019-10-01";
var vmapiVersion = "2020-06-01";
var subscriptionapiVersion = "2019-11-01";
var domain = "@gei411gmail.onmicrosoft.com";

var studentType = "student";
//var containerConfig = require('./backend/config.json');

logger.log("Environment!!!");
// logger.log("clientUsername: " + clientUsername)
// logger.log("resourceGroup: " + resourceGroup)
logger.log("subscriptionId: " + subscriptionId);
logger.log("clientId: " + clientId);
logger.log("tenantId: " + tenantId);
logger.log("web clientId: " + webauth_clientId);
logger.log("redirectUrl: " + redirectUrl);
logger.log("mongodbUrl: " + mongodbUrl);
logger.log("stripeProductId: " + stripeProductId);
logger.log("stripePriceId: " + stripePriceId);
logger.log("dockerUsername: " + dockerUsername);

if (
  subscriptionId == undefined ||
  clientId == undefined ||
  clientSecret == undefined ||
  tenantId == undefined ||
  billingAccountId == undefined ||
  webauth_clientId == undefined ||
  webauth_clientSecret == undefined ||
  redirectUrl == undefined ||
  stripePublishableKey == undefined ||
  stripeAPIKey == undefined ||
  mongodbUrl == undefined ||
  stripeProductId == undefined ||
  stripePriceId == undefined ||
  email == undefined ||
  mailPassword == undefined ||
  adminMail == undefined ||
  dockerUsername == undefined ||
  dockerPassword == undefined
) {
  console.log(process.env);
  console.log("subscriptionId: " + subscriptionId);
  console.log("clientId: " + clientId);
  console.log("clientSecret: " + clientSecret);
  console.log("tenantId: " + tenantId);
  console.log("web clientId: " + webauth_clientId);
  console.log("webauth_clientSecret: " + webauth_clientSecret);
  console.log("redirectUrl: " + redirectUrl);
  console.log("stripePublishableKey: " + stripePublishableKey);
  console.log("stripeAPIKey: " + stripeAPIKey);
  console.log("mongodbUrl: " + mongodbUrl);
  console.log("stripeProductId: " + stripeProductId);
  console.log("stripePriceId: " + stripePriceId);
  console.log("adminMail: " + adminMail);
  console.log("dockerUsername: " + dockerUsername);
  console.log("dockerPassword: " + dockerPassword);
  throw "Missing environment variable(s)";
}

var passport = require("passport");
var cookieParser = require("cookie-parser");
var methodOverride = require("method-override");
var config = require("./backend/config");

config.creds.clientID = webauth_clientId;
config.creds.clientSecret = webauth_clientSecret;
config.creds.identityMetadata = `https://login.microsoftonline.com/${tenantId}/v2.0/.well-known/openid-configuration`;
config.destroySessionUrl = config.destroySessionUrl + redirectUrl;
config.creds.redirectUrl = redirectUrl + "/auth/openid/return";

//setup stripe
stripeClient.setupStripe(stripeAPIKey);
//setup azure
azureClient.setupAzureConfig(
  subscriptionId,
  clientId,
  clientSecret,
  tenantId,
  billingAccountId
);

var OIDCStrategy = require("passport-azure-ad").OIDCStrategy;

/******************************************************************************
 * Set up passport in the app
 ******************************************************************************/

passport.serializeUser(function (user, done) {
  if (user.oid != undefined) {
    // serialize azureAD user
    done(null, user.oid);
  } else {
    // serialize student user
    done(null, user);
  }
});

passport.deserializeUser(function (oid, done) {
  if (oid.username != undefined) {
    // deserialize student user
    done(null, oid);
  } else {
    // deserialize azureAD user
    findByOid(oid, function (err, user) {
      done(err, user);
    });
  }
});

// array to hold logged in users
var users = [];

var findByOid = function (oid, fn) {
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
    logger.log(
      "we are using user: " + JSON.stringify(user),
      "debug",
      "users",
      false
    );
    if (user.oid === oid) {
      return fn(null, user);
    }
  }
  return fn(null, null);
};

//-----------------------------------------------------------------------------

const LocalStrategy = require("passport-local").Strategy;
// name your strategy
passport.use(
  "local",
  new LocalStrategy(async function (username, password, done) {
    console.log("username, password", username, password);

    // if (username !== 'admin') {
    //   return done(null, false, { message: 'Incorrect username.' });
    // }
    // if (password !== 'passwd') {
    //   return done(null, false, { message: 'Incorrect password.' });
    // }

    username = username
      .toLowerCase()
      .replace("https://", "")
      .replace("http://", "")
      .replace("/", "")
      .replace(/\s/g, "");

    var EnvironmentType = "";

    if (username.includes("azurecontainer.io")) {
      EnvironmentType = "container";

      // Get all containers
      // Match with username and extract container id
      try {
        var accessToken = await azureClient.getAccessToken();

        var subContainersResp = await azureClient.getSubscriptionContainers(
          accessToken
        );
        var subContainers = JSON.parse(subContainersResp);
        var studentContainerArr = subContainers.value.filter(function (
          containerData
        ) {
          if (containerData.properties.ipAddress != undefined)
            return (
              username == containerData.properties.ipAddress.fqdn.toLowerCase()
            );
        });

        var studentContainer = studentContainerArr[0];

        // DNS doesn't exist
        if (studentContainer === undefined)
          return done(null, false, {
            message: "Unknown username(container dns)"
          });
        if (
          studentContainer.tags == undefined ||
          studentContainer.tags.studentPassword == undefined ||
          studentContainer.tags.studentPassword != password
        )
          return done(null, false, { message: "Wrong / Not Found password" });

        var studentName = studentContainer.name.split("-")[0];
        var resourceGroupName = studentContainer.id.split("/")[4];
        var containerId = studentContainer.id;

        console.log("LocalStrategy OK Container");

        return done(null, {
          displayName: studentName,
          streetAddress: "student",
          givenName: resourceGroupName,
          resourceGroup: resourceGroupName,
          username: username,
          environmentType: EnvironmentType, // virtualmachine or container
          userType: "student",
          containerResourceId: containerId
        });
      } catch (err) {
        return done(null, false, { message: err });
      }
    } else if (username.includes("cloudapp.azure.com")) {
      EnvironmentType = "virtualmachine";
      try {
        var accessToken = await azureClient.getAccessToken();

        // Get all IP addresses
        // Match with username
        // extract nicName from response
        // Get relevant NIC and extract ipAddress, nic and VM id

        var subIPAdresses = await azureClient.getSubscriptionPublicIPAddresses(
          accessToken
        );

        var respIPAddress = subIPAdresses.value.filter(function (ipAddress) {
          if (ipAddress.properties.dnsSettings != undefined)
            return (
              username == ipAddress.properties.dnsSettings.fqdn.toLowerCase()
            );
        });

        var resp = undefined;
        if (respIPAddress != undefined) resp = respIPAddress[0];

        // DNS doesn't exist
        if (resp == undefined)
          return done(null, false, { message: "Unknown username(dns)" });
        if (
          resp.tags == undefined ||
          resp.tags.studentPassword == undefined ||
          resp.tags.studentPassword != password
        )
          return done(null, false, { message: "Wrong / Not Found password" });

        var nicName = resp.properties.ipConfiguration.id
          .replace("/ipConfigurations/ipconfig1", "")
          .split("/")
          .pop();
        var resourceGroupName = resp.properties.ipConfiguration.id.split(
          "/"
        )[4];
        // get NIC to get virtual machine id
        var respNIC = await azureClient.getNetworkInterface(
          accessToken,
          resourceGroupName,
          nicName
        );

        var fqdn = resp.properties.dnsSettings.fqdn; // can change, get latest fqdn when requested from frontend
        var ipAdressResourceId = resp.id;
        var studentName = respNIC.properties.virtualMachine.id.split("/").pop();
        var vmResourceId = respNIC.properties.virtualMachine.id;
        var nicResourceId = respNIC.id;

        console.log("LocalStrategy OK VM");
        return done(null, {
          displayName: studentName,
          streetAddress: "student",
          givenName: resourceGroupName,
          resourceGroup: resourceGroupName,
          username: username,
          environmentType: EnvironmentType, // virtualmachine or container
          userType: "student",
          fqdn: fqdn,
          vmResourceId: vmResourceId,
          ipAdressResourceId: ipAdressResourceId,
          nicResourceId: nicResourceId
        });
      } catch (err) {
        return done(null, false, { message: err });
      }
    } else {
      return done(null, false, { message: "Unknown username(dns)" });
    }
  })
);

//-----------------------------------------------------------------------------
// Use the OIDCStrategy within Passport.
//
// Strategies in passport require a `verify` function, which accepts credentials
// (in this case, the `oid` claim in id_token), and invoke a callback to find
// the corresponding user object.
//
// The following are the accepted prototypes for the `verify` function
// (1) function(iss, sub, done)
// (2) function(iss, sub, profile, done)
// (3) function(iss, sub, profile, access_token, refresh_token, done)
// (4) function(iss, sub, profile, access_token, refresh_token, params, done)
// (5) function(iss, sub, profile, jwtClaims, access_token, refresh_token, params, done)
// (6) prototype (1)-(5) with an additional `req` parameter as the first parameter
//
// To do prototype (6), passReqToCallback must be set to true in the config.
//-----------------------------------------------------------------------------

passport.use(
  "azuread-openidconnect",
  new OIDCStrategy(
    {
      identityMetadata: config.creds.identityMetadata,
      clientID: config.creds.clientID,
      responseType: config.creds.responseType,
      responseMode: config.creds.responseMode,
      redirectUrl: config.creds.redirectUrl,
      allowHttpForRedirectUrl: config.creds.allowHttpForRedirectUrl,
      clientSecret: config.creds.clientSecret,
      validateIssuer: config.creds.validateIssuer,
      isB2C: config.creds.isB2C,
      issuer: config.creds.issuer,
      passReqToCallback: config.creds.passReqToCallback,
      scope: config.creds.scope,
      loggingLevel: config.creds.loggingLevel,
      nonceLifetime: config.creds.nonceLifetime,
      nonceMaxAmount: config.creds.nonceMaxAmount,
      useCookieInsteadOfSession: config.creds.useCookieInsteadOfSession,
      cookieEncryptionKeys: config.creds.cookieEncryptionKeys,
      clockSkew: config.creds.clockSkew
    },
    function (iss, sub, profile, accessToken, refreshToken, done) {
      if (!profile.oid) {
        return done(new Error("No oid found"), null);
      }
      // asynchronous verification, for effect...
      process.nextTick(function () {
        findByOid(profile.oid, function (err, user) {
          if (err) {
            return done(err);
          }
          if (!user) {
            // "Auto-registration"
            users.push(profile);
            return done(null, profile);
          }
          return done(null, user);
        });
      });
    }
  )
);

var app = express();
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true
  })
);

app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb", extended: true }));
app.use(express.static(path.join(__dirname, "/public/")));
app.use(methodOverride());
app.use(cookieParser());
app.use(BodyParser.json());
app.use(
  BodyParser.urlencoded({
    extended: false
  })
);

// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());

app.use(async function (req, res, next) {
  if (req.user != undefined) {
    // check if student is loggedin
    if (req.user.userType == "student") {
      next();
      return;
    } else if (req.user.userInfo == undefined) {
      try {
        var userInfo = await getUserDetails(req.user.oid);
        req.user.userInfo = userInfo;

        //  givenName ========> resourceGroupName
        req.user.resourceGroup = userInfo.givenName;
        //  streetAddress ========> userType
        req.user.userType = userInfo.streetAddress;
      } catch (err) {
        res.send(500, {
          code: "ResourceGroupFetchFailed",
          error:
            "Failed to get Resource Group associated with this account! Please contact administrator"
        });
        return;
      }
    }
  }
  next();
});

//-----------------------------------------------------------------------------
// Set up the route controller
//
// 1. For 'login' route and 'returnURL' route, use `passport.authenticate`.
// This way the passport middleware can redirect the user to login page, receive
// id_token etc from returnURL.
//
// 2. For the routes you want to check if user is already logged in, use
// `ensureAuthenticated`. It checks if there is an user stored in session, if not
// it will call `passport.authenticate` to ask for user to log in.
//-----------------------------------------------------------------------------
function ensureAuthenticated(req, res, next) {

  if (process.env.NODE_ENV == "testing") {
    req.user = {}
    req.user.userType = process.env.testUserType || "admin";
    req.user.resourceGroup = process.env.testResourceGroup || "";
    console.log(`Testing mode: ${req.user.userType}, ${req.user.resourceGroup}`);
  }

  if (req.isAuthenticated()) {
    return next();
  }
  res.send(403, {
    error: "Forbidden! Please login again"
  });
}

function isUserTypeValid(userType, loggedinUserType) {
  return userTypes.indexOf(userType) > -1; // && loggedinUserType != "trainer" && (loggedinUserType == "client" && userType != "admin")
}

function isBillingTypeValid(userType) {
  return billingTypes.indexOf(userType) > -1;
}

function checkLoginStatus(req, res, next) {
  if (req.isAuthenticated()) {
    if (req.user.resourceGroup == undefined) {
      res.send(500, {
        code: "ResourceGroupNotFound",
        error:
          "No Resource Group associated with this account! Please contact administrator"
      });
      return;
    }

    return next();
  }
  res.redirect("/loginad");
}

app.use("/logs", express.static("logs"), serveIndex("logs", { icons: true }));

// returns logged in userinfo (using azure AD)
app.get("/stripe/stripePublishableKey", async function (req, res) {
  if (stripePublishableKey != undefined || stripePublishableKey != "") {
    res.send(200, { PublishableKey: stripePublishableKey });
    return;
  }
  res.send(500, { "Error!": "Failed to get stripe publishable key" });
});

// app.get("/cronlogs/view", function (req, res) {
//   const file = `${__dirname}/backend/cron.log`;
//   res.sendFile(file); // Set disposition and send it.
// });

// app.get("/cronlogs/download", function (req, res) {
//   const file = `${__dirname}/backend/cron.log`;
//   res.download(file); // Set disposition and send it.
// });

app.get("/logs/download/:name", function (req, res) {
  var fileName = req.params.name;

  const file = `${__dirname}/logs/${fileName}`;
  res.download(file); // Set disposition and send it.
});

app.get("/loginad", function (request, response) {
  // response.sendFile(path.join(__dirname + '/dist/html/login-ad.html'));
  response.redirect("/#/login");
});

app.get("/profile", checkLoginStatus, function (request, response) {
  // response.sendFile(path.join(__dirname + '/dist/html/profile.html'));
  response.redirect("/#/profile");
});

/////////////////////// Clients & Trainers
app.get("/trainers", function (request, response) {
  // response.sendFile(path.join(__dirname + '/dist/html/addtrainer.html'));
  response.redirect("/#/trainers");
});
app.get("/billingClient", function (request, response) {
  // response.sendFile(path.join(__dirname + '/dist/html/billingclient.html'));
  response.redirect("/#/billing/client");
});
app.get("/loginad", function (request, response) {
  response.sendFile(path.join(__dirname + "/dist/html/"));
});
app.get("/loginad", function (request, response) {
  response.sendFile(path.join(__dirname + "/dist/html/"));
});

////////////////////// Admin
app.get("/clients", checkLoginStatus, function (request, response) {
  response.sendFile(path.join(__dirname + "/dist/html/adduser.html"));
});
app.get("/billinginfo", checkLoginStatus, function (request, response) {
  response.sendFile(path.join(__dirname + "/dist/html/billingadmin.html"));
});
/////////////////////////////

app.get("/", checkLoginStatus, function (req, res) {
  //   res.render('index', { user: req.user });
  res.redirect("/home");
});

// '/account' is only available to logged in user
app.get("/account", ensureAuthenticated, function (req, res) {
  res.render("account", { user: req.user });
});

app.get(
  "/login",
  function (req, res, next) {
    passport.authenticate("azuread-openidconnect", {
      response: res, // required
      failureRedirect: "/"
    })(req, res, next);
  },
  function (req, res) {
    logger.log("Login was called in the Sample");
    res.redirect("/home");
  }
);

app.post(
  "/student/login",
  passport.authenticate("local", {
    successReturnToOrRedirect: "/student/home",
    failureRedirect: "/student/loginfailure"
  })
);

app.get("/student/loginfailure", function (req, res) {
  res.send(401, { message: "Invalid username or password" });
});

// 'GET returnURL'
// `passport.authenticate` will try to authenticate the content returned in
// query (such as authorization code). If authentication fails, user will be
// redirected to '/' (home page); otherwise, it passes to the next middleware.
app.get(
  "/auth/openid/return",
  function (req, res, next) {
    passport.authenticate("azuread-openidconnect", {
      response: res, // required
      failureRedirect: "/"
    })(req, res, next);
  },
  function (req, res) {
    logger.log("We received a return from AzureAD.");
    res.redirect("/");
  }
);

// 'POST returnURL'
// `passport.authenticate` will try to authenticate the content returned in
// body (such as authorization code). If authentication fails, user will be
// redirected to '/' (home page); otherwise, it passes to the next middleware.
app.post(
  "/auth/openid/return",
  function (req, res, next) {
    passport.authenticate("azuread-openidconnect", {
      response: res, // required
      failureRedirect: "/"
    })(req, res, next);
  },
  function (req, res) {
    logger.log("We received a return from AzureAD.");
    res.redirect("/home");
  }
);

// 'logout' route, logout from passport, and destroy the session with AAD.
app.get("/logout", function (req, res) {
  req.session.destroy(function (err) {
    req.logOut();
    res.redirect(config.destroySessionUrl);
  });
});

////////////////////////////////////////

// app.get('/', function (request, response) {
// 	response.sendFile(path.join(__dirname + '/login.html'));
// });

// app.post('/auth', function (request, response) {
// 	var username = request.body.username;
// 	var password = request.body.password;
// 	if (username && password) {
// 		if (username == clientUsername && password == clientPassword) {
// 			request.session.loggedin = true;
// 			request.session.username = username;
// 			response.redirect('/home');
// 		} else {
// 			response.send('Incorrect Username and/or Password!');
// 		}
// 		response.end();
// 	} else {
// 		response.send('Please enter Username and Password!');
// 		response.end();
// 	}
// });

app.get("/home", checkLoginStatus, function (request, response) {
  // response.sendFile(path.join(__dirname + '/public/index.html'));
  response.redirect("/#/home/dashboard/");
});

app.get("/student/home", checkLoginStatus, function (request, response) {
  if (request.user.environmentType == "container")
    response.redirect("/#/home/lab_env/");
  else if (request.user.environmentType == "virtualmachine")
    response.redirect("/#/home/virtual_machine/");
  else response.redirect("/home");
});

app.get("/containers/:name/logs", ensureAuthenticated, async function (
  req,
  res
) {
  var containerGroupName = req.params.name;
  var resourceGroup = req.query.resourceGroup;
  var tail = req.query.tail;

  try {
    var accessToken = await azureClient.getAccessToken();
  } catch (err) {
    logger.log("Failed to get accessToken", "error", "accesstoken", true);
    res.send(500, err.error);
    return;
  }

  try {
    var resp = await azureClient.getContainerLogs(
      accessToken,
      resourceGroup,
      containerGroupName,
      tail
    );
    res.send(resp);
  } catch (err) {
    logger.log("Failed to get container logs" + err);
    if (typeof err == "string") {
      res.send(500, { error: err });
    }

    res.send(500, { error: err.message.error });
  }
});

// returns logged in userinfo (using azure AD)
app.get("/userinfo", ensureAuthenticated, async function (req, res) {
  // directly return info for student user (non azureAD user)
  if (req.user.userType == studentType) {
    res.send(200, req.user);
    return;
  }

  var userid = req.user.oid;

  try {
    var accessToken = await azureClient.getAccessToken(
      azureClient.graphResource
    );
  } catch (err) {
    logger.log("Failed to get accessToken", "error", "accesstoken", true);
    res.send(500, err.error);
    return;
  }

  try {
    var resp = await azureClient.getUser(accessToken, userid);
    res.send(resp);
  } catch (err) {
    logger.log("Failed to get users" + err);
    if (typeof err == "string") {
      res.send(500, { error: err });
    }

    res.send(500, err.error);
  }
});

// returns all users (using azure AD)
app.get("/users", ensureAuthenticated, async function (req, res) {
  try {
    var accessToken = await azureClient.getAccessToken(
      azureClient.graphResource
    );
  } catch (err) {
    logger.log("Failed to get accessToken", "error", "accesstoken", true);
    res.send(500, err.error);
    return;
  }

  try {
    var resp = await azureClient.getUsers(accessToken);

    // only show related users for client account
    if (req.user.userType == "client") {
      resp = JSON.parse(resp);
      resp.value = resp.value.filter(function (user) {
        return user.givenName == req.user.resourceGroup;
      });
    }

    res.send(resp);
  } catch (err) {
    logger.log("Failed to get users(s)" + err);
    if (typeof err == "string") {
      res.send(500, { error: err });
    }

    res.send(500, err.error);
  }
});

// returns trainers for specfic client (using azure AD)
app.get("/trainersInfo", ensureAuthenticated, async function (req, res) {
  try {
    var accessToken = await azureClient.getAccessToken(
      azureClient.graphResource
    );
  } catch (err) {
    logger.log("Failed to get accessToken", "error", "accesstoken", true);
    res.send(500, err.error);
    return;
  }

  try {
    var resp = await azureClient.getUsers(accessToken);
    resp = JSON.parse(resp);
    resp.value = resp.value.filter(function (user) {
      return (
        user.givenName == req.user.resourceGroup &&
        user.streetAddress == "trainer"
      );
    });
    res.send(resp);
  } catch (err) {
    logger.log("Failed to get users(s)" + err);
    if (typeof err == "string") {
      res.send(500, { error: err });
    }

    res.send(500, err.error);
  }
});

app.get("/containers", ensureAuthenticated, async function (req, res) {
  var resourceGroup = req.user.resourceGroup;
  try {
    var accessToken = await azureClient.getAccessToken();
  } catch (err) {
    logger.log("Failed to get accessToken", "error", "accesstoken", true);
    res.send(500, err.error);
    return;
  }

  try {
    var resp = await azureClient.getContainers(accessToken, resourceGroup);

    // check access and filter container for trainer account
    if (req.user.userType == "trainer") {
      resp = JSON.parse(resp);
      resp.value = resp.value.filter(function (containerGroup) {
        var trainer =
          containerGroup.tags.allowedTrainers != undefined
            ? containerGroup.tags.allowedTrainers.split(",")
            : {};
        var allowed = trainer.indexOf(req.user.userInfo.userPrincipalName) > -1;
        return allowed == true;
      });
    }

    res.send(resp);
  } catch (err) {
    logger.log("Failed to get Container(s)" + err);
    if (typeof err == "string") {
      res.send(500, { error: err });
    }

    res.send(500, err.error);
  }
});

app.get("/subscriptions/containers", ensureAuthenticated, async function (
  req,
  res
) {
  try {
    var accessToken = await azureClient.getAccessToken();
  } catch (err) {
    logger.log("Failed to get accessToken", "error", "accesstoken", true);
    res.send(500, err.error);
    return;
  }

  try {
    var resp = await azureClient.getSubscriptionContainers(accessToken);

    resp = JSON.parse(resp);
    resp["subscriptionId"] = subscriptionId;

    res.send(resp);
  } catch (err) {
    logger.log("Failed to get subscription container(s)" + err);
    if (typeof err == "string") {
      res.send(500, { error: err });
    }

    res.send(500, err.message);
  }
});

app.get("/student/containers", ensureAuthenticated, async function (req, res) {
  var resourceGroup = req.user.resourceGroup;
  var containerGroupName = req.user.containerResourceId.split("/").pop(); // last index

  try {
    var accessToken = await azureClient.getAccessToken();
  } catch (err) {
    logger.log("Failed to get accessToken", "error", "accesstoken", true);
    res.send(500, err.error);
    return;
  }

  try {
    var finalResponse = {
      value: []
    };

    var resp = await azureClient.getContainer(
      accessToken,
      resourceGroup,
      containerGroupName
    );

    finalResponse.value.push(resp);
    res.send(finalResponse);
  } catch (err) {
    logger.log("Failed to get student container" + err);
    if (typeof err == "string") {
      res.send(500, { error: err });
    }

    res.send(500, err.message);
  }
});

app.get("/student/virtualmachines", ensureAuthenticated, async function (
  req,
  res
) {
  var resourceGroup = req.user.resourceGroup;
  var vmId = req.user.vmResourceId;
  var ipAdressResourceId = req.user.ipAdressResourceId;

  try {
    var accessToken = await azureClient.getAccessToken();
  } catch (err) {
    logger.log("Failed to get accessToken", "error", "accesstoken", true);
    res.send(500, err.error);
    return;
  }

  try {
    var resp = await azureClient.getVirtualMachineDetail(
      accessToken,
      resourceGroup,
      vmId,
      ipAdressResourceId
    );
    res.send(resp);
  } catch (err) {
    logger.log("Failed to get student virtual machines" + err);
    if (typeof err == "string") {
      res.send(500, { error: err });
    }

    res.send(500, err.error);
  }
});

app.get("/virtualmachines", ensureAuthenticated, async function (req, res) {
  var resourceGroup = req.user.resourceGroup;
  try {
    var accessToken = await azureClient.getAccessToken();
  } catch (err) {
    logger.log("Failed to get accessToken", "error", "accesstoken", true);
    res.send(500, err.error);
    return;
  }

  try {
    var resp = await azureClient.getVirtualMachineByResourceGroup(
      accessToken,
      resourceGroup
    );

    // check access and filter for trainer account
    // if (req.user.userType == "trainer") {
    //   resp = JSON.parse(resp);
    //   resp.value = resp.value.filter(function (containerGroup) {
    //     var trainer =
    //       containerGroup.tags.allowedTrainers != undefined
    //         ? containerGroup.tags.allowedTrainers.split(",")
    //         : {};
    //     var allowed = trainer.hasOwnProperty(
    //       req.user.userInfo.userPrincipalName
    //     );
    //     return allowed == true;
    //   });
    // }

    res.send(resp);
  } catch (err) {
    logger.log("Failed to get virtual machines(s)" + err);
    if (typeof err == "string") {
      res.send(500, { error: err });
    }

    res.send(500, err.error);
  }
});

app.get("/subscriptions/virtualmachines", ensureAuthenticated, async function (
  req,
  res
) {
  try {
    var accessToken = await azureClient.getAccessToken();
  } catch (err) {
    logger.log("Failed to get accessToken", "error", "accesstoken", true);
    res.send(500, err.error);
    return;
  }

  try {
    var resp = await azureClient.getSubscriptionVM(accessToken);

    // resp = JSON.parse(resp);
    resp["subscriptionId"] = subscriptionId;

    res.send(resp);
  } catch (err) {
    logger.log("Failed to get subscription virtual machines(s)" + err);
    if (typeof err == "string") {
      res.send(500, { error: err });
    }

    res.send(500, err.message);
  }
});

app.post("/cost-analysis/azure/resource", ensureAuthenticated, async function (
  req,
  res
) {
  var granularity =
    req.body.granularity == undefined ? "None" : req.body.granularity;
  var timePeriodFrom =
    req.body.timePeriodFrom == undefined
      ? "2020-01-01T00:00:00+00:00"
      : req.body.timePeriodFrom;
  var timePeriodTo =
    req.body.timePeriodTo == undefined ? new Date() : req.body.timePeriodTo;
  // ResourceId should be in following format
  // /subscriptions/4d0d792e-7155-424c-8492-2afec7dcfd0e/resourcegroups/containers/providers/microsoft.containerinstance/containergroups/ernestodotnetdemo
  var ResourceId = req.body.ResourceId;

  if (ResourceId == undefined) {
    res.send(400, { error: "Invalid ResourceId" });
    return;
  }

  try {
    var accessToken = await azureClient.getAccessToken();
  } catch (err) {
    logger.log("Failed to get accessToken", "error", "accesstoken", true);
    res.send(500, err.error);
    return;
  }

  try {
    logger.log("Calling getContainerCostAnalysis", "debug", "billing", false);

    var costAnalysisJSON = costAnalysisClient.getContainerCostAnalysisJSON(
      granularity,
      ResourceId,
      timePeriodFrom,
      timePeriodTo
    );
    var resp = await costAnalysisClient.getContainerCostAnalysis(
      accessToken,
      billingAccountId,
      costAnalysisapiVersion,
      topUsageDetails,
      costAnalysisJSON
    );
    res.send(resp);

    logger.log(
      "Response /cost-analysis/azure/resource  200",
      "info",
      "billing",
      true
    );
  } catch (err) {
    logger.log(
      "Failed to get container cost analysis data" + err,
      "error",
      "billing",
      true
    );
    if (typeof err == "string") {
      res.send(500, { error: err });
    }

    res.send(500, err.error);
  }
});

app.post("/cost-analysis", ensureAuthenticated, async function (req, res) {
  // only admin is allowed to send resourcegroup name (optional), "all" to get data for all rg.
  var resourceGroup = req.query.resourcegroup;
  var granularity = req.body.granularity;
  var timePeriodFrom = req.body.timePeriodFrom;
  var timePeriodTo = req.body.timePeriodTo;

  if (!utils.isValid(validGranularity, granularity)) {
    res.send(400, { error: "Invalid granularity" });
    return;
  }

  if (
    req.user.userType != "admin" &&
    (typeof resourceGroup === "string" || resourceGroup instanceof String)
  ) {
    res.send(403, {
      error: "Forbidden! Only admin can access cost analysis api"
    });
    return;
  }

  // get data for client's resource group only
  if (req.user.userType != "admin") {
    resourceGroup = req.user.resourceGroup;
  }

  try {
    var accessToken = await azureClient.getAccessToken();
  } catch (err) {
    logger.log("Failed to get accessToken", "error", "accesstoken", true);
    res.send(500, err.error);
    return;
  }

  try {
    logger.log("Calling getCostAnalysis", "debug", "billing", false);

    var costAnalysisJSON = costAnalysisClient.getCostAnalysisJSON(
      granularity,
      resourceGroup,
      timePeriodFrom,
      timePeriodTo
    );
    var resp = await costAnalysisClient.getCostAnalysis(
      accessToken,
      billingAccountId,
      costAnalysisapiVersion,
      topUsageDetails,
      costAnalysisJSON
    );
    res.send(resp);

    logger.log("Response /cost-analysis  200", "info", "billing", true);
  } catch (err) {
    logger.log(
      "Failed to get cost analysis data" + err,
      "error",
      "billing",
      true
    );
    if (typeof err == "string") {
      res.send(500, { error: err });
    }

    res.send(500, err.error);
  }
});

app.get("/billing", ensureAuthenticated, async function (req, res) {
  // charges : get azure bills , usageDetails : get resource usage
  var type = req.query.type;
  if (!isBillingTypeValid(type)) {
    res.send(400, { error: "Invalid billing type" });
    return;
  }

  try {
    var accessToken = await azureClient.getAccessToken();
  } catch (err) {
    logger.log("Failed to get accessToken", "error", "accesstoken", true);
    res.send(500, err.error);
    return;
  }

  try {
    var resp = await azureClient.getBillingInfo(accessToken, type);
    res.send(resp);
  } catch (err) {
    logger.log("Failed to get billing info" + err);
    if (typeof err == "string") {
      res.send(500, { error: err });
    }

    res.send(500, err.error);
  }
});

//cost management testing api
app.get("/billing/filters", async function (req, res) {
  try {
    var accessToken = await azureClient.getAccessToken();
  } catch (err) {
    logger.log("Failed to get accessToken", "error", "accesstoken", true);
    res.send(500, err.error);
    return;
  }

  try {
    var resp = await getBillingInfoByFilters(accessToken);
    res.send(resp);
  } catch (err) {
    logger.log("Failed to get billing info" + err);
    if (typeof err == "string") {
      res.send(500, { error: err });
    }

    res.send(500, err.error);
  }
});

app.post("/containers/:name/exec", ensureAuthenticated, async function (
  req,
  res
) {
  var resourceGroup = req.user.resourceGroup;
  var containerGroupName = req.params.name;
  var command = req.body.command;
  var rowSize = req.body.row == undefined ? 30 : req.body.row;
  var columnSize = req.body.column == undefined ? 30 : req.body.column;

  if (command == undefined) {
    res.send(400, { error: "Command not found in request body" });
    return;
  }

  var data = {
    name: containerGroupName,
    row: parseInt(rowSize),
    column: parseInt(columnSize),
    command: command
  };

  try {
    var accessToken = await azureClient.getAccessToken();
  } catch (err) {
    logger.log("Failed to get accessToken", "error", "accesstoken", true);
    res.send(500, err.error);
    return;
  }

  try {
    var resp = await azureClient.execContainer(
      accessToken,
      resourceGroup,
      data
    );
    res.send(resp);
  } catch (err) {
    logger.log("Failed to execute command" + err);
    if (typeof err == "string") {
      res.send(500, { error: err });
    }

    res.send(500, { error: err.message.error.error.message });
  }
});

app.post("/signup", async function (req, res) {
  var displayName = req.body.displayName;
  var mail = "";
  var mobilePhone = req.body.mobilePhone;
  var jobTitle = req.body.company;
  var officeLocation = req.body.officeLocation;
  var userPrincipalName = req.body.userPrincipalName + domain;
  var mailNickname = req.body.userPrincipalName;
  var password = req.body.password;
  var preferredLanguage = req.body.preferredLanguage;
  var userType = "client";
  var rgName = req.body.userPrincipalName;
  var passwordChangeFirstTime = req.body.pcSelector == "true" ? true : false;

  if (req.body.userPrincipalName == undefined) {
    res.send(400, { error: "Invalid Username" });
    return;
  }

  try {
    var accessToken = await azureClient.getAccessToken();
    var accessTokenGraph = await azureClient.getAccessToken(
      azureClient.graphResource
    );
  } catch (err) {
    logger.log("Failed to get accessToken", "error", "accesstoken", true);
    res.send(500, err.error);
    return;
  }

  try {
    rgResp = await createorUpdateResourceGroup(
      accessToken,
      subscriptionId,
      rgName,
      userPrincipalName
    );

    if (rgResp.status == "Exists") {
      res.send(400, { error: "Username not available" });
      return;
    }

    if (rgResp.status == "Created") {
      await getResourceGroupsFromDB()
        .then((rgs) => {
          const resourceGroupsFromDb = [...rgs];
          const defaultMultiplier = resourceGroupsFromDb.find(
            (rg) => rg.name === "default"
          );
          let payload = {
            body: {
              name: rgName,
              multiplier: defaultMultiplier.multiplier
            }
          };
          createResourceGroup(payload)
            .then(() => logger.log("new resource group added in db"))
            .catch((err) => logger.log(err));
        })
        .catch((err) => logger.log(err));
    }

    var stripeCustomerId = "";
    var stripeCustomerResp = {};

    stripeCustomerResp = await stripeClient.createStripeCustomer(
      userPrincipalName,
      userPrincipalName,
      mobilePhone,
      officeLocation
    );

    if (stripeCustomerResp.value == undefined) {
      res.send(500, stripeCustomerResp);
      logger.log("Error while creating stripe customer");
      return;
    }

    stripeCustomerId = stripeCustomerResp.value.id;

    //we don't use this model now
    // var stripeSubscriptionId = "";
    // var stripeSubscriptionResp = {};

    // stripeSubscriptionResp = await stripeClient.createSubscription(
    //   stripeCustomerId,
    //   stripePriceId
    // );

    // if (
    //   stripeSubscriptionResp.value == undefined ||
    //   stripeSubscriptionResp.value == ""
    // ) {
    //   logger.log('')
    //   res.send(500, stripeSubscriptionResp);
    //   return;
    // }

    // stripeSubscriptionId = stripeSubscriptionResp.value.items.data[0].id;

    var userInfo = getADUserJSON(
      displayName,
      mailNickname,
      userPrincipalName,
      jobTitle,
      rgName,
      mail,
      mobilePhone,
      officeLocation,
      preferredLanguage,
      password,
      passwordChangeFirstTime,
      stripeCustomerId,
      // stripeSubscriptionId,
      userType
    );

    userResp = await creatAzureADUser(accessTokenGraph, userInfo);

    var response = [];

    if (userResp.status == "Created") {
      response = [rgResp, userResp, stripeCustomerResp];
    } else {
      res.send(400, { error: "Username not available" });
      return;
    }

    res.send(response);
  } catch (err) {
    logger.log("Failed to register client " + err);
    if (typeof err == "string") {
      res.send(500, { error: err });
    }

    res.send(500, err);
  }
});

app.post("/register", ensureAuthenticated, async function (req, res) {
  var displayName = req.body.displayName;
  // var surname = req.body.surname;
  var mail = req.body.mail;
  var mobilePhone = req.body.mobilePhone;
  var jobTitle = req.body.company;
  var officeLocation = req.body.officeLocation;
  var userPrincipalName = req.body.userPrincipalName + domain;
  var mailNickname = req.body.userPrincipalName;
  var password = req.body.password;
  var preferredLanguage = req.body.preferredLanguage;
  var userType = req.body.userType;

  var rgName = "";

  if (req.user.userType == "admin")
    rgName =
      req.body.rgSelector == "existingResourceGroup"
        ? req.body.rgNames
        : req.body.rgName;
  else rgName = req.user.resourceGroup;

  var passwordChangeFirstTime = req.body.pcSelector == "true" ? true : false;

  if (rgName == undefined) {
    res.send(400, { error: "Invalid resource group" });
    return;
  }

  if (!isUserTypeValid(userType, req.user.userType)) {
    res.send(400, {
      error: "Invalid user type/ Not enough permissions to create this userType"
    });
    return;
  }

  // if (userPrincipalName.length < 5) {
  // 	res.send(400, { error: "User account name should be greater than 5 characters" });
  // 	return;
  // }

  try {
    var accessToken = await azureClient.getAccessToken();
    var accessTokenGraph = await azureClient.getAccessToken(
      azureClient.graphResource
    );
  } catch (err) {
    logger.log("Failed to get accessToken", "error", "accesstoken", true);
    res.send(500, err.error);
    return;
  }

  try {
    // Don't create resource group if trainer account is being created
    if (userType != "trainer") {
      rgResp = await createorUpdateResourceGroup(
        accessToken,
        subscriptionId,
        rgName,
        userPrincipalName
      );

      if (rgResp.status == "Exists") {
        res.send(400, { error: "Username not available" });
        return;
      }

      if (rgResp.status == "Created") {
        await getResourceGroupsFromDB()
          .then((rgs) => {
            const resourceGroupsFromDb = [...rgs];
            const defaultMultiplier = resourceGroupsFromDb.find(
              (rg) => rg.name === "default"
            );
            let payload = {
              body: {
                name: rgName,
                multiplier: defaultMultiplier.multiplier
              }
            };
            createResourceGroup(payload)
              .then(() => logger.log("new resource group added in db"))
              .catch((err) => logger.log(err));
          })
          .catch((err) => logger.log(err));
      }
    } else {
      rgResp = utils.registerJSONresponse("ResourceGroup", "NotRequired");
    }

    var stripeCustomerId = "";
    var stripeCustomerResp = utils.registerJSONresponse(
      "StripeCustomer",
      "NotCreated"
    );

    // only create stripe account for client accounts
    // if (userType == "client") {
    // }
    stripeCustomerResp = await stripeClient.createStripeCustomer(
      userPrincipalName,
      userPrincipalName,
      mobilePhone,
      officeLocation
    );

    if (stripeCustomerResp.value == undefined) {
      res.send(500, stripeCustomerResp);
      return;
    }

    stripeCustomerId = stripeCustomerResp.value.id;

    // we don't use this model now.
    // var stripeSubscriptionId = "";
    // var stripeSubscriptionResp = {};

    // //to run following commented code, we need plan id
    // stripeSubscriptionResp = await stripeClient.createSubscription(
    //   stripeCustomerId,
    //   stripePriceId
    // );

    // if (
    //   stripeSubscriptionResp.value == undefined ||
    //   stripeSubscriptionResp.value == ""
    // ) {
    //   res.send(500, stripeSubscriptionResp);
    //   return;
    // }

    // stripeSubscriptionId = stripeSubscriptionResp.value.items.data[0].id;

    var userInfo = getADUserJSON(
      displayName,
      mailNickname,
      userPrincipalName,
      jobTitle,
      rgName,
      mail,
      mobilePhone,
      officeLocation,
      preferredLanguage,
      password,
      passwordChangeFirstTime,
      stripeCustomerId,
      // stripeSubscriptionId,
      userType
    );

    userResp = await creatAzureADUser(accessTokenGraph, userInfo);

    var response = [];

    if (userResp.status == "Created") {
      response = [rgResp, userResp, stripeCustomerResp];
    } else {
      response = [userResp];
    }

    res.send(response);
  } catch (err) {
    logger.log("Failed to register client " + err);
    if (typeof err == "string") {
      res.send(500, { error: err });
    }

    res.send(500, err);
  }
});

function isGpuSpecsValid(GpuSku, GpuCount) {
  return (
    validGpuSku.indexOf(GpuSku) > -1 && validGpuCount.indexOf(GpuCount) > -1
  );
}

app.post("/containers", ensureAuthenticated, async function (req, res) {
  var containerName = req.body.containername;
  var ports = req.body.ports.split(",");
  var cpuInputName = req.body.cpuInputName;
  var ramInputName = req.body.ramInputName;
  var region = req.body.region;
  var total = req.body.totalInputName;
  var trainers =
    req.user.userType == "trainer"
      ? [req.user.userInfo.userPrincipalName]
      : req.body.selectTrainers;
  var containerSize = req.body.containerSize;
  var GpuSku = req.body.GpuSku;
  var GpuCount = req.body.GpuCount;
  var studentPassword =
    req.body.studentPassword == undefined || req.body.studentPassword === ""
      ? ""
      : req.body.studentPassword;

  var resourceGroup = req.user.resourceGroup;

  // Example
  var envVariables = [
    { name: "key1", value: "value1" },
    { name: "key2", value: "value2" }
  ];

  // Example
  // timezone https://momentjs.com/timezone/
  // Supported timezones: America/Los_Angeles, America/New_York and so on
  // var cronContainers = {
  //   "cronTimeZone": "America/New_York",
  //   "cronValues": [
  //     {
  //       "start": "startDate,endDate,Time"
  //     },
  //     {
  //       "restart": startDate,endDate,Time"
  //     }
  //   ]
  // }
  // uncomment next line to use actual env
  //var envVariables = req.body.envVariables;
  var cronContainers = req.body.cronContainers;

  var gpuSpecs = {};
  if (isGpuSpecsValid(GpuSku, GpuCount)) {
    gpuSpecs = {
      count: GpuCount,
      sku: GpuSku
    };
  } else if (GpuSku == undefined || GpuSku.toLowerCase() == "none") {
    gpuSpecs = null;
  } else {
    res.send(400, {
      error: "Invalid gpu specs"
    });
  }

  var dockerimage =
    req.body.imageSelector == "defaultimage"
      ? req.body.dockerimage
      : req.body.customimagename;

  //remove spaces
  dockerimage = dockerimage.replace(/\s/g, "");
  if (dockerimage == undefined || dockerimage == "") {
    res.send(400, { error: "Invalid docker image" });
    return;
  }

  if (containerName.length < 5) {
    res.send(400, {
      code: "InvalidDNS",
      message: "DNS should be longer than 5 characters"
    });
    return;
  }

  try {
    var accessToken = await azureClient.getAccessToken();
  } catch (err) {
    logger.log("Failed to get accessToken", "error", "accesstoken", true);
    res.send(500, err.error);
    return;
  }

  try {
    containerJSON = azureUtils.getContainerJSON(
      dockerimage,
      ports,
      cpuInputName,
      ramInputName,
      gpuSpecs,
      envVariables,
      region,
      dockerUrl,
      dockerUsername,
      dockerPassword
    );

    var createdBy = req.user.userInfo.displayName; //req.user.userInfo.userPrincipalName;
    var createdDateTime = new Date().toUTCString();

    tagJSON = azureUtils.getContainerTagJSON(
      trainers,
      createdBy,
      createdDateTime,
      cronContainers,
      containerSize
    );

    var resp = await azureClient.launchContainers(
      accessToken,
      resourceGroup,
      containerJSON,
      containerName,
      studentPassword,
      total,
      tagJSON
    );
    res.send(resp);
  } catch (err) {
    logger.log("Failed to launch Container(s)" + err);
    if (typeof err == "string") {
      res.send(500, { error: err });
    }

    res.send(500, err.message);
  }
});

// Virtual machines: start, restart, stop, delete
app.post(
  "/virtualmachines/:actionToPerform",
  ensureAuthenticated,
  async function (req, res) {
    var actionToPerform = req.params.actionToPerform;
    if (actionToPerform == "stop") actionToPerform = "deallocate";

    // user VMs list (for a single resource group)
    var vmNames = req.body.selected;
    var resourceGroup = req.body.resourceGroup;

    // admin view, VMs and resource group
    var subscriptionVMs = req.body.virtualmachines;

    if (vmNames == undefined && subscriptionVMs == undefined) {
      res.send(400, { error: "No VM selected" });
      return;
    }

    try {
      var accessToken = await azureClient.getAccessToken();
    } catch (err) {
      logger.log("Failed to get accessToken", "error", "accesstoken", true);
      res.send(500, err.error);
      return;
    }

    try {
      var resp;

      if (subscriptionVMs != undefined)
        // req.user.userType == "admin" &&
        resp = await subscriptionVMsOperationsAll(
          accessToken,
          subscriptionVMs,
          actionToPerform
        );
      else
        resp = await VMsOperationsAll(
          accessToken,
          resourceGroup,
          vmNames,
          actionToPerform
        );

      res.send(resp);
    } catch (err) {
      logger.log(`Failed to ${actionToPerform} VM(s):  ${err}`);
      if (typeof err == "string") {
        res.send(500, { error: err });
        return;
      }

      res.send(500, err.error);
    }
  }
);

app.post("/start", ensureAuthenticated, async function (req, res) {
  // user containers list (for a single resource group)
  var containerNames = req.body.selected;
  var resourceGroup = req.body.resourceGroup;

  // admin view, containers and resource group
  var subscriptionContainers = req.body.containers;

  if (containerNames == undefined && subscriptionContainers == undefined) {
    res.send(400, { error: "No container selected" });
    return;
  }

  try {
    var accessToken = await azureClient.getAccessToken();
  } catch (err) {
    logger.log("Failed to get accessToken", "error", "accesstoken", true);
    res.send(500, err.error);
    return;
  }

  try {
    var resp;

    if (subscriptionContainers != undefined)
      // req.user.userType == "admin" &&
      resp = await subscriptioncontainersOperationsAll(
        accessToken,
        subscriptionContainers,
        "start"
      );
    else
      resp = await containersOperationsAll(
        accessToken,
        resourceGroup,
        containerNames,
        "start"
      );

    res.send(resp);
  } catch (err) {
    logger.log("Failed to start Container(s)" + err);
    if (typeof err == "string") {
      res.send(500, { error: err });
      return;
    }

    res.send(500, err.error);
  }
});

app.post("/stop", ensureAuthenticated, async function (req, res) {
  // user containers list (for a single resource group)
  var containerNames = req.body.selected;
  var resourceGroup = req.body.resourceGroup;

  // admin view, containers and resource group
  var subscriptionContainers = req.body.containers;

  if (containerNames == undefined && subscriptionContainers == undefined) {
    res.send(400, { error: "No container selected" });
    return;
  }

  try {
    var accessToken = await azureClient.getAccessToken();
  } catch (err) {
    logger.log("Failed to get accessToken", "error", "accesstoken", true);
    res.send(500, err.error);
    return;
  }

  try {
    var resp;

    if (subscriptionContainers != undefined)
      // req.user.userType == "admin" &&
      resp = await subscriptioncontainersOperationsAll(
        accessToken,
        subscriptionContainers,
        "stop"
      );
    else
      resp = await containersOperationsAll(
        accessToken,
        resourceGroup,
        containerNames,
        "stop"
      );

    res.send(resp);
  } catch (err) {
    logger.log("Failed to stop Container(s)" + err);
    if (typeof err == "string") {
      res.send(500, { error: err });
      return;
    }

    res.send(500, err.error);
  }
});

app.post("/restart", ensureAuthenticated, async function (req, res) {
  // user containers list (for a single resource group)
  var containerNames = req.body.selected;
  var resourceGroup = req.body.resourceGroup;

  // admin view, containers and resource group
  var subscriptionContainers = req.body.containers;

  if (containerNames == undefined && subscriptionContainers == undefined) {
    res.send(400, { error: "No container selected" });
    return;
  }

  try {
    var accessToken = await azureClient.getAccessToken();
  } catch (err) {
    logger.log("Failed to get accessToken", "error", "accesstoken", true);
    res.send(500, err.error);
    return;
  }

  try {
    var resp;

    if (subscriptionContainers != undefined)
      // req.user.userType == "admin" &&
      resp = await subscriptioncontainersOperationsAll(
        accessToken,
        subscriptionContainers,
        "restart"
      );
    else
      resp = await containersOperationsAll(
        accessToken,
        resourceGroup,
        containerNames,
        "restart"
      );

    res.send(resp);
  } catch (err) {
    logger.log("Failed to restart Container(s)" + err);
    if (typeof err == "string") {
      res.send(500, { error: err });
      return;
    }

    res.send(500, err.error);
  }
});

app.post("/delete", ensureAuthenticated, async function (req, res) {
  // user containers list (for a single resource group)
  var containerNames = req.body.selected;
  var resourceGroup = req.body.resourceGroup;

  // admin view, containers and resource group
  var subscriptionContainers = req.body.containers;

  if (containerNames == undefined && subscriptionContainers == undefined) {
    res.send(400, { error: "No container selected" });
    return;
  }

  try {
    var accessToken = await azureClient.getAccessToken();
  } catch (err) {
    logger.log("Failed to get accessToken", "error", "accesstoken", true);
    res.send(500, err.error);
    return;
  }

  try {
    var resp;

    if (subscriptionContainers != undefined)
      // req.user.userType == "admin" &&
      resp = await subscriptioncontainersOperationsAll(
        accessToken,
        subscriptionContainers,
        "delete"
      );
    else
      resp = await containersOperationsAll(
        accessToken,
        resourceGroup,
        containerNames,
        "delete"
      );

    res.send(resp);
  } catch (err) {
    logger.log("Failed to delete Container(s)" + err);
    if (typeof err == "string") {
      res.send(500, { error: err });
      return;
    }

    res.send(500, err.error);
  }
});

app.get(
  "/cron/virtualMachines/:vmName/resourceGroup/:resourceGroupName",
  ensureAuthenticated,
  async function (req, res) {
    var vmName = req.params.vmName;
    var resourceGroupName = req.params.resourceGroupName;

    try {
      var accessToken = await azureClient.getAccessToken();
    } catch (err) {
      logger.log("Failed to get accessToken", "error", "accesstoken", true);
      res.send(500, err.error);
      return;
    }

    try {
      var resp = await azureClient.getVirtualMachine(
        accessToken,
        resourceGroupName,
        vmName
      );
      VMTags = JSON.parse(resp).tags;

      if (VMTags == undefined) {
        res.send(200, {
          cronTimeZone: defaultTimeZone,
          cronValues: []
        });
        return;
      }

      var cronVMs = {
        cronTimeZone:
          VMTags.cronTimeZone != undefined
            ? VMTags.cronTimeZone
            : defaultTimeZone,
        cronValues: []
      };

      Object.entries(VMTags).forEach(([tagKey, tagValue]) => {
        if (tagKey.indexOf("-cron") > -1) {
          tagKey = tagKey.split("-cron")[0];
          cronVMs.cronValues.push({ [tagKey]: tagValue });
        }
      });

      res.send(cronVMs);
    } catch (err) {
      logger.log("Failed to get VM cron details" + err);
      if (typeof err == "string") {
        res.send(500, { error: err });
      }

      res.send(500, err.error);
    }
  }
);

app.put("/cron/virtualMachines", ensureAuthenticated, async function (
  req,
  res
) {
  var updateTagpromises = [];
  var cronVMs = req.body;

  try {
    var accessToken = await azureClient.getAccessToken();
  } catch (err) {
    logger.log("Failed to get accessToken", "error", "accesstoken", true);
    res.send(500, err.error);
    return;
  }

  try {
    // 1) Get existing VM tags after removing (start,stop,delete,restart) tags
    // 2) Create Tags json with updated cron values
    // 3) Update VM tags PUT azure call
    var existingVMsTags = await cronVMClient.getSubscriptionVMsTags(
      accessToken,
      cronVMs.virtualmachines
    );
    var VMsTags = await cronVMClient.getCronVMTagJSON(existingVMsTags, cronVMs);

    for (i = 0; i < cronVMs.virtualmachines.length; i++) {
      updateTagpromises[i] = azureClient.tagVirtualMachine(
        accessToken,
        cronVMs.virtualmachines[i]["resourceGroup"],
        cronVMs.virtualmachines[i]["vmName"],
        VMsTags[i]
      );
    }

    Promise.all(updateTagpromises)
      .then((values) => {
        res.send(200, values);
      })
      .catch((error) => {
        console.error(error.message);
        res.send(500, error.message);
      });
  } catch (err) {
    logger.log("Failed to update VM cron details" + err);
    if (typeof err == "string") {
      res.send(500, { error: err });
    }

    res.send(500, err.message);
  }
});

app.get(
  "/cron/containers/:containerName/resourceGroup/:resourceGroupName",
  ensureAuthenticated,
  async function (req, res) {
    var containerName = req.params.containerName;
    var resourceGroupName = req.params.resourceGroupName;

    try {
      var accessToken = await azureClient.getAccessToken();
    } catch (err) {
      logger.log("Failed to get accessToken", "error", "accesstoken", true);
      res.send(500, err.error);
      return;
    }

    try {
      var resp = await azureClient.getContainer(
        accessToken,
        resourceGroupName,
        containerName
      );
      containerTags = resp.tags;

      if (containerTags == undefined) {
        res.send(200, {
          cronTimeZone: defaultTimeZone,
          cronValues: []
        });
        return;
      }

      var cronContainers = {
        cronTimeZone:
          containerTags.cronTimeZone != undefined
            ? containerTags.cronTimeZone
            : defaultTimeZone,
        cronValues: []
      };

      Object.entries(containerTags).forEach(([tagKey, tagValue]) => {
        if (tagKey.indexOf("-cron") > -1) {
          tagKey = tagKey.split("-cron")[0];
          cronContainers.cronValues.push({ [tagKey]: tagValue });
        }
      });

      res.send(cronContainers);
    } catch (err) {
      logger.log("Failed to get container cron details" + err);
      if (typeof err == "string") {
        res.send(500, { error: err });
      }

      res.send(500, err.error);
    }
  }
);

app.put("/cron/containers", ensureAuthenticated, async function (req, res) {
  var updateTagpromises = [];
  var cronContainers = req.body;

  try {
    var accessToken = await azureClient.getAccessToken();
  } catch (err) {
    logger.log("Failed to get accessToken", "error", "accesstoken", true);
    res.send(500, err.error);
    return;
  }

  try {
    // 1) Get existing container tags after removing (start,stop,delete,restart) tags
    // 2) Create Tags json with updated cron values
    // 3) Update Container tags PUT azure call
    var existingContainersTags = await cronClient.getSubscriptionContainersTags(
      accessToken,
      req.body.containers
    );
    var containersTags = await cronClient.getCronContainerTagJSON(
      existingContainersTags,
      cronContainers
    );

    for (i = 0; i < cronContainers.containers.length; i++) {
      updateTagpromises[i] = azureClient.tagContainerGroup(
        accessToken,
        cronContainers.containers[i]["resourceGroup"],
        cronContainers.containers[i]["containerName"],
        containersTags[i]
      );
    }

    Promise.all(updateTagpromises)
      .then((values) => {
        res.send(200, values);
      })
      .catch((error) => {
        console.error(error.message);
        res.send(500, error.message);
      });
  } catch (err) {
    logger.log("Failed to update container cron details" + err);
    if (typeof err == "string") {
      res.send(500, { error: err });
    }

    res.send(500, err.error);
  }
});

app.get("/resourceInfo", ensureAuthenticated, async function (req, res) {
  try {
    var accessToken = await azureClient.getAccessToken();
  } catch (err) {
    logger.log("Failed to get accessToken", "error", "accesstoken", true);
    res.send(500, err.error);
    return;
  }

  try {
    var resp = await getResourcesInfo(accessToken);
    res.send(resp);
  } catch (err) {
    logger.log("Failed to get azure resources info" + err);
    if (typeof err == "string") {
      res.send(500, { error: err });
    }

    res.send(500, err.error);
  }
});

app.get("/resourceGroups", ensureAuthenticated, async function (req, res) {
  try {
    var accessToken = await azureClient.getAccessToken();
  } catch (err) {
    logger.log("Failed to get accessToken", "error", "accesstoken", true);
    res.send(500, err.error);
    return;
  }

  try {
    var resp = await azureClient.getResourceGroups(accessToken, subscriptionId);
    resp = JSON.parse(resp);
    res.send(resp.value);
  } catch (err) {
    logger.log(
      "Failed to get azure resources groups" + err,
      "error",
      "resourcegroup",
      true
    );
    if (typeof err == "string") {
      res.send(500, { error: err });
    }

    res.send(500, err);
  }
});


// Dashboards Graph API's

app.get("/graphs/containers/provisioning_state", ensureAuthenticated, async function (req, res) {

  var containerData;
  try {
    var accessToken = await azureClient.getAccessToken();
    var containerData = await dashboardGraphClient.getAzureContainersforDashboard(req, accessToken)
    // Process Azure API Response
    var finalResponse = dashboardGraphClient.convertAzureContainerRespToGraphFormat(containerData, "provisioningstate")
    res.send(finalResponse)

  } catch (err) {
    logger.log("Failed to get graph container data" + err);
    if (typeof err == "string") {
      res.send(500, { error: err });
    }

    res.send(500, err.error);
  }
});

app.get("/graphs/containers/status", ensureAuthenticated, async function (req, res) {

  var containerData;
  try {
    var accessToken = await azureClient.getAccessToken();
    var containerData = await dashboardGraphClient.getAzureContainersforDashboard(req, accessToken)
    // Process Azure API Response
    var finalResponse = dashboardGraphClient.convertAzureContainerRespToGraphFormat(containerData, "status")
    res.send(finalResponse)

  } catch (err) {
    logger.log("Failed to get graph container data" + err);
    if (typeof err == "string") {
      res.send(500, { error: err });
    }

    res.send(500, err.error);
  }
});


app.get("/graphs/virtualmachines/provisioning_state", ensureAuthenticated, async function (req, res) {

  var vmData;
  try {
    var accessToken = await azureClient.getAccessToken();
    var vmData = await dashboardGraphClient.getAzureVMsforDashboard(req, accessToken)
    // Process Azure API Response
    var finalResponse = dashboardGraphClient.convertAzureVMRespToGraphFormat(vmData, "provisioningstate")
    res.send(finalResponse)

  } catch (err) {
    logger.log("Failed to get graph VM data" + err);
    if (typeof err == "string") {
      res.send(500, { error: err });
    }

    res.send(500, err.error);
  }
});


app.get("/graphs/virtualmachines/status", ensureAuthenticated, async function (req, res) {

  var vmData;
  try {
    var accessToken = await azureClient.getAccessToken();
    var vmData = await dashboardGraphClient.getAzureVMsforDashboard(req, accessToken)
    // Process Azure API Response
    var finalResponse = dashboardGraphClient.convertAzureVMRespToGraphFormat(vmData, "status")
    res.send(finalResponse)

  } catch (err) {
    logger.log("Failed to get graph VM data" + err);
    if (typeof err == "string") {
      res.send(500, { error: err });
    }

    res.send(500, err.error);
  }
});

/**
 * Stripe APIs by Asad Ullah Khalid
 */

/**
 * Stripe Payment Method Integrated
 */

app.get("/paymentMethods", ensureAuthenticated, function (req, res) {
  var customerID = req.query.customerID;
  var type = req.query.type;
  var limit = req.query.limit;

  stripeClient
    .getPaymentMethods(customerID, type, limit)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Payment methods fetched successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while fetching payment methods.`
        }
      });
    });
});

app.patch("/paymentMethod/detach", ensureAuthenticated, function (req, res) {
  var paymentMethodID = req.body.paymentMethodID;

  stripeClient
    .detachPaymentMethod(paymentMethodID)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Payment method detached successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while detaching payment method.`
        }
      });
    });
});

app.patch("/paymentMethod/attach", ensureAuthenticated, function (req, res) {
  var paymentMethodID = req.body.paymentMethodID;
  var customerID = req.body.customerID;

  stripeClient
    .attachPaymentMethod(paymentMethodID, customerID)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Payment method attached successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while attaching payment method.`
        }
      });
    });
});

app.post("/customer", ensureAuthenticated, function (req, res) {
  var name = req.body.name;
  var email = req.body.email;
  var phone = req.body.phone;

  stripeClient
    .createStripeCustomer(name, email, phone)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: "Customer created successfully."
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while creating customer.`
        }
      });
    });
});

app.get("/customer", ensureAuthenticated, function (req, res) {
  var customerID = req.query.customerID;

  stripeClient
    .getCustomer(customerID)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Customer fetched successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while fetching customer.`
        }
      });
    });
});

app.patch("/customer", ensureAuthenticated, function (req, res) {
  // var description = req.body.description;
  var customerID = req.body.customerID;
  var paymentMethodID = req.body.paymentMethodID;

  stripeClient
    .updateCustomer(customerID, paymentMethodID)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Customer default payment method updated successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while updating customer default payment method.`
        }
      });
    });
});

app.delete("/customer", ensureAuthenticated, function (req, res) {
  var customerID = req.query.customerID;

  stripeClient
    .deleteCustomer(customerID)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Customer deleted successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while deleting customer.`
        }
      });
    });
});

app.get("/customers", ensureAuthenticated, function (req, res) {
  var limit = req.query.limit ? req.query.limit : null;

  stripeClient
    .getCustomers(limit)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Customers fetched successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while fetching customers.`
        }
      });
    });
});

app.post("/setupIntent", ensureAuthenticated, function (req, res) {
  var customerID = req.body.customerID;

  stripeClient
    .createSetupIntent(customerID)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Setup intent created successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while creating setup intent.`
        }
      });
    });
});

app.post("/paymentIntent", ensureAuthenticated, function (req, res) {
  var amount = req.body.amount;
  var currency = req.body.currency;
  var customerID = req.body.customerID;
  var paymentMethodID = req.body.paymentMethodID;

  stripeClient
    .createPaymentIntent(amount, currency, paymentMethodID, customerID)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Payment intent created successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while creating payment intent.`
        }
      });
    });
});

/**
 * Stripe CRUD APIs
 */

//product
app.post("/product", ensureAuthenticated, function (req, res) {
  var name = req.body.name;

  stripeClient
    .createProduct(name)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: "Product created successfully."
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while creating product.`
        }
      });
    });
});

app.get("/product", ensureAuthenticated, function (req, res) {
  var productID = req.query.productID;

  stripeClient
    .getProduct(productID)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Product fetched successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while fetching product.`
        }
      });
    });
});

app.patch("/product", ensureAuthenticated, function (req, res) {
  var productID = req.body.productID;
  var metadata = req.body.metadata;
  var name = req.body.name;

  stripeClient
    .updateProduct(productID, metadata, name)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Product updated successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while updating product.`
        }
      });
    });
});

app.delete("/product", ensureAuthenticated, function (req, res) {
  var productID = req.query.productID;

  stripeClient
    .deleteProduct(productID)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Product deleted successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while deleting product.`
        }
      });
    });
});

app.get("/products", ensureAuthenticated, function (req, res) {
  var limit = req.query.limit;

  stripeClient
    .getProducts(limit)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Products fetched successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while fetching products.`
        }
      });
    });
});

//price
app.post("/price", ensureAuthenticated, function (req, res) {
  var productID = req.body.productID;
  var currency = req.body.currency;
  var interval = req.body.interval;
  var usageType = req.body.usageType;
  var unitAmount = req.body.unitAmount;

  stripeClient
    .createPrice(productID, currency, interval, usageType, unitAmount)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Price created successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while creating price.`
        }
      });
    });
});

app.get("/price", ensureAuthenticated, function (req, res) {
  var priceID = req.query.priceID;

  stripeClient
    .getPrice(priceID)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Price fetched successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while fetching price.`
        }
      });
    });
});

app.patch("/price", ensureAuthenticated, function (req, res) {
  var priceID = req.body.priceID;
  var metadata = req.body.metadata;
  var active = req.body.active;
  var nickname = req.body.nickname;

  stripeClient
    .updatePrice(priceID, metadata, active, nickname)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Price updated successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while updating price.`
        }
      });
    });
});

app.get("/prices", ensureAuthenticated, function (req, res) {
  var limit = req.query.limit ? req.query.limit : null;

  stripeClient
    .getPrices(limit)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Prices fetched successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while fetching prices.`
        }
      });
    });
});

//subscription
app.post("/subscription", ensureAuthenticated, function (req, res) {
  var customerID = req.body.customerID;
  var priceID = req.body.priceID;

  stripeClient
    .createSubscription(customerID, priceID)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: "Subscription created successfully."
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while creating subscription.`
        }
      });
    });
});

app.get("/subscription", ensureAuthenticated, function (req, res) {
  var subscriptionID = req.query.subscriptionID;

  stripeClient
    .getSubscription(subscriptionID)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Subscription fetched successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while fetching subscription.`
        }
      });
    });
});

app.patch("/subscription", ensureAuthenticated, function (req, res) {
  var subscriptionID = req.body.subscriptionID;
  var metadata = req.body.metadata;
  var cancelAtPeriodEnd = req.body.cancelAtPeriodEnd;

  stripeClient
    .updateSubscription(subscriptionID, metadata, cancelAtPeriodEnd)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Subscription updated successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while updating subscription.`
        }
      });
    });
});

app.delete("/subscription", ensureAuthenticated, function (req, res) {
  var subscriptionID = req.query.subscriptionID;

  stripeClient
    .cancelSubscription(subscriptionID)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Subscription deleted successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while deleting subscription.`
        }
      });
    });
});

app.get("/subscriptions", function (req, res) {
  var limit = req.query.limit;

  stripeClient
    .getSubscriptions(limit)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Subscriptions fetched successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while fetching subscriptions.`
        }
      });
    });
});

//invoice
app.post("/invoice", ensureAuthenticated, function (req, res) {
  var customerID = req.body.customerID;

  stripeClient
    .createInvoice(customerID)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: "Invoice created successfully."
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while creating invoice.`
        }
      });
    });
});

app.get("/invoice", ensureAuthenticated, function (req, res) {
  var invoiceID = req.query.invoiceID;

  stripeClient
    .getInvoice(invoiceID)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Invoice fetched successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while fetching invoice.`
        }
      });
    });
});

app.patch("/invoice", ensureAuthenticated, function (req, res) {
  var invoiceID = req.body.invoiceID;
  var metadata = req.body.metadata;
  var description = req.body.description;

  stripeClient
    .updateInvoice(invoiceID, metadata, description)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Invoice updated successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while updating invoice.`
        }
      });
    });
});

app.delete("/invoice", ensureAuthenticated, function (req, res) {
  var invoiceID = req.query.invoiceID;

  stripeClient
    .deleteInvoice(invoiceID)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Invoice deleted successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while deleting invoice.`
        }
      });
    });
});

app.get("/invoices", ensureAuthenticated, function (req, res) {
  var limit = req.query.limit;

  stripeClient
    .getInvoices(limit)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Invoices fetched successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while fetching invoices.`
        }
      });
    });
});

//charge
app.post("/charge", ensureAuthenticated, function (req, res) {
  var amount = req.body.amount;
  var currency = req.body.currency;
  var source = req.body.source;

  stripeClient
    .createCharge(amount, currency, source)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: "Charge created successfully."
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while creating charge.`
        }
      });
    });
});

app.get("/charge", ensureAuthenticated, function (req, res) {
  var chargeID = req.query.chargeID;

  stripeClient
    .getCharge(chargeID)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Charge fetched successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while fetching charge.`
        }
      });
    });
});

app.patch("/charge", ensureAuthenticated, function (req, res) {
  var chargeID = req.body.chargeID;
  var metadata = req.body.metadata;
  var description = req.body.description;

  stripeClient
    .updateCharge(chargeID, metadata, description)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Charge updated successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while updating charge.`
        }
      });
    });
});

app.delete("/charge", ensureAuthenticated, function (req, res) {
  var chargeID = req.query.chargeID;

  stripeClient
    .captureCharge(chargeID)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Charge captured successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while captured charge.`
        }
      });
    });
});

app.get("/charges", ensureAuthenticated, function (req, res) {
  var limit = req.query.limit;

  stripeClient
    .getCharges(limit)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Charges fetched successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while fetching charges.`
        }
      });
    });
});

//balance
app.get("/balance", ensureAuthenticated, function (req, res) {
  stripeClient
    .getBalance()
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Balance fetched successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while fetching balance.`
        }
      });
    });
});

//balance transaction
app.get("/balanceTransaction", ensureAuthenticated, function (req, res) {
  var balanceTransactionID = req.query.balanceTransactionID;

  stripeClient
    .getBalanceTransaction(balanceTransactionID)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `BalanceTransaction fetched successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while fetching balanceTransaction.`
        }
      });
    });
});

app.get("/balanceTransactions", ensureAuthenticated, function (req, res) {
  var limit = req.query.limit;

  stripeClient
    .getBalanceTransactions(limit)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `BalanceTransactions fetched successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while fetching balanceTransactions.`
        }
      });
    });
});

//dispute
app.get("/dispute", ensureAuthenticated, function (req, res) {
  var disputeID = req.query.disputeID;

  stripeClient
    .getDispute(disputeID)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Dispute fetched successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while fetching dispute.`
        }
      });
    });
});

app.patch("/dispute", ensureAuthenticated, function (req, res) {
  var disputeID = req.body.disputeID;
  var metadata = req.body.metadata;

  stripeClient
    .updateDispute(disputeID, metadata)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Dispute updated successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while updating dispute.`
        }
      });
    });
});

app.delete("/dispute", ensureAuthenticated, function (req, res) {
  var disputeID = req.query.disputeID;

  stripeClient
    .deleteDispute(disputeID)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Dispute deleted successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while deleting dispute.`
        }
      });
    });
});

app.get("/disputes", ensureAuthenticated, function (req, res) {
  var limit = req.query.limit;

  stripeClient
    .getDisputes(limit)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Disputes fetched successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while fetching disputes.`
        }
      });
    });
});

//payout
app.post("/payout", ensureAuthenticated, function (req, res) {
  var amount = req.body.amount;
  var currency = req.body.currency;

  stripeClient
    .createPayout(amount, currency)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: "Payout created successfully."
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while creating payout.`
        }
      });
    });
});

app.get("/payout", ensureAuthenticated, function (req, res) {
  var payoutID = req.query.payoutID;

  stripeClient
    .getPayout(payoutID)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Payout fetched successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while fetching payout.`
        }
      });
    });
});

app.patch("/payout", ensureAuthenticated, function (req, res) {
  var payoutID = req.body.payoutID;
  var metadata = req.body.metadata;

  stripeClient
    .updatePayout(payoutID, metadata)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Payout updated successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while updating payout.`
        }
      });
    });
});

app.delete("/payout", ensureAuthenticated, function (req, res) {
  var payoutID = req.query.payoutID;

  stripeClient
    .cancelPayout(payoutID)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Payout deleted successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while deleting payout.`
        }
      });
    });
});

app.get("/payouts", ensureAuthenticated, function (req, res) {
  var limit = req.query.limit;

  stripeClient
    .getPayouts(limit)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Payouts fetched successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while fetching payouts.`
        }
      });
    });
});

//refund
app.post("/refund", ensureAuthenticated, function (req, res) {
  var chargeID = req.body.chargeID;

  stripeClient
    .createRefund(chargeID)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: "Refund created successfully."
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while creating refund.`
        }
      });
    });
});

app.get("/refund", ensureAuthenticated, function (req, res) {
  var refundID = req.query.refundID;

  stripeClient
    .getRefund(refundID)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Refund fetched successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while fetching refund.`
        }
      });
    });
});

app.patch("/refund", ensureAuthenticated, function (req, res) {
  var refundID = req.body.refundID;
  var metadata = req.body.metadata;

  stripeClient
    .updateRefund(refundID, metadata)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Refund updated successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while updating refund.`
        }
      });
    });
});

app.get("/refunds", ensureAuthenticated, function (req, res) {
  var limit = req.query.limit;

  stripeClient
    .getRefunds(limit)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `Refunds fetched successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while fetching refunds.`
        }
      });
    });
});

//bankAccount
app.post("/bankAccount", ensureAuthenticated, function (req, res) {
  var customerID = req.body.customerID;
  var source = req.body.source;

  stripeClient
    .createBankAccount(customerID, source)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: "BankAccount created successfully."
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while creating bankAccount.`
        }
      });
    });
});

app.get("/bankAccount", ensureAuthenticated, function (req, res) {
  var customerID = req.query.customerID;
  var bankAccountID = req.query.bankAccountID;

  stripeClient
    .getBankAccount(customerID, bankAccountID)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `BankAccount fetched successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while fetching bankAccount.`
        }
      });
    });
});

app.patch("/bankAccount", ensureAuthenticated, function (req, res) {
  var customerID = req.body.customerID;
  var bankAccountID = req.body.bankAccountID;
  var metadata = req.body.metadata;
  var accountHolderName = req.body.accountHolderName;

  stripeClient
    .updateBankAccount(customerID, bankAccountID, metadata, accountHolderName)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `BankAccount updated successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while updating bankAccount.`
        }
      });
    });
});

app.delete("/bankAccount", ensureAuthenticated, function (req, res) {
  var customerID = req.query.customerID;
  var bankAccountID = req.query.bankAccountID;

  stripeClient
    .deleteBankAccount(customerID, bankAccountID)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `BankAccount deleted successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while deleting bankAccount.`
        }
      });
    });
});

app.get("/bankAccounts", ensureAuthenticated, function (req, res) {
  var customerID = req.query.customerID;
  var limit = req.query.limit;

  stripeClient
    .getBankAccounts(customerID, limit)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: `BankAccounts fetched successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while fetching bankAccounts.`
        }
      });
    });
});

//checkout sessions
app.post("/checkout/session", ensureAuthenticated, function (req, res) {
  var amount = req.body.amount;
  var successUrl = req.body.successUrl;
  var cancelUrl = req.body.cancelUrl;

  stripeClient
    .createCheckoutSession(amount, successUrl, cancelUrl)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          ...result,
          details: "Checkout session created successfully."
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          ...err,
          details: `Error while creating checkout session.`
        }
      });
    });
});

app.get("/containers/cron/history", function (req, res) {
  // get specific resource group history for users other than admin
  var func =
    req.user.userType === "admin"
      ? cronClient.getCronHistory()
      : cronClient.getCronHistoryByResourceGroup(req.user.resourceGroup);
  func
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          cronhistory: result,
          details: `Cron History fetched successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          err,
          details: `Error while fetching cron history .`
        }
      });
    });
});

app.get("/virtualmachines/cron/history", function (req, res) {
  // get specific resource group history for users other than admin
  var func =
    req.user.userType === "admin"
      ? cronVMClient.getCronHistory()
      : cronVMClient.getCronHistoryByResourceGroup(req.user.resourceGroup);
  func
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          cronhistory: result,
          details: `Cron History fetched successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          err,
          details: `Error while fetching cron history .`
        }
      });
    });
});

/**
 * Database APIs by Asad Ullah Khalid
 */

//users
app.get("/db/users", ensureAuthenticated, function (req, res) {
  getUsersFromDB()
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          users: result,
          details: `Users fetched successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          err,
          details: `Error while fetching users.`
        }
      });
    });
});

app.get("/db/user", ensureAuthenticated, function (req, res) {
  getUserFromDB(req)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          user: result,
          details: `User fetched successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          err,
          details: `Error while fetching user.`
        }
      });
    });
});

app.post("/db/user", ensureAuthenticated, function (req, res) {
  createUser(req)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          user: result,
          details: `User created successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          err,
          details: `Error while creating user.`
        }
      });
    });
});

app.patch("/db/user", ensureAuthenticated, function (req, res) {
  updateUser(req)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          user: result,
          details: `User updated successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          err,
          details: `Error while updating user.`
        }
      });
    });
});

app.delete("/db/user", ensureAuthenticated, function (req, res) {
  deleteUser(req)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          users: result,
          details: `User deleted successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          err,
          details: `Error while deleting user.`
        }
      });
    });
});

//resource groups
app.get("/db/resourceGroups", ensureAuthenticated, function (req, res) {
  getResourceGroupsFromDB()
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          resourceGroups: result,
          details: `Resource groups fetched successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          err,
          details: `Error while fetching resource groups.`
        }
      });
    });
});

app.get("/db/resourceGroup", ensureAuthenticated, function (req, res) {
  getResourceGroupFromDB(req)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          resourceGroup: result,
          details: `ResourceGroup fetched successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          err,
          details: `Error while fetching resourceGroup.`
        }
      });
    });
});

app.post("/db/resourceGroup", ensureAuthenticated, function (req, res) {
  const request = {
    query: {
      name: req.body.name
    },
    body: { ...req.body }
  };
  getResourceGroupFromDB(request)
    .then((result) => {
      if (isEmpty(result)) {
        createResourceGroup(request)
          .then((result) => {
            res.status(200).send({
              message: "success",
              data: {
                resourceGroup: result,
                details: `ResourceGroup created successfully.`
              }
            });
          })
          .catch((err) => {
            res.status(400).send({
              message: "failed",
              data: {
                err,
                details: `Error while creating resourceGroup.`
              }
            });
          });
      } else {
        res.status(400).send({
          message: "failed",
          data: {
            err,
            details: `ResourceGroup with this name is already exist.`
          }
        });
      }
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          err,
          details: `Error while fetching resourceGroup.`
        }
      });
    });
});

app.patch("/db/resourceGroup", ensureAuthenticated, function (req, res) {
  updateResourceGroup(req)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          resourceGroup: result,
          details: `ResourceGroup updated successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          err,
          details: `Error while updating resourceGroup.`
        }
      });
    });
});

app.delete("/db/resourceGroup", ensureAuthenticated, function (req, res) {
  deleteResourceGroup(req)
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          resourceGroups: result,
          details: `ResourceGroup deleted successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          err,
          details: `Error while deleting resourceGroup.`
        }
      });
    });
});

//billing history
app.get("/billingHistory", ensureAuthenticated, function (req, res) {
  getBillingHistoryFromDB()
    .then((result) => {
      res.status(200).send({
        message: "success",
        data: {
          billingHistory: result,
          details: `Billing history fetched successfully.`
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          err,
          details: `Error while fetching billing history.`
        }
      });
    });
});

//charge or pay from/for user on stripe whose payment status is false
app.post("/user/charge", ensureAuthenticated, async function (req, res) {
  createOrUpdateBillingHistory(req.body).then((result) => {
    if (result.status) {
      res.status(200).send(result);
    }
    res.status(400).send(result);
  });
});

//charge or pay from/for all user on stripe whom payment statuses are false
app.post("/user/charge_all", ensureAuthenticated, function (req, res) {
  let apiCalls = [];
  const { type: userType, resourceGroup } = req.body;
  getBillingHistoryFromDB()
    .then((result) => {
      let histories = result;
      //if requested user is client then only charge its resource group
      if (userType === "client") {
        histories = histories.filter(
          (history) => history.resourceGroup === resourceGroup
        );
      }
      //leave all those users who are already charged
      histories = histories.filter((history) => !history.status);
      //charge each user who is not already charged
      histories.forEach((history) => {
        apiCalls.push(createOrUpdateBillingHistory(history));
      });
      Promise.all(apiCalls).then((results) => {
        //getting number of failed APIs to send response accordingly
        const failedAPICalls = results.filter((result) => !result.status);
        if (!failedAPICalls.length) {
          res.status(200).send({
            message: "success",
            data: {
              details: `All users have been charged successfully`
            }
          });
        } else if (
          failedAPICalls.length &&
          failedAPICalls.length < results.length
        ) {
          res.status(200).send({
            message: "success",
            data: {
              details: `Some of the users have been charged successfully`
            }
          });
        } else {
          res.status(400).send({
            message: "failed",
            data: {
              details: `No user charged`
            }
          });
        }
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "failed",
        data: {
          details: `Error occured while fetching billing history information`
        }
      });
    });
});

function createOrUpdateBillingHistory(userData) {
  return new Promise((resolve, reject) => {
    const payload = {
      _id: userData._id,
      givenName: userData.resourceGroup,
      surname: userData.stripeCustomerId,
      charge: userData.userChargedAmount,
      actualCharge: userData.actualAmountAzureCharged,
      multiplier: userData.multiplier,
      billingTo: userData.billingTo,
      billingFrom: userData.billingFrom,
      status: userData.status,
      statusDescription: userData.statusDescription
    };

    userChargeCycle(payload)
      .then((user) => {
        logger.log(user.statusDescription);
        updateBillingHistory(user)
          .then((result) => {
            if (!result) {
              createBillingHistory(user)
                .then(() => {
                  logger.log(
                    `Billing history record successfully created in database.`
                  );
                  resolve({
                    status: true,
                    message: "success",
                    data: {
                      details: `User has been charged successfully.`
                    }
                  });
                })
                .catch(() => {
                  logger.log(
                    `Error in creating billing history record in database.`
                  );
                  resolve({
                    status: true,
                    message: "success",
                    data: {
                      details: `User has been charged successfully but there was an error occured during creating record in database.`
                    }
                  });
                });
            } else {
              logger.log(
                `Billing history record successfully updated in database.`
              );
              resolve({
                status: true,
                message: "success",
                data: {
                  details: `User has been charged successfully.`
                }
              });
            }
          })
          .catch((err) => {
            logger.log(`Error in updating billing history record in database.`);
            resolve({
              status: true,
              message: "success",
              data: {
                details: `User has been charged successfully but there was an error occured during updating record in database.`
              }
            });
          });
      })
      .catch((user) => {
        logger.log(user.statusDescription);
        updateBillingHistory(user)
          .then((result) => {
            if (!result) {
              createBillingHistory(user)
                .then(() => {
                  logger.log(
                    `Billing history record successfully created in database.`
                  );
                  resolve({
                    status: false,
                    message: "failed",
                    data: {
                      details: `Error occured during charging user.`
                    }
                  });
                })
                .catch(() => {
                  logger.log(
                    `Error in creating billing history record in database.`
                  );
                  resolve({
                    status: false,
                    message: "failed",
                    data: {
                      details: `User has not been charged and there was an error creating record in database.`
                    }
                  });
                });
            } else {
              logger.log(
                `Billing history record successfully updated in database.`
              );
              resolve({
                status: false,
                message: "failed",
                data: {
                  details: `Error occured during charging user.`
                }
              });
            }
          })
          .catch((err) => {
            logger.log(`Error in updating billing history record in database.`);
            resolve({
              status: false,
              message: "failed",
              data: {
                details: `User has not been charged and there was an error updating record in database.`
              }
            });
          });
      });
  });
}

function getADUserJSON(
  displayName,
  mailNickname,
  userPrincipalName,
  company,
  resourceGroupName,
  mail,
  mobilePhone,
  officeLocation,
  preferredLanguage,
  password,
  passwordChangeFirstTime,
  stripeCustomerId,
  // stripeSubscriptionId,
  userType
) {
  var user = {
    accountEnabled: true,
    displayName: displayName,
    mailNickname: mailNickname,
    userPrincipalName: userPrincipalName,
    jobTitle: company,
    givenName: resourceGroupName,
    streetAddress: userType,
    // "mail": mail,
    mobilePhone: mobilePhone,
    // officeLocation: officeLocation,
    preferredLanguage: preferredLanguage,
    passwordProfile: {
      forceChangePasswordNextSignIn: passwordChangeFirstTime,
      password: password
    }
    // officeLocation: stripeSubscriptionId
  };

  if (stripeCustomerId != "") {
    user["surname"] = stripeCustomerId;
  }

  return user;
}

async function VMsOperationsAll(
  accessToken,
  resourceGroup,
  vmNames,
  operationType
) {
  var result = [];
  var VMOperationpromises = [];

  for (i = 0; i < vmNames.length; i++) {
    VMOperationpromises[i] = azureClient.VMOperations(
      accessToken,
      resourceGroup,
      vmNames[i],
      operationType
    );
    // result[i] = resp;
  }

  result = await Promise.all(VMOperationpromises);
  return result;
}

async function containersOperationsAll(
  accessToken,
  resourceGroup,
  containerNames,
  operationType
) {
  var result = [];
  var containerOperationpromises = [];

  for (i = 0; i < containerNames.length; i++) {
    containerOperationpromises[i] = azureClient.containerOperations(
      accessToken,
      resourceGroup,
      containerNames[i],
      operationType
    );
    // result[i] = resp;
  }

  result = await Promise.all(containerOperationpromises);
  return result;
}

// function isLoggedIn(req, res, next) {

// 	if (req.session.loggedin) {
// 		logger.log("Is authenticated");
// 		return next();
// 	}
// 	logger.log("Not Authenticated");
// 	res.send(403, {
// 		error: "Forbidden! Please login again"
// 	});
// 	//res.redirect('/');

// }

async function subscriptionVMsOperationsAll(
  accessToken,
  VMData,
  operationType
) {
  var result = [];
  var VMOperationpromises = [];

  for (i = 0; i < VMData.length; i++) {
    VMOperationpromises[i] = azureClient.VMOperations(
      accessToken,
      VMData[i].resourceGroupName,
      VMData[i].vmName,
      operationType
    );
  }

  result = await Promise.all(VMOperationpromises);
  return result;
}

async function subscriptioncontainersOperationsAll(
  accessToken,
  containerGroupData,
  operationType
) {
  var result = [];
  var containerOperationpromises = [];

  for (i = 0; i < containerGroupData.length; i++) {
    containerOperationpromises[i] = azureClient.containerOperations(
      accessToken,
      containerGroupData[i].resourceGroupName,
      containerGroupData[i].containerGroup,
      operationType
    );
  }

  result = await Promise.all(containerOperationpromises);
  return result;
}

async function getBillingInfoByFilters(accessToken) {
  var address = `https://management.azure.com/providers/Microsoft.Billing/billingAccounts/${billingAccountId}/providers/Microsoft.CostManagement/query?api-version=${billingapiVersion}&$top=${topUsageDetails}`;

  var lastWeek = dayMinusFromTodayDate(8);
  var today = dayMinusFromTodayDate(1);

  var requestBody = {
    type: "Usage",
    dataSet: {
      granularity: "None",
      aggregation: {
        totalCostUSD: {
          name: "PreTaxCostUSD",
          function: "Sum"
        }
      },
      grouping: [
        {
          type: "Dimension",
          name: "ResourceGroupName"
        }
      ]
    },
    // timeframe: "WeekToDate",
    timeframe: "Custom",
    timePeriod: {
      from: `${lastWeek}T00:00:00+00:00`,
      to: `${today}T23:59:59+00:00`
    }
  };

  var options = {
    uri: address,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: accessToken
    },
    body: requestBody,
    json: true
  };

  try {
    var response = await request(options);
    return response;
  } catch (err) {
    throw {
      error: "Failed to get billing info",
      message: err
    };
  }
}

async function getUserDetails(userid) {
  try {
    var accessToken = await azureClient.getAccessToken(
      azureClient.graphResource
    );
  } catch (err) {
    logger.log("Failed to get accessToken", "error", "accesstoken", true);
    throw err.error;
  }

  try {
    var resp = await azureClient.getUser(accessToken, userid);
    resp = JSON.parse(resp);
    return resp;
  } catch (err) {
    logger.log("Failed to get resourcegroup");
    throw err.error;
  }
}

async function createorUpdateResourceGroup(
  accessToken,
  subscriptionID,
  rgName,
  ownerPrincipalName
) {
  var requestBody = {
    location: "eastus"
  };

  var address = `https://management.azure.com/subscriptions/${subscriptionID}/resourcegroups/${rgName}?api-version=${rgapiVersion}`;
  var options = {
    method: "PUT",
    uri: address,
    headers: {
      Authorization: accessToken
    },
    body: requestBody,
    json: true,
    resolveWithFullResponse: true
  };

  try {
    var response = await request(options);

    var resp = {
      id: response.body.id
    };

    if (response.statusCode == 200) {
      return utils.registerJSONresponse("ResourceGroup", "Exists", resp);
    } else if (response.statusCode == 201) {
      // Tag Resource Group, add Owner user principal as tag
      // Caution: Owner tag will be added only if new resource group is being created.
      // Admin will be tagged as owner as well, but we won't be charging them for billing.
      // Check needs to be added while billing to get users and charge userType "client" only.

      // We can also implement check to not tag rg owner if it's fenago admin (we will skip all resource group not
      // tagged with owner), but it might be better to differentiate fenago admin owned
      // resource groups and the one created outside of web application for other uses, using azure portal etc.
      var createdDateTime = new Date().toUTCString();
      tagJSON = azureUtils.getResourceGroupTagJSON(
        ownerPrincipalName,
        createdDateTime
      );
      var tagResp = await azureClient.tagResourceGroupOwner(
        accessToken,
        rgName,
        tagJSON
      );

      return utils.registerJSONresponse("ResourceGroup", "Created", resp);
    } else {
      return utils.registerJSONresponse(
        "ResourceGroup",
        "Status: " + response.statusCode
      );
    }
  } catch (err) {
    var msg = err.error.error["message"];
    if (msg.includes("already exists")) {
      return utils.registerJSONresponse("ResourceGroup", "Exists");
    }

    return utils.registerJSONresponse("ResourceGroup", err.error);
  }
}

async function creatAzureADUser(accessToken, requestBody) {
  var address = `https://graph.microsoft.com/${graphapiVersion}/users`;
  var options = {
    method: "POST",
    uri: address,
    headers: {
      Authorization: accessToken
    },
    body: requestBody,
    json: true,
    resolveWithFullResponse: true
  };

  try {
    var response = await request(options);

    if (response.statusCode == 201) {
      var resp = {
        id: response.body.id
      };
      return utils.registerJSONresponse("AzureUser", "Created", resp);
    } else {
      return utils.registerJSONresponse(
        "AzureUser",
        "Status: " + response.statusCode
      );
    }
  } catch (err) {
    var msg = err.error.error["message"];
    if (msg.includes("already exists")) {
      return utils.registerJSONresponse("AzureUser", "Exists");
    }

    throw utils.registerJSONresponse("AzureUser", err.error);
  }
}

async function getResourcesInfo(accessToken) {
  var result = [];

  var resp = await azureClient.getSubscriptions(accessToken);
  resp = JSON.parse(resp);
  resp = resp.value;
  result = [];
  for (i = 0; i < resp.length; i++) {
    r = {
      subscriptionId: resp[i].subscriptionId,
      subscriptionName: resp[i].displayName,
      resourceGroups: []
    };
    var rg = await azureClient.getResourceGroups(accessToken, r.subscriptionId);
    rg = JSON.parse(rg);
    rg = rg.value;
    r.resourceGroups = rg;

    result[i] = r;
  }
  return result;
}

//User Data in Database
const getUsersFromDB = () => {
  return new Promise((resolve, reject) => {
    UserModel.find({}, (err, users) => {
      if (err) {
        reject(err);
      } else {
        resolve(users);
      }
    }).catch((err) => {
      reject(err);
    });
  });
};

const getUserFromDB = (req) => {
  return new Promise((resolve, reject) => {
    UserModel.findOne(
      {
        id: req.query.id
      },
      (err, user) => {
        if (err) {
          reject(err);
        } else {
          resolve(user);
        }
      }
    ).catch((err) => {
      reject(err);
    });
  });
};

const createUser = (req) => {
  return new Promise((resolve, reject) => {
    const user = new UserModel({
      id: req.body.id,
      name: req.body.name,
      imageUrl: req.body.imageUrl,
      resourceGroup: req.body.resourceGroup,
      multiplier: req.body.multiplier
    });

    user
      .save()
      .then((user) => {
        resolve(user);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const updateUser = (req) => {
  return new Promise((resolve, reject) => {
    UserModel.findOneAndUpdate(
      {
        id: req.body.id
      },
      {
        name: req.body.name,
        imageUrl: req.body.imageUrl,
        esourceGroup: req.body.resourceGroup,
        multiplier: req.body.multiplier
      },
      { new: true },
      (err, user) => {
        if (err) {
          reject(err);
        } else {
          resolve(user);
        }
      }
    ).catch((err) => {
      reject(err);
    });
  });
};

const deleteUser = (req) => {
  return new Promise((resolve, reject) => {
    UserModel.deleteOne(
      {
        id: req.query.id
      },
      (err, user) => {
        if (err) {
          reject(err);
        } else {
          resolve(user);
        }
      }
    ).catch((err) => {
      reject(err);
    });
  });
};

//Resource Groups data in Database
const getResourceGroupsFromDB = () => {
  return new Promise((resolve, reject) => {
    ResourceGroupModel.find({}, (err, resourceGroups) => {
      if (err) {
        reject(err);
      } else {
        resolve(resourceGroups);
      }
    }).catch((err) => {
      reject(err);
    });
  });
};

const getResourceGroupFromDB = (req) => {
  return new Promise((resolve, reject) => {
    ResourceGroupModel.findOne(
      {
        name: req.query.name
      },
      (err, resourceGroup) => {
        if (err) {
          reject(err);
        } else {
          resolve(resourceGroup);
        }
      }
    ).catch((err) => {
      reject(err);
    });
  });
};

const createResourceGroup = (req) => {
  return new Promise((resolve, reject) => {
    const resourceGroup = new ResourceGroupModel({
      name: req.body.name,
      multiplier: req.body.multiplier,
      createdAt: currentDateTime(),
      modifiedAt: currentDateTime()
    });

    resourceGroup
      .save()
      .then((resourceGroup) => {
        resolve(resourceGroup);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const updateResourceGroup = (req) => {
  return new Promise((resolve, reject) => {
    ResourceGroupModel.findOneAndUpdate(
      {
        name: req.body.name
      },
      {
        multiplier: req.body.multiplier,
        modifiedAt: currentDateTime()
      },
      { new: true },
      (err, resourceGroup) => {
        if (err) {
          reject(err);
        } else {
          resolve(resourceGroup);
        }
      }
    ).catch((err) => {
      reject(err);
    });
  });
};

const deleteResourceGroup = (req) => {
  return new Promise((resolve, reject) => {
    ResourceGroupModel.deleteOne(
      {
        name: req.query.name
      },
      (err, resourceGroup) => {
        if (err) {
          reject(err);
        } else {
          resolve(resourceGroup);
        }
      }
    ).catch((err) => {
      reject(err);
    });
  });
};

//Billing history in database - BillingHistory
const getBillingHistoryFromDB = () => {
  return new Promise((resolve, reject) => {
    BillingHistoryModel.find({}, (err, billingHistory) => {
      if (err) {
        reject(err);
      } else {
        resolve(billingHistory);
      }
    }).catch((err) => {
      reject(err);
    });
  });
};

const createBillingHistory = (payload) => {
  return new Promise((resolve, reject) => {
    const billingHistory = new BillingHistoryModel({
      resourceGroup: payload.givenName,
      stripeCustomerId: payload.surname,
      userChargedAmount: payload.charge,
      actualAmountAzureCharged: payload.actualCharge,
      multiplier: payload.multiplier,
      billingTo: payload.billingTo,
      billingFrom: payload.billingFrom,
      status: payload.status,
      statusDescription: payload.statusDescription,
      createdAt: currentDateTime(),
      modifiedAt: currentDateTime()
    });

    billingHistory
      .save()
      .then((billingHistory) => {
        resolve(billingHistory);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const updateBillingHistory = (payload) => {
  return new Promise((resolve, reject) => {
    BillingHistoryModel.findOneAndUpdate(
      {
        _id: payload._id,
        billingTo: payload.billingTo,
        billingFrom: payload.billingFrom,
        resourceGroup: payload.givenName
      },
      {
        status: payload.status,
        statusDescription: payload.statusDescription,
        modifiedAt: currentDateTime()
      },
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    ).catch((err) => {
      reject(err);
    });
  });
};

//Azure Containers Usage API Call
function scheduleGetAndUpdateUsageDetailsInDb(pattern, timeZone) {
  var job = new CronJob(
    pattern,
    async () => {
      const d = new Date();
      logger.log("Job started at", d.getMinutes());

      try {
        var accessToken = await azureClient.getAccessToken();

        if (!accessToken) {
          logger.log("access token not found");
          return;
        }
      } catch (err) {
        logger.log(err, "error", "accesstoken", true);
      }

      //get usage from azure for resource groups
      try {
        var usageInfo = await getBillingInfoByFilters(accessToken);

        if (!usageInfo) {
          logger.log("usage record(s) not found");
          return;
        }
      } catch (err) {
        logger.log(err, "error", "billing", true);
        return;
      }

      //save usage details in DB
      try {
        updateUsageInDb(usageInfo);
      } catch (err) {
        console.error(err);
        return;
      }

      let usageResourceGroups = usageInfo.properties.rows;

      logger.log("Usage: ", usageResourceGroups);

      //get all resource groups available in azure
      try {
        var resourceInfo = await getResourcesInfo(accessToken);
        var resourceGroups = resourceInfo[0].resourceGroups;

        if (!resourceInfo && resourceGroups.length <= 0) {
          logger.log(
            "resource(s) group not found",
            "error",
            "resourcegroups",
            true
          );
          return;
        }
      } catch (err) {
        logger.log(err, "error", "resourcegroups", true);
      }

      logger.log("All resource groups: ", resourceGroups);

      //filter out resource groups that are not in usage records of azure
      let filteredResourceGroups = resourceGroups.filter((group) => {
        let index = usageResourceGroups.findIndex(
          (innerGroup) =>
            innerGroup[1].toLowerCase() === group.name.toLowerCase()
        );

        if (index <= -1) {
          return false;
        }

        group.amount = usageResourceGroups[index][0];
        return true;
      });

      // filter resource groups which do not have owner attribute
      filteredResourceGroups = filteredResourceGroups.filter(
        (group) => group.tags && group.tags.owner
      );

      let resourceGroupsFromDb = [];
      await getResourceGroupsFromDB()
        .then((rgs) => {
          resourceGroupsFromDb = [...rgs];
        })
        .catch((err) => logger.log(err));

      //add multiplier and amount to charge respective resource group in filteredResourceGroups array
      filteredResourceGroups.forEach((fRg) => {
        let isMultiplierAdded = false;
        resourceGroupsFromDb.forEach((rg) => {
          if (fRg.name === rg.name) {
            isMultiplierAdded = true;
            fRg.multiplier = rg.multiplier;
            fRg.multipliedAmount = fRg.amount * rg.multiplier;
          }
        });
        //if multiplier for respective rg not found then set default multiplier values
        if (!isMultiplierAdded) {
          const defaultMultiplier = resourceGroupsFromDb.find(
            (rg) => rg.name === "default"
          );
          fRg.multiplier = defaultMultiplier.multiplier;
          fRg.multipliedAmount = fRg.amount * defaultMultiplier.multiplier;
        }
      });

      logger.log("Filtered resource groups: ", filteredResourceGroups);

      //get all users available in azure
      try {
        var users = await getAllUsers();

        if (!users) {
          logger.log("user(s) not found");
          return;
        }
      } catch (err) {
        console.error(err);
      }

      logger.log("All users:", users);

      //filtering users who are not admin and have the resource group from azure that has to be charged
      let usersToBeCharged = users.filter((user) => {
        let index = filteredResourceGroups.findIndex(
          (group) => group.tags.owner === user.userPrincipalName
        );

        return index > -1 && user.streetAddress !== "admin";
      });

      if (usersToBeCharged.length <= 0) {
        logger.log("There is no user to be charged");
        return;
      }

      //adding amount charge information in each respective users
      usersToBeCharged = usersToBeCharged.map((user) => {
        let newUser = { ...user };

        filteredResourceGroups.forEach((group) => {
          if (group.tags.owner === newUser.userPrincipalName) {
            newUser.multiplier = group.multiplier;
            newUser.actualCharge = Math.ceil(group.amount);
            newUser.charge = Math.ceil(group.multipliedAmount);
          }
        });

        return newUser;
      });

      logger.log("Users to be charged: ", usersToBeCharged);

      //charging each filterred user on stripe
      usersToBeCharged.forEach((user) => {
        user.billingFrom = dayMinusFromTodayDate(8);
        user.billingTo = dayMinusFromTodayDate(1);

        userChargeCycle(user)
          .then((user) => {
            logger.log(user.statusDescription);
            createBillingHistory(user)
              .then(() =>
                logger.log(
                  `Billing history record successfully created in database`
                )
              )
              .catch((err) => {
                logger.log(
                  `Error in creating billing history record in database`
                );
              });
          })
          .catch((user) => {
            logger.log(user.statusDescription);
            createBillingHistory(user)
              .then(() =>
                logger.log(
                  `Billing history record successfully created in database`
                )
              )
              .catch((err) => {
                logger.log(
                  `Error in creating billing history record in database`
                );
              });
          });
      });
    },
    null,
    true,
    timeZone
  );

  job.start();
}

function userChargeCycle(user) {
  return new Promise((resolve, reject) => {
    //converting dollar into cents
    const amount = Math.ceil(user.charge * 100);
    const customerID = user.surname || "";
    const currency = "usd";

    stripeClient
      .getCustomer(customerID)
      .then((result) => {
        if (
          result &&
          result.value &&
          result.value.invoice_settings &&
          result.value.invoice_settings.default_payment_method
        ) {
          let paymentMethodID =
            result.value.invoice_settings.default_payment_method;

          stripeClient
            .createPaymentIntent(amount, currency, paymentMethodID, customerID)
            .then((result) => {
              const { last_payment_error } = result.value;
              if (last_payment_error === null) {
                user.status = true;
                user.statusDescription = "User has been charged successfully";
                resolve(user);
              } else {
                user.status = false;
                user.statusDescription =
                  last_payment_error.decline_code || "Unknown error occured";
                reject(user);
              }
            })
            .catch((err) => {
              logger.log(err.status);
              user.status = false;
              user.statusDescription = err.status || "Unknown error occured";
              reject(user);
            });
        } else {
          user.status = false;
          user.statusDescription = "Default payment method was not found";
          reject(user);
        }
      })
      .catch((err) => {
        logger.log(err.status);
        user.status = false;
        user.statusDescription = err.status || "Unknown error occured";
        reject(user);
      });
  });
}

async function updateUsageInDb(usageInfo) {
  usageInfo = usageInfo.properties;

  const usage = new UsageModel({
    data: usageInfo
  });

  usage.save();
}

async function getAllUsers() {
  try {
    var accessToken = await azureClient.getAccessToken(
      azureClient.graphResource
    );
  } catch (err) {
    logger.log("Failed to get accessToken", "error", "accesstoken", true);
    return;
  }

  try {
    var resp = await azureClient.getUsers(accessToken);
    resp = await JSON.parse(resp).value;
    return resp;
  } catch (err) {
    logger.log("Failed to get users(s)" + err);
  }
}

//-----------------------------------------------------------------------------
// Set up the Mongoose
//-----------------------------------------------------------------------------
Mongoose.connect(mongodbUrl, {
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true
});

const db = Mongoose.connection;

db.on("error", (err) => {
  throw `Error in connecting MongoDB:\n ${err}`;
});

db.on("connected", () => {
  logger.log("MongoDB is up and running!", "info", "mongodb", true);
  logger.log("Server Started!");
  console.log(`Server URL: http://localhost:${expressPort}`);

  // configuring routes here
  require("./routes/index")(app);

  app.listen(expressPort);

  if (enableBillingCron) {
    logger.log("Billing Cron setup started...", "info", "stripebilling", true);
    // cron expression in words: at 23:45 on Friday in every month from January through December
    scheduleGetAndUpdateUsageDetailsInDb("0 45 23 * 1/1 5", null);
  } else {
    logger.log(
      "**************************************",
      "info",
      "stripebilling",
      true
    );
    logger.log("Billing Cron has been disabled", "info", "stripebilling", true);
    logger.log(
      "**************************************",
      "info",
      "stripebilling",
      true
    );
  }
});

////////////////////////// Container Cron Setup //////////////////////////
try {
  cronClient.createRefreshCronObject(
    cronRefreshPattern,
    null,
    tenantId,
    subscriptionId,
    clientId,
    clientSecret,
    apiVersion
  );
} catch (err) {
  logger.log("Failed to get subscription container(s) / setup cron" + err);
  if (typeof err == "string") {
  }
}

////////////////////////// Virtual Machine Cron Setup //////////////////////////
try {
  cronVMClient.createRefreshCronObject(
    cronVMRefreshPattern,
    null,
    tenantId,
    subscriptionId,
    clientId,
    clientSecret,
    apiVersion,
    vmapiVersion
  );
} catch (err) {
  logger.log("Failed to get subscription VM(s) / setup cron" + err);
  if (typeof err == "string") {
  }
}

////////////////////////// Containers Mail Cron Setup //////////////////////////
try {
  mailContainerClient.setupMailCron(
    mailCronPattern,
    defaultTimeZone,
    email,
    mailPassword,
    adminMail,
    redirectUrl,
    azureClient
  );
} catch (err) {
  logger.log("Failed to setup e-mail cron" + err);
  if (typeof err == "string") {
  }
}

////////////////////////// Trivera Containers Mail Cron Setup //////////////////////////
try {
  mailTriveraContainerClient.setupTriveraMailCron(
    "0 19 */2 * *",
    defaultTimeZone,
    email,
    mailPassword,
    "TeamNesto@triveratech.com",
    redirectUrl,
    azureClient
  );
} catch (err) {
  logger.log("Failed to setup e-mail cron" + err);
  if (typeof err == "string") {
  }
}

////////////////////////// LivenessProbe Mail Cron Setup //////////////////////////
try {
  mailContainerClient.setupLivenessProbeMailCron(
    livenessProbeCronPattern,
    defaultTimeZone,
    email,
    mailPassword,
    adminMail,
    redirectUrl,
    azureClient
  );
} catch (err) {
  logger.log("Failed to setup livenessprobe e-mail cron" + err);
  if (typeof err == "string") {
  }
}

////////////////////////// VM Mail Cron Setup //////////////////////////
try {
  mailVMClient.setupVMMailCron(
    mailCronPattern,
    defaultTimeZone,
    email,
    mailPassword,
    adminMail,
    redirectUrl,
    azureClient
  );
} catch (err) {
  logger.log("Failed to setup e-mail cron" + err);
  if (typeof err == "string") {
  }
}

////////////////////////// Cost Analysis Cron Setup //////////////////////////
try {
  mailCostAnalysisClient.setupCAMailCron(
    mailCronPattern,
    defaultTimeZone,
    email,
    mailPassword,
    adminMail,
    redirectUrl,
    azureClient,
    costAnalysisClient,
    billingAccountId,
    costAnalysisapiVersion
  );
} catch (err) {
  logger.log("Failed to setup cost analysis e-mail cron" + err);
  if (typeof err == "string") {
  }
}


////////////////////////// Dashboard Graph Client Setup //////////////////////////
dashboardGraphClient.setupGraphClient(
  azureClient
);