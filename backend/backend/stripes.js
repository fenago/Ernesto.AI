var stripe;
var utils = require("./utils");

function setupStripe(api_key) {
  stripe = require("stripe")(api_key);
}

function createStripeCustomer(name, email, phone, address) {
  return new Promise(function (resolve, reject) {
    stripe.customers.create(
      {
        name: name,
        email: email,
        phone: phone,
        // address: address,
        description: "fenago container customer"
      },
      function (err, customer) {
        // asynchronously called
        console.log("");
        if (customer != undefined)
          resolve(
            utils.registerJSONresponse("StripeCustomer", "Created", customer)
          );
        else {
          console.log(err);
          reject(utils.registerJSONresponse("StripeCustomer", err));
        }
      }
    );
  });
}

function getPaymentMethods(id, type, limit) {
  return new Promise(function (resolve, reject) {
    stripe.paymentMethods.list(
      { customer: id, type: type, limit: limit },
      function (err, paymentMethods) {
        if (paymentMethods)
          resolve(
            utils.registerJSONresponse(
              "StripePaymentMethods",
              "Retrieved",
              paymentMethods.data
            )
          );
        else {
          console.log(err);
          reject(utils.registerJSONresponse("StripePaymentMethods", err));
        }
      }
    );
  });
}

function detachPaymentMethod(id) {
  return new Promise(function (resolve, reject) {
    stripe.paymentMethods.detach(id, function (err, paymentMethod) {
      if (paymentMethod)
        resolve(
          utils.registerJSONresponse(
            "StripePaymentMethods",
            "Detached",
            paymentMethod
          )
        );
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripePaymentMethods", err));
      }
    });
  });
}

function attachPaymentMethod(paymentMethodID, customerID) {
  return new Promise(function (resolve, reject) {
    stripe.paymentMethods.attach(
      paymentMethodID,
      { customer: customerID },
      function (err, paymentMethod) {
        if (paymentMethod)
          resolve(
            utils.registerJSONresponse(
              "StripePaymentMethods",
              "Attached",
              paymentMethod
            )
          );
        else {
          console.log(err);
          reject(utils.registerJSONresponse("StripePaymentMethods", err));
        }
      }
    );
  });
}

function getCustomer(id) {
  return new Promise(function (resolve, reject) {
    stripe.customers.retrieve(id, function (err, customer) {
      if (customer)
        resolve(
          utils.registerJSONresponse("StripeCustomer", "Retrieved", customer)
        );
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripeCustomer", err));
      }
    });
  });
}

function updateCustomer(customerID, paymentMethodID) {
  return new Promise(function (resolve, reject) {
    stripe.customers.update(
      customerID,
      { "invoice_settings[default_payment_method]": paymentMethodID },
      function (err, customer) {
        if (customer)
          resolve(
            utils.registerJSONresponse("StripeCustomer", "Updated", customer)
          );
        else {
          console.log(err);
          reject(utils.registerJSONresponse("StripeCustomer", err));
        }
      }
    );
  });
}

function deleteCustomer(id) {
  return new Promise(function (resolve, reject) {
    stripe.customers.del(id, function (err, confirmation) {
      if (confirmation)
        resolve(
          utils.registerJSONresponse("StripeCustomer", "Deleted", confirmation)
        );
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripeCustomer", err));
      }
    });
  });
}

function getCustomers(limit = 10) {
  return new Promise(function (resolve, reject) {
    stripe.customers.list({ limit: limit }, function (err, customers) {
      if (customers)
        resolve(
          utils.registerJSONresponse("StripeCustomer", "Retrieved", customers)
        );
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripeCustomer", err));
      }
    });
  });
}

function createSetupIntent(id) {
  return new Promise(function (resolve, reject) {
    stripe.setupIntents.create(
      { customer: id, payment_method_types: ["card"] },
      function (err, setupIntent) {
        if (setupIntent)
          resolve(
            utils.registerJSONresponse(
              "StripeSetupIntent",
              "Created",
              setupIntent
            )
          );
        else {
          console.log(err);
          reject(utils.registerJSONresponse("StripeSetupIntent", err));
        }
      }
    );
  });
}

