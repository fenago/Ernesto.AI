require("dotenv").config();

var express = require("express");
var session = require("express-session");
var bodyParser = require("body-parser");
var path = require("path");
const Mongoose = require("mongoose");
const BodyParser = require("body-parser");
var passport = require("passport");
var cookieParser = require("cookie-parser");
var methodOverride = require("method-override");

var azureClient = require("./config/azure/helper");
var config = require("./services/constantsServices/azureContantService/azureDefaultConstantService");

var expressPort = process.env.port;
var webauth_clientId = process.env.webauth_clientId;
var webauth_clientSecret = process.env.webauth_clientSecret;
var subscriptionId = process.env.subscriptionId || process.env.SubscriptionId;
var clientId = process.env.clientId;
var clientSecret = process.env.clientSecret;
var tenantId = process.env.tenantId;
var redirectUrl = process.env.redirectUrl;
var billingAccountId = process.env.billingAccountId;
const mongodbUrl = process.env.mongodbUrl;

console.log("Environment!!!");
console.log("expressPort: " + expressPort);
console.log("subscriptionId: " + subscriptionId);
console.log("clientId: " + clientId);
console.log("clientSecret: " + clientSecret);
console.log("tenantId: " + tenantId);
console.log("billingAccountId: " + billingAccountId);
console.log("webauthClientId: " + webauth_clientId);
console.log("webauthClientSecret: " + webauth_clientSecret);
console.log("redirectUrl: " + redirectUrl);
console.log("mongodbUrl: " + mongodbUrl);

if (
  expressPort == undefined ||
  subscriptionId == undefined ||
  clientId == undefined ||
  clientSecret == undefined ||
  tenantId == undefined ||
  billingAccountId == undefined ||
  webauth_clientId == undefined ||
  webauth_clientSecret == undefined ||
  redirectUrl == undefined ||
  mongodbUrl == undefined
) {
  console.log(process.env);
  console.log("expressPort: " + expressPort);
  console.log("subscriptionId: " + subscriptionId);
  console.log("clientId: " + clientId);
  console.log("clientSecret: " + clientSecret);
  console.log("tenantId: " + tenantId);
  console.log("web clientId: " + webauth_clientId);
  console.log("webauth_clientSecret: " + webauth_clientSecret);
  console.log("redirectUrl: " + redirectUrl);
  console.log("mongodbUrl: " + mongodbUrl);
  throw "Missing environment variable(s)";
}

config.creds.clientID = webauth_clientId;
config.creds.clientSecret = webauth_clientSecret;
config.creds.identityMetadata = `https://login.microsoftonline.com/${tenantId}/v2.0/.well-known/openid-configuration`;
config.destroySessionUrl = config.destroySessionUrl + redirectUrl;
config.creds.redirectUrl = redirectUrl + "/auth/openid/return";

//setup azure
azureClient.setupAzureConfig(
  subscriptionId,
  clientId,
  clientSecret,
  tenantId,
  billingAccountId,
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
    console.log(
      "we are using user: " + JSON.stringify(user),
      "debug",
      "users",
      false,
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
          accessToken,
        );
        var subContainers = JSON.parse(subContainersResp);
        var studentContainerArr = subContainers.value.filter(function (
          containerData,
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
            message: "Unknown username(container dns)",
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
          containerResourceId: containerId,
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
          accessToken,
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
          "/",
        )[4];
        // get NIC to get virtual machine id
        var respNIC = await azureClient.getNetworkInterface(
          accessToken,
          resourceGroupName,
          nicName,
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
          nicResourceId: nicResourceId,
        });
      } catch (err) {
        return done(null, false, { message: err });
      }
    } else {
      return done(null, false, { message: "Unknown username(dns)" });
    }
  }),
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
      clockSkew: config.creds.clockSkew,
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
    },
  ),
);

var app = express();
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  }),
);

