/**
 * Example schema (Model) creation to understand how mongoose and mongodb work
 */

/**
 * import the mongoose package
 */
const Mongoose = require("mongoose");

/**
 * define a schema
 */
const Schema = Mongoose.Schema;

const cronHistorySchema = new Schema({
  id: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  resourceGroup: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  timezone: {
    type: String,
  },
  scheduledDateRange: {
    type: String,
    required: true,
  },
  scheduledTime: {
    type: String,
    required: true,
  },
  triggedDate: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
});

module.exports = Mongoose.model("cronHistory", cronHistorySchema);