function createPaymentIntent(amount, currency, paymentMethodID, customerID) {
  return new Promise(function (resolve, reject) {
    stripe.paymentIntents.create(
      {
        amount: amount,
        currency: currency,
        customer: customerID,
        payment_method: paymentMethodID,
        off_session: true,
        confirm: true,
        payment_method_types: ["card"]
      },
      function (err, paymentIntent) {
        if (paymentIntent)
          resolve(
            utils.registerJSONresponse(
              "StripePaymentIntent",
              "Created",
              paymentIntent
            )
          );
        else {
          console.log(err);
          reject(utils.registerJSONresponse("StripePaymentIntent", err));
        }
      }
    );
  });
}

function createUsageRecord(id, quantity, timestamp) {
  return new Promise(function (resolve, reject) {
    stripe.subscriptionItems.createUsageRecord(
      id,
      { quantity: quantity, timestamp: timestamp, action: "increment" },
      function (err, usageRecord) {
        if (usageRecord)
          resolve(
            utils.registerJSONresponse(
              "StripeUsageRecord",
              "Created",
              usageRecord
            )
          );
        else {
          console.log(err);
          reject(utils.registerJSONresponse("StripeUsageRecord", err));
        }
      }
    );
  });
}

function getUsageRecord(id, limit = 10) {
  return new Promise(function (resolve, reject) {
    stripe.subscriptionItems.listUsageRecordSummaries(
      id,
      { limit: limit },
      function (err, usageRecords) {
        if (usageRecords)
          resolve(
            utils.registerJSONresponse(
              "StripeUsageRecords",
              "Retrieved",
              usageRecords
            )
          );
        else {
          console.log(err);
          reject(utils.registerJSONresponse("StripeUsageRecords", err));
        }
      }
    );
  });
}

function createProduct(name) {
  return new Promise(function (resolve, reject) {
    stripe.products.create({ name: name }, function (err, product) {
      if (product)
        resolve(
          utils.registerJSONresponse("StripeProduct", "Created", product)
        );
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripeProduct", err));
      }
    });
  });
}

function getProduct(id) {
  return new Promise(function (resolve, reject) {
    stripe.products.retrieve(id, function (err, product) {
      if (product)
        resolve(
          utils.registerJSONresponse("StripeProduct", "Retrieved", product)
        );
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripeProduct", err));
      }
    });
  });
}

function updateProduct(id, metadata, name) {
  return new Promise(function (resolve, reject) {
    stripe.products.update(id, { metadata: metadata, name: name }, function (
      err,
      product
    ) {
      if (product)
        resolve(
          utils.registerJSONresponse("StripeProduct", "Updated", product)
        );
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripeProduct", err));
      }
    });
  });
}

function getProducts(limit = 10) {
  return new Promise(function (resolve, reject) {
    stripe.products.list({ limit: limit }, function (err, products) {
      if (products)
        resolve(
          utils.registerJSONresponse("StripeProduct", "Retrieved", products)
        );
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripeProduct", err));
      }
    });
  });
}

function deleteProduct(id) {
  return new Promise(function (resolve, reject) {
    stripe.products.del(id, function (err, confirmation) {
      if (confirmation)
        resolve(
          utils.registerJSONresponse("StripeProduct", "Deleted", confirmation)
        );
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripeProduct", err));
      }
    });
  });
}

function createPrice(
  productID,
  currency = "usd",
  interval = "week",
  usageType = "metered",
  unitAmount = 1
) {
  return new Promise(function (resolve, reject) {
    stripe.prices.create(
      {
        currency: currency,
        recurring: {
          interval: interval,
          usage_type: usageType
        },
        product: productID,
        unit_amount: unitAmount
      },
      function (err, price) {
        if (price)
          resolve(utils.registerJSONresponse("StripePrice", "Created", price));
        else {
          console.log(err);
          reject(utils.registerJSONresponse("StripePrice", err));
        }
      }
    );
  });
}

function getPrice(id) {
  return new Promise(function (resolve, reject) {
    stripe.prices.retrieve(id, function (err, price) {
      if (price)
        resolve(utils.registerJSONresponse("StripePrice", "Retrieved", price));
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripePrice", err));
      }
    });
  });
}

