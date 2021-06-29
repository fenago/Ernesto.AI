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

const billingHistorySchema = new Schema({
  resourceGroup: {
    type: String
  },
  stripeCustomerId: {
    type: String
  },
  userChargedAmount: {
    type: Number
  },
  actualAmountAzureCharged: {
    type: String
  },
  multiplier: {
    type: Number
  },
  billingTo: {
    type: String
  },
  billingFrom: {
    type: String
  },
  status: {
    type: Boolean
  },
  statusDescription: {
    type: String
  },
  createdAt: {
    type: String
  },
  modifiedAt: {
    type: String
  }
});

module.exports = Mongoose.model("billingHistory", billingHistorySchema);