app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb", extended: true }));
app.use(express.static(path.join(__dirname, "../public/")));
app.use(methodOverride());
app.use(cookieParser());
app.use(BodyParser.json());
app.use(
  BodyParser.urlencoded({
    extended: false,
  }),
);

// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());

app.use(async function (req, res, next) {
  if (req.user != undefined && req.user.userInfo == undefined) {
    // check if student is loggedin
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
          "Failed to get Resource Group associated with this account! Please contact administrator",
      });
      return;
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
    req.user = {};
    req.user.userType = process.env.testUserType || "admin";
    req.user.resourceGroup = process.env.testResourceGroup || "";
    console.log(
      `Testing mode: ${req.user.userType}, ${req.user.resourceGroup}`,
    );
  }

  if (req.isAuthenticated()) {
    return next();
  }
  res.send(403, {
    error: "Forbidden! Please login again",
  });
}

app.get(
  "/login",
  function (req, res, next) {
    passport.authenticate("azuread-openidconnect", {
      response: res, // required
      failureRedirect: "/",
    })(req, res, next);
  },
  function (req, res) {
    console.log("Login was called");
    res.redirect("/home");
  },
);

app.get("/home", checkLoginStatus, function (request, response) {
  response.redirect("/#/");
});

app.get("/", checkLoginStatus, function (request, response) {
  response.redirect("/home");
});

function checkLoginStatus(req, res, next) {
  if (req.isAuthenticated()) {
    if (req.user.resourceGroup == undefined) {
      res.send(500, {
        code: "ResourceGroupNotFound",
        error:
          "No Resource Group associated with this account! Please contact administrator",
      });
      return;
    }

    return next();
  }
  res.redirect("/loginad");
}

app.get("/loginad", function (request, response) {
  response.redirect("/#/login");
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
      failureRedirect: "/",
    })(req, res, next);
  },
  function (req, res) {
    console.log("We received a return from AzureAD.");
    res.redirect("/");
  },
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
      failureRedirect: "/",
    })(req, res, next);
  },
  function (req, res) {
    console.log("We received a return from AzureAD.");
    res.redirect("/home");
  },
);

// 'logout' route, logout from passport, and destroy the session with AAD.
app.get("/logout", function (req, res) {
  req.session.destroy(function (err) {
    req.logOut();
    res.redirect(config.destroySessionUrl);
  });
});

// returns logged in userinfo (using azure AD)
app.get("/userinfo", ensureAuthenticated, async function (req, res) {
  // directly return info for student user (non azureAD user)
  var userid = req.user.oid;

  try {
    var accessToken = await azureClient.getAccessToken(
      azureClient.graphResource,
    );
  } catch (err) {
    console.log("Failed to get accessToken", "error", "accesstoken", true);
    res.send(500, err.error);
    return;
  }

  try {
    var resp = await azureClient.getUser(accessToken, userid);
    res.send(resp);
  } catch (err) {
    console.log("Failed to get users" + err);
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
      azureClient.graphResource,
    );
  } catch (err) {
    console.log("Failed to get accessToken", "error", "accesstoken", true);
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
    console.log("Failed to get users(s)" + err);
    if (typeof err == "string") {
      res.send(500, { error: err });
    }

    res.send(500, err.error);
  }
});

async function getUserDetails(userid) {
  try {
    var accessToken = await azureClient.getAccessToken(
      azureClient.graphResource,
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

//-----------------------------------------------------------------------------
// Set up the Mongoose
//-----------------------------------------------------------------------------
Mongoose.connect(mongodbUrl, {
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
  createIndexes: true,
});

const db = Mongoose.connection;

db.on("error", (err) => {
  throw `Error in connecting MongoDB:\n ${err}`;
});

db.on("connected", () => {
  console.log("MongoDB is up and running!", "info", "mongodb", true);
  console.log("Server Started!");
  console.log(`Server URL: http://localhost:${expressPort}`);

  // configuring routes here
  // require("./routes/index")(app);

  app.listen(expressPort);
});