function updatePrice(id, metadata, active, nickname) {
  return new Promise(function (resolve, reject) {
    stripe.prices.update(
      id,
      { active: active, metadata: metadata, nickname: nickname },
      function (err, price) {
        if (price)
          resolve(utils.registerJSONresponse("StripePrice", "Updated", price));
        else {
          console.log(err);
          reject(utils.registerJSONresponse("StripePrice", err));
        }
      }
    );
  });
}

function getPrices(limit = 10) {
  return new Promise(function (resolve, reject) {
    stripe.prices.list({ limit: limit }, function (err, prices) {
      if (prices)
        resolve(utils.registerJSONresponse("StripePrice", "Retrieved", prices));
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripePrice", err));
      }
    });
  });
}

function createSubscription(customerID, priceID) {
  return new Promise(function (resolve, reject) {
    stripe.subscriptions.create(
      {
        customer: customerID,
        items: [{ price: priceID }]
      },
      function (err, subscription) {
        if (subscription)
          resolve(
            utils.registerJSONresponse(
              "StripeSubscription",
              "Created",
              subscription
            )
          );
        else {
          console.log(err);
          reject(utils.registerJSONresponse("StripeSubscription", err));
        }
      }
    );
  });
}

function getSubscription(id) {
  return new Promise(function (resolve, reject) {
    stripe.subscriptions.retrieve(id, function (err, subscription) {
      if (subscription)
        resolve(
          utils.registerJSONresponse(
            "StripeSubscription",
            "Retrieved",
            subscription
          )
        );
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripeSubscription", err));
      }
    });
  });
}

function updateSubscription(id, metadata, cancelAtPeriodEnd) {
  return new Promise(function (resolve, reject) {
    stripe.subscriptions.update(
      id,
      { metadata: metadata, cancel_at_period_end: cancelAtPeriodEnd },
      function (err, subscription) {
        if (subscription)
          resolve(
            utils.registerJSONresponse(
              "StripeSubscription",
              "Updated",
              subscription
            )
          );
        else {
          console.log(err);
          reject(utils.registerJSONresponse("StripeSubscription", err));
        }
      }
    );
  });
}

function cancelSubscription(id) {
  return new Promise(function (resolve, reject) {
    stripe.subscriptions.del(id, function (err, confirmation) {
      if (confirmation)
        resolve(
          utils.registerJSONresponse(
            "StripeSubscription",
            "Canceled",
            confirmation
          )
        );
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripeSubscription", err));
      }
    });
  });
}

function getSubscriptions(limit = 10) {
  return new Promise(function (resolve, reject) {
    stripe.subscriptions.list({ limit: limit }, function (err, subscriptions) {
      if (subscriptions)
        resolve(
          utils.registerJSONresponse(
            "StripeSubscription",
            "Retrieved",
            subscriptions
          )
        );
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripeSubscription", err));
      }
    });
  });
}

function createInvoice(customerID) {
  return new Promise(function (resolve, reject) {
    stripe.invoices.create({ customer: customerID }, function (err, invoice) {
      if (invoice)
        resolve(
          utils.registerJSONresponse("StripeInvoice", "Created", invoice)
        );
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripeInvoice", err));
      }
    });
  });
}

function getInvoice(id) {
  return new Promise(function (resolve, reject) {
    stripe.invoices.retrieve(id, function (err, invoice) {
      if (invoice)
        resolve(
          utils.registerJSONresponse("StripeInvoice", "Retrieved", invoice)
        );
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripeInvoice", err));
      }
    });
  });
}

function updateInvoice(id, metadata, description) {
  return new Promise(function (resolve, reject) {
    stripe.invoices.update(
      id,
      { metadata: metadata, description: description },
      function (err, invoice) {
        if (invoice)
          resolve(
            utils.registerJSONresponse("StripeInvoice", "Updated", invoice)
          );
        else {
          console.log(err);
          reject(utils.registerJSONresponse("StripeInvoice", err));
        }
      }
    );
  });
}

function deleteInvoice(id) {
  return new Promise(function (resolve, reject) {
    stripe.invoices.del(id, function (err, confirmation) {
      if (confirmation)
        resolve(
          utils.registerJSONresponse("StripeInvoice", "Deleted", confirmation)
        );
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripeInvoice", err));
      }
    });
  });
}

