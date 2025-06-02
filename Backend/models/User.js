const mongoose = require('mongoose');

// Define the User schema
const userSchema = new mongoose.Schema({
  name: String,
  mobile: String,
  email: String,
  pincode: String,
  city: String,
  customerId: String, // 12-digit customer ID
  mpin: String,       // 6-digit MPIN
  dob: { type: Date, default: null }, // Date of Birth
  accountCreated: { type: Date, default: Date.now }, // Account creation date
  cards: [
    {
      cardNumber: String,
      cardType: String,
      expiryDate: String,
      balance: { type: Number, default: 1000 },
      primary: { type: Boolean, default: false },
    },
  ],
  transactionHistory: {
    type: [
      {
        mode: { type: String, required: true }, // Mode of transaction
        sender: { type: String, required: true }, // Sender's mobile/account number
        receiver: { type: String, required: true }, // Receiver's mobile/account number
        amount: { type: Number, required: true }, // Transaction amount
        timestamp: { type: Date, default: Date.now }, // Transaction timestamp
        fraudReport: [
          {
            fraud: { type: Boolean, required: true }, // Fraud flag
            riskScore: { type: Number, required: true }, // Risk score
            decision: { type: String, required: true }, // Decision (e.g., Normal, Suspicious, High Risk)
            thresholds: {
              threshold24Hours: { type: Number, required: true },
              thresholdLastMonth: { type: Number, required: true },
              thresholdLastYear: { type: Number, required: true },
            },
          },
        ],
      },
    ],
    default: [], // Set the default value to an empty array
  },
});

// Create the User model
const User = mongoose.model('Registers', userSchema);

module.exports = User;