/**
 * Database APIs by Ather
 */

const CronHistoryModel = require("../../models/cronHistory");


// Cron History Data in Database
const getCronHistory = () => {
    return new Promise((resolve, reject) => {
        CronHistoryModel.find(
            {},
            null,
            {
                sort: {
                    $natural: -1
                }
            },
            (err, history) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(history);
                }
            }).catch((err) => {
                reject(err);
            });
    });
};

const getCronHistoryByResourceGroup = (resourcegroup) => {
    return new Promise((resolve, reject) => {
        CronHistoryModel.find(
            {
                "resourceGroup":
                    { $regex: new RegExp("^" + resourcegroup.toLowerCase(), "i") }
            },
            null,
            {
                sort: {
                    $natural: -1
                }
            },
            (err, history) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(history);
                }
            }
        ).catch((err) => {
            reject(err);
        });
    });
};


const createCronHistory = (cronHistory) => {
    return new Promise((resolve, reject) => {
        const history = new CronHistoryModel(cronHistory);

        history
            .save()
            .then((history) => {
                resolve(history);
            })
            .catch((err) => {
                reject(err);
            });
    });
};


module.exports.getCronHistory = getCronHistory;
module.exports.getCronHistoryByResourceGroup = getCronHistoryByResourceGroup;
module.exports.createCronHistory = createCronHistory;