function getInvoices(limit = 10) {
  return new Promise(function (resolve, reject) {
    stripe.invoices.list({ limit: limit }, function (err, invoices) {
      if (invoices)
        resolve(
          utils.registerJSONresponse("StripeInvoice", "Retrieved", invoices)
        );
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripeInvoice", err));
      }
    });
  });
}

//charges
function createCharge(amount, currency = "usd", source = "tok_visa") {
  return new Promise(function (resolve, reject) {
    stripe.charges.create(
      {
        amount: amount,
        currency: currency,
        source: source
      },
      function (err, charge) {
        if (charge)
          resolve(
            utils.registerJSONresponse("StripeCharge", "Created", charge)
          );
        else {
          console.log(err);
          reject(utils.registerJSONresponse("StripeCharge", err));
        }
      }
    );
  });
}

function getCharge(id) {
  return new Promise(function (resolve, reject) {
    stripe.charges.retrieve(id, function (err, charge) {
      if (charge)
        resolve(
          utils.registerJSONresponse("StripeCharge", "Retrieved", charge)
        );
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripeCharge", err));
      }
    });
  });
}

function updateCharge(id, metadata, description) {
  return new Promise(function (resolve, reject) {
    stripe.charges.update(
      id,
      { metadata: metadata, description: description },
      function (err, charge) {
        if (charge)
          resolve(
            utils.registerJSONresponse("StripeCharge", "Updated", charge)
          );
        else {
          console.log(err);
          reject(utils.registerJSONresponse("StripeCharge", err));
        }
      }
    );
  });
}

function captureCharge(id) {
  return new Promise(function (resolve, reject) {
    stripe.charges.capture(id, function (err, charge) {
      if (charge)
        resolve(utils.registerJSONresponse("StripeCharge", "Captured", charge));
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripeCharge", err));
      }
    });
  });
}

function getCharges(limit = 10) {
  return new Promise(function (resolve, reject) {
    stripe.charges.list({ limit: limit }, function (err, charges) {
      if (charges)
        resolve(
          utils.registerJSONresponse("StripeCharge", "Retrieved", charges)
        );
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripeCharge", err));
      }
    });
  });
}

//balance
function getBalance() {
  return new Promise(function (resolve, reject) {
    stripe.balance.retrieve(function (err, balance) {
      if (balance)
        resolve(
          utils.registerJSONresponse("StripeBalance", "Retrieved", balance)
        );
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripeBalance", err));
      }
    });
  });
}

//balance transaction
function getBalanceTransaction(id) {
  return new Promise(function (resolve, reject) {
    stripe.balanceTransactions.retrieve(id, function (err, balanceTransaction) {
      if (balanceTransaction)
        resolve(
          utils.registerJSONresponse(
            "StripeBalanceTransaction",
            "Retrieved",
            balanceTransaction
          )
        );
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripeBalanceTransaction", err));
      }
    });
  });
}

function getBalanceTransactions(limit = 10) {
  return new Promise(function (resolve, reject) {
    stripe.balanceTransactions.list({ limit: 3 }, function (
      err,
      balanceTransactions
    ) {
      if (balanceTransactions)
        resolve(
          utils.registerJSONresponse(
            "StripeBalanceTransactions",
            "Retrieved",
            balanceTransactions
          )
        );
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripeBalanceTransactions", err));
      }
    });
  });
}

//dispute
function getDispute(id) {
  return new Promise(function (resolve, reject) {
    stripe.disputes.retrieve(id, function (err, dispute) {
      if (dispute)
        resolve(
          utils.registerJSONresponse("StripeDispute", "Retrieved", dispute)
        );
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripeDispute", err));
      }
    });
  });
}

function updateDispute(id, metadata) {
  return new Promise(function (resolve, reject) {
    stripe.disputes.update(id, { metadata: metadata }, function (err, dispute) {
      if (dispute)
        resolve(
          utils.registerJSONresponse("StripeDispute", "Updated", dispute)
        );
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripeDispute", err));
      }
    });
  });
}

function closeDispute(id) {
  return new Promise(function (resolve, reject) {
    stripe.disputes.close(id, function (err, dispute) {
      if (dispute)
        resolve(utils.registerJSONresponse("StripeDispute", "Closed", dispute));
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripeDispute", err));
      }
    });
  });
}

