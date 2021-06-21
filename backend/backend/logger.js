var fs = require("fs");
var util = require('util');

var logfilesPath = "./logs"
var main_file = fs.createWriteStream(logfilesPath + '/main.log', { flags: 'w' });

var fileLogger = {

    debug: fs.createWriteStream(logfilesPath + '/debug.log', { flags: 'w' }),
    info: fs.createWriteStream(logfilesPath + '/info.log', { flags: 'w' }),
    error: fs.createWriteStream(logfilesPath + '/error.log', { flags: 'w' }),
    others: fs.createWriteStream(logfilesPath + '/others.log', { flags: 'w' }),
    users: fs.createWriteStream(logfilesPath + '/users.log', { flags: 'w' }),
    accessToken: fs.createWriteStream(logfilesPath + '/accessToken.log', { flags: 'w' }),
    billing: fs.createWriteStream(logfilesPath + '/billing.log', { flags: 'w' }),
    stripe: fs.createWriteStream(logfilesPath + '/stripe.log', { flags: 'w' }),
    containers: fs.createWriteStream(logfilesPath + '/containers.log', { flags: 'w' }),
    mongodb: fs.createWriteStream(logfilesPath + '/mongodb.log', { flags: 'w' }),
    resourcegroups: fs.createWriteStream(logfilesPath + '/resourcegroups.log', { flags: 'w' }),
    database: fs.createWriteStream(logfilesPath + '/database.log', { flags: 'w' }),
    stripebilling: fs.createWriteStream(logfilesPath + '/stripebilling.log', { flags: 'w' })
}

var validLogLevel = ["info", "debug", "error"];
var validLogType = ["others", "users", "containers", "resourcegroups", "billing", "stripebilling", "stripebilling"];


function islogValid(logLevel, logType) {
    return (
        validLogLevel.indexOf(logLevel) > -1
    );
    //  && validLogType.indexOf(logType) > -1
}

function log(message, logLevel, logType, logtoConsole) {
    try {
        var logTime = new Date().toISOString().
            replace(/T/, ' ').      // replace T with a space
            replace(/\..+/, '')

        message = logTime + " " + message;
        main_file.write(util.format(message) + '\n');

        if (islogValid(logLevel)) {
            fileLogger[logLevel].write(util.format(message) + '\n');
            fileLogger[logType].write(util.format(message) + '\n');
        }
        else {
            fileLogger["debug"].write(util.format("[Default logLevel] " + message) + '\n');
            // console.log("Invalid log level:", logLevel, logType, false);
        }

        if (logtoConsole)
            console.log(message);

    } catch (err) {
        console.log("Error writing logs:" + err.message);
    }

}


module.exports.log = log;

log('Logger Started ...');