function getDisputes(limit = 10) {
  return new Promise(function (resolve, reject) {
    stripe.disputes.list({ limit: limit }, function (err, disputes) {
      if (disputes)
        resolve(
          utils.registerJSONresponse("StripeDispute", "Retrieved", disputes)
        );
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripeDispute", err));
      }
    });
  });
}

//payouts
function createPayout(amount, currency = "usd") {
  return new Promise(function (resolve, reject) {
    stripe.payouts.create(
      {
        amount: amount,
        currency: currency
      },
      function (err, payout) {
        if (payout)
          resolve(
            utils.registerJSONresponse("StripePayout", "Created", payout)
          );
        else {
          console.log(err);
          reject(utils.registerJSONresponse("StripePayout", err));
        }
      }
    );
  });
}

function getPayout(id) {
  return new Promise(function (resolve, reject) {
    stripe.payouts.retrieve(id, function (err, payout) {
      if (payout)
        resolve(
          utils.registerJSONresponse("StripePayout", "Retrieved", payout)
        );
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripePayout", err));
      }
    });
  });
}

function updatePayout(id, metadata) {
  return new Promise(function (resolve, reject) {
    stripe.payouts.update(id, { metadata: metadata }, function (err, payout) {
      if (payout)
        resolve(utils.registerJSONresponse("StripePayout", "Updated", payout));
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripePayout", err));
      }
    });
  });
}

function cancelPayout(id) {
  return new Promise(function (resolve, reject) {
    stripe.payouts.cancel(id, function (err, payout) {
      if (payout)
        resolve(utils.registerJSONresponse("StripePayout", "Canceled", payout));
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripePayout", err));
      }
    });
  });
}

function getPayouts(limit = 10) {
  return new Promise(function (resolve, reject) {
    stripe.payouts.list({ limit: limit }, function (err, payouts) {
      if (payouts)
        resolve(
          utils.registerJSONresponse("StripePayout", "Retrieved", payouts)
        );
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripePayout", err));
      }
    });
  });
}

//refunds
function createRefund(chargeID) {
  return new Promise(function (resolve, reject) {
    stripe.refunds.create(
      {
        charge: chargeID
      },
      function (err, refund) {
        if (refund)
          resolve(
            utils.registerJSONresponse("StripeRefund", "Created", refund)
          );
        else {
          console.log(err);
          reject(utils.registerJSONresponse("StripeRefund", err));
        }
      }
    );
  });
}

function getRefund(id) {
  return new Promise(function (resolve, reject) {
    stripe.refunds.retrieve(id, function (err, refund) {
      if (refund)
        resolve(
          utils.registerJSONresponse("StripeRefund", "Retrieved", refund)
        );
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripeRefund", err));
      }
    });
  });
}

function updateRefund(id, metadata) {
  return new Promise(function (resolve, reject) {
    stripe.refunds.update(id, { metadata: metadata }, function (err, refund) {
      if (refund)
        resolve(utils.registerJSONresponse("StripeRefund", "Updated", refund));
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripeRefund", err));
      }
    });
  });
}

function getRefunds(limit = 10) {
  return new Promise(function (resolve, reject) {
    stripe.refunds.list({ limit: limit }, function (err, refunds) {
      if (refunds)
        resolve(
          utils.registerJSONresponse("StripeRefund", "Retrieved", refunds)
        );
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripeRefund", err));
      }
    });
  });
}

//bank account
function createBankAccount(customerID, source) {
  return new Promise(function (resolve, reject) {
    stripe.customers.createSource(customerID, { source: source }, function (
      err,
      bankAccount
    ) {
      if (bankAccount)
        resolve(
          utils.registerJSONresponse(
            "StripeBankAccount",
            "Created",
            bankAccount
          )
        );
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripeBankAccount", err));
      }
    });
  });
}

function getBankAccount(customerID, bankAccountID) {
  return new Promise(function (resolve, reject) {
    stripe.customers.retrieveSource(customerID, bankAccountID, function (
      err,
      bankAccount
    ) {
      if (bankAccount)
        resolve(
          utils.registerJSONresponse(
            "StripeBankAccount",
            "Retrieved",
            bankAccount
          )
        );
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripeBankAccount", err));
      }
    });
  });
}

function updateBankAccount(
  customerID,
  bankAccountID,
  metadata,
  accountHolderName
) {
  return new Promise(function (resolve, reject) {
    stripe.customers.updateSource(
      customerID,
      bankAccountID,
      { metadata: metadata, account_holder_name: accountHolderName },
      function (err, bankAccount) {
        if (bankAccount)
          resolve(
            utils.registerJSONresponse(
              "StripeBankAccount",
              "Updated",
              bankAccount
            )
          );
        else {
          console.log(err);
          reject(utils.registerJSONresponse("StripeBankAccount", err));
        }
      }
    );
  });
}

function deleteBankAccount(customerID, bankAccountID) {
  return new Promise(function (resolve, reject) {
    stripe.customers.deleteSource(customerID, bankAccountID, function (
      err,
      confirmation
    ) {
      if (confirmation)
        resolve(
          utils.registerJSONresponse(
            "StripeBankAccount",
            "Deleted",
            confirmation
          )
        );
      else {
        console.log(err);
        reject(utils.registerJSONresponse("StripeBankAccount", err));
      }
    });
  });
}

function getBankAccounts(customerID, limit = 10) {
  return new Promise(function (resolve, reject) {
    stripe.customers.listSources(
      customerID,
      { object: "bank_account", limit: limit },
      function (err, bankAccounts) {
        if (bankAccounts)
          resolve(
            utils.registerJSONresponse(
              "StripeBankAccount",
              "Retrieved",
              bankAccounts
            )
          );
        else {
          console.log(err);
          reject(utils.registerJSONresponse("StripeBankAccount", err));
        }
      }
    );
  });
}

function verifyBankAccount(customerID, bankAccountID, amounts) {
  return new Promise(function (resolve, reject) {
    stripe.customers.verifySource(
      customerID,
      bankAccountID,
      { amounts: amounts },
      function (err, bankAccount) {
        if (bankAccount)
          resolve(
            utils.registerJSONresponse(
              "StripeBankAccount",
              "Verified",
              bankAccount
            )
          );
        else {
          console.log(err);
          reject(utils.registerJSONresponse("StripeBankAccount", err));
        }
      }
    );
  });
}

function createCheckoutSession(amount, successUrl, cancelUrl) {
  return new Promise(function (resolve, reject) {
    stripe.checkout.sessions.create(
      {
        success_url: successUrl,
        cancel_url: cancelUrl,
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Fenago Container"
              },
              unit_amount: amount
            },
            quantity: 1
          }
        ],
        mode: "payment"
      },
      function (err, session) {
        if (session)
          resolve(
            utils.registerJSONresponse(
              "StripeCheckoutSession",
              "Created",
              session
            )
          );
        else {
          console.log(err);
          reject(utils.registerJSONresponse("StripeCheckoutSession", err));
        }
      }
    );
  });
}

module.exports = {
  setupStripe,
  createStripeCustomer,
  getPaymentMethods,
  detachPaymentMethod,
  createSetupIntent,
  attachPaymentMethod,
  updateCustomer,
  getCustomer,
  deleteCustomer,
  getCustomers,
  createPaymentIntent,
  createUsageRecord,
  getUsageRecord,
  createProduct,
  getProduct,
  updateProduct,
  getProducts,
  deleteProduct,
  createPrice,
  getPrice,
  updatePrice,
  getPrices,
  createSubscription,
  getSubscription,
  updateSubscription,
  cancelSubscription,
  getSubscriptions,
  createInvoice,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoices,
  createCharge,
  getCharge,
  updateCharge,
  captureCharge,
  getCharges,
  getBalance,
  getBalanceTransaction,
  getBalanceTransactions,
  getDispute,
  updateDispute,
  closeDispute,
  getDisputes,
  createPayout,
  getPayout,
  updatePayout,
  cancelPayout,
  getPayouts,
  createRefund,
  getRefund,
  updateRefund,
  getRefunds,
  createBankAccount,
  getBankAccount,
  updateBankAccount,
  deleteBankAccount,
  getBankAccounts,
  verifyBankAccount,
  createCheckoutSession
};
