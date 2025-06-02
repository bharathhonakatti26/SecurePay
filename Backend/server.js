const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./models/User');

// Login Schema (for login attempts/history)
const loginSchema = new mongoose.Schema({
  customerId: String,
  success: Boolean,
  timestamp: { type: Date, default: Date.now },
  ip: String, // Optional: store IP address
  reason: String, // <-- Add this line
});

const Login = mongoose.model('Login', loginSchema);

const otpStore = {}; // In-memory store: { email: { otp, expires } }

// --- ML Model Logic ---
function predictFraud(transactionData) {
  const { amount, transaction_history } = transactionData;

  // Helper function to filter transactions by time frame
  const filterTransactionsByTimeFrame = (timeFrameInMs) => {
    const now = new Date();
    return transaction_history.filter((txn) => now - new Date(txn.timestamp) <= timeFrameInMs);
  };

  // Calculate thresholds for different time frames
  const calculateThreshold = (transactions) => {
    if (transactions.length === 0) return 0; // No transactions in the time frame
    const amounts = transactions.map((txn) => txn.amount);
    const mean = amounts.reduce((sum, value) => sum + value, 0) / amounts.length;
    const stdDev = Math.sqrt(
      amounts.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / amounts.length
    );
    return mean + 1.5 * stdDev; // Dynamic threshold (mean + 1.5 * stdDev)
  };

  // Time frames in milliseconds
  const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 24 hours
  const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
  const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000; // 1 year

  // Filter transactions by time frame
  const transactionsLast24Hours = filterTransactionsByTimeFrame(ONE_DAY_MS);
  const transactionsLastMonth = filterTransactionsByTimeFrame(ONE_MONTH_MS);
  const transactionsLastYear = filterTransactionsByTimeFrame(ONE_YEAR_MS);

  // Calculate thresholds
  const threshold24Hours = calculateThreshold(transactionsLast24Hours);
  const thresholdLastMonth = calculateThreshold(transactionsLastMonth);
  const thresholdLastYear = calculateThreshold(transactionsLastYear);

  let fraud = false;
  let riskScore = 0;
  let decision = '✅ Normal'; // Default decision

  // Compare the current transaction amount with thresholds
  const exceeds24Hours = amount > threshold24Hours;
  const exceedsLastMonth = amount > thresholdLastMonth;
  const exceedsLastYear = amount > thresholdLastYear;

  if (exceeds24Hours && exceedsLastMonth && exceedsLastYear) {
    fraud = true;
    riskScore = 1.0; // High risk
    decision = '❌ High Risk';
  } else if (exceeds24Hours || exceedsLastMonth || exceedsLastYear) {
    fraud = true;
    riskScore = 0.5; // Suspicious
    decision = '⚠️ Suspicious';
  }


  // Create the thresholds object
  const thresholds = { threshold24Hours, thresholdLastMonth, thresholdLastYear };

  console.log("ML Model Results:");
  console.log("Fraud:", fraud);
  console.log("Risk Score:", riskScore);
  console.log("Decision:", decision);
  console.log("Thresholds:", thresholds);

  return { fraud, riskScore, decision, thresholds };
}

// Create Account Route
app.post('/api/create-account', async (req, res) => {
  console.log("Received /api/create-account request:", req.body); // Log the request body
  const { name, mobile, email, pincode, city, customerId, mpin } = req.body;

  try {
    console.log("Checking if mobile exists...");
    const exists = await User.findOne({ mobile });
    console.log("Mobile exists:", !!exists);
    if (exists) return res.status(400).json({ message: 'Mobile number already registered' });

    console.log("Hashing MPIN...");
    const hashedMpin = await bcrypt.hash(mpin, 10);
    console.log("MPIN hashed successfully");

    console.log("Ensuring customerId is unique...");
    let uniqueCustomerId = customerId;
    let idExists = await User.findOne({ customerId: uniqueCustomerId });
    while (idExists) {
      console.log("customerId already exists, generating a new one...");
      uniqueCustomerId = Math.floor(100000000000 + Math.random() * 900000000000).toString();
      idExists = await User.findOne({ customerId: uniqueCustomerId });
    }
    console.log("Unique customerId:", uniqueCustomerId);

    console.log("Creating new user...");
    const user = new User({
      name,
      mobile,
      email,
      pincode,
      city,
      customerId: uniqueCustomerId,
      mpin: hashedMpin,
      transactionHistory: [], // Explicitly initialize transactionHistory to []
    });
    console.log("New user created:", user);

    console.log("Saving user...");
    await user.save();
    console.log("User saved successfully");

    res.json({ message: 'Account created successfully', customerId: uniqueCustomerId });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login Route (logs every attempt)
app.post('/api/login', async (req, res) => {
  const { mobile, mpin } = req.body;
  const user = await User.findOne({ mobile });

  if (!user) {
    return res.status(401).json({ message: 'Mobile number not registered' });
  }

  const isMatch = await bcrypt.compare(mpin, user.mpin);
  if (!isMatch) {
    return res.status(401).json({ message: 'Incorrect MPIN' });
  }

  res.json({ message: 'Login successful', user });
});

// Profile Route
app.get('/api/profile', async (req, res) => {
  const { mobile } = req.query;

  if (!mobile) {
    return res.status(400).json({ message: 'Mobile number is required' });
  }

  try {
    const user = await User.findOne({ mobile });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      customerId: user.customerId,
      city: user.city,
      dob: user.dob,
      pincode: user.pincode,
      cards: user.cards, // Return the user's cards
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update DOB Route
app.post('/api/update-dob', async (req, res) => {
  const { mobile, dob } = req.body;

  if (!mobile || !dob) {
    return res.status(400).json({ message: 'Mobile number and DOB are required' });
  }

  try {
    const user = await User.findOneAndUpdate(
      { mobile },
      { dob: new Date(dob) },
      { new: true } // Return the updated document
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating DOB:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add Card Route
app.post('/api/add-card', async (req, res) => {
  const { mobile, card } = req.body;

  if (!mobile || !card) {
    return res.status(400).json({ message: 'Mobile number and card details are required' });
  }

  try {
    const user = await User.findOne({ mobile });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user already has a primary card
    const hasPrimaryCard = user.cards.some((c) => c.primary);

    // If no primary card exists, set this card as primary
    if (!hasPrimaryCard) {
      card.primary = true;
    } else {
      card.primary = false;
    }

    // Add the card to the user's cards array
    user.cards.push(card);

    await user.save(); // Save the updated user document

    res.json({ message: 'Card added successfully', cards: user.cards });
  } catch (error) {
    console.error('Error adding card:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete Card Route
app.post('/api/delete-card', async (req, res) => {
  const { mobile, cardNumber } = req.body;

  if (!mobile || !cardNumber) {
    return res.status(400).json({ message: 'Mobile number and card number are required' });
  }

  try {
    const user = await User.findOneAndUpdate(
      { mobile },
      { $pull: { cards: { cardNumber } } }, // Remove the card with the matching cardNumber
      { new: true } // Return the updated document
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Card deleted successfully', cards: user.cards });
  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Validate MPIN Route
app.post('/api/validate-mpin', async (req, res) => {
  const { mobile, mpin } = req.body;

  if (!mobile || !mpin) {
    return res.status(400).json({ message: 'Mobile number and MPIN are required' });
  }

  try {
    const user = await User.findOne({ mobile });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Compare the entered MPIN with the hashed MPIN
    const isMatch = await bcrypt.compare(mpin, user.mpin);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect MPIN' });
    }

    res.status(200).json({ message: 'MPIN validated successfully!' });
  } catch (err) {
    console.error('Error validating MPIN:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get User Route
app.get('/api/get-user', async (req, res) => {
  const { mobile } = req.query;
  const user = await User.findOne({ mobile });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json({ name: user.name });
});

// Send Money Route
app.post('/api/send-money', async (req, res) => {
  const { senderMobile, receiverMobile, amount, cardNumber } = req.body;

  if (!senderMobile || !receiverMobile || !amount || !cardNumber) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Find the sender and receiver in the database
    const sender = await User.findOne({ mobile: senderMobile });
    const receiver = await User.findOne({ mobile: receiverMobile });

    if (!sender) {
      return res.status(404).json({ message: 'Sender not found' });
    }

    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Find the sender's card
    const senderCard = sender.cards.find((card) => card.cardNumber === cardNumber);
    if (!senderCard) {
      return res.status(404).json({ message: 'Sender card not found' });
    }

    // Check if the sender has sufficient balance
    const numericAmount = Number(amount); // Convert amount to a number
    if (senderCard.balance < numericAmount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Deduct the amount from the sender's card
    senderCard.balance -= numericAmount;

    // Find the receiver's primary card
    const receiverCard = receiver.cards.find((card) => card.primary);
    if (!receiverCard) {
      return res.status(404).json({ message: 'Receiver does not have a primary card' });
    }

    // Add the amount to the receiver's primary card
    receiverCard.balance += numericAmount;

    // Save the updated sender and receiver documents
    await sender.save();
    await receiver.save();

    res.status(200).json({ message: 'Money sent successfully' });
  } catch (err) {
    console.error('Error processing transaction:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get Card Balance Route
app.get('/api/get-card-balance', async (req, res) => {
  const { mobile, cardNumber } = req.query;

  try {
    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const card = user.cards.find((c) => c.cardNumber === cardNumber);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    res.status(200).json({ balance: card.balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get Card Details Route
app.get('/api/get-card-details', async (req, res) => {
  const { mobile, cardNumber } = req.query;

  if (!mobile || !cardNumber) {
    return res.status(400).json({ message: 'Mobile number and card number are required' });
  }

  try {
    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const card = user.cards.find((c) => c.cardNumber === cardNumber);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    res.status(200).json({
      userName: user.name || 'N/A',
      cardNumber: card.cardNumber,
      cardType: card.cardType,
      expiryDate: card.expiryDate,
      balance: card.balance || 0.0,
      customerId: user.customerId || 'N/A',
    });
  } catch (err) {
    console.error('Error fetching card details:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/remove-card', async (req, res) => {
  const { mobile, cardNumber } = req.body;

  if (!mobile || !cardNumber) {
    return res.status(400).json({ message: 'Mobile number and card number are required' });
  }

  try {
    const user = await User.findOne({ mobile });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the card to be removed is the primary card
    const isPrimaryCard = user.cards.some((card) => card.cardNumber === cardNumber && card.primary);

    // Remove the card from the user's cards array
    user.cards = user.cards.filter((card) => card.cardNumber !== cardNumber);

    // If the removed card was the primary card, set another card as primary
    if (isPrimaryCard && user.cards.length > 0) {
      user.cards[0].primary = true; // Set the first remaining card as primary
    }

    await user.save(); // Save the updated user document

    res.status(200).json({ message: 'Card removed successfully', cards: user.cards });
  } catch (err) {
    console.error('Error removing card:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/set-primary-card', async (req, res) => {
  const { mobile, cardNumber } = req.body;

  if (!mobile || !cardNumber) {
    return res.status(400).json({ message: 'Mobile number and card number are required' });
  }

  try {
    const user = await User.findOne({ mobile });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Set all cards' primary field to false
    user.cards.forEach((card) => {
      card.primary = false;
    });

    // Set the selected card's primary field to true
    const card = user.cards.find((c) => c.cardNumber === cardNumber);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }
    card.primary = true;

    await user.save(); // Save the updated user document

    res.status(200).json({ message: 'Primary card set successfully', cards: user.cards });
  } catch (err) {
    console.error('Error setting primary card:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/get-primary-card', async (req, res) => {
  const { mobile } = req.query;

  if (!mobile) {
    return res.status(400).json({ message: 'Mobile number is required' });
  }

  try {
    const user = await User.findOne({ mobile });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const primaryCard = user.cards.find((card) => card.primary);
    if (!primaryCard) {
      return res.status(404).json({ message: 'No primary card found' });
    }

    res.status(200).json({ primaryCard });
  } catch (err) {
    console.error('Error fetching primary card:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Transaction History Route
app.get('/api/transaction-history', async (req, res) => {
  const { mobile } = req.query;

  if (!mobile) {
    return res.status(400).json({ message: 'Mobile number is required' });
  }

  try {
    const user = await User.findOne({ mobile });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Simulate long polling by delaying the response
    setTimeout(() => {
      res.status(200).json({ transactionHistory: user.transactionHistory });
    }, 5000); // Delay response by 5 seconds
  } catch (err) {
    console.error('Error fetching transaction history:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Initialize a counter to track the number of transactions
let transactionCounter = 0;

app.post('/predict', async (req, res) => {
  console.log("Predict route hit!");
  try {
    const { senderMobile, receiverMobile, amount } = req.body;

    // Fetch the user from the database
    const user = await User.findOne({ mobile: senderMobile });
    if (!user) {
      return res.status(404).json({ message: 'Sender not found' });
    }

    let fraud = false;
    let riskScore = 0;
    let decision = '✅ Normal';
    let thresholds = { threshold24Hours: 0, thresholdLastMonth: 0, thresholdLastYear: 0 };

    // Conditionally run the ML model after the first 10 transactions
    if (transactionCounter >= 10) {
      const sentTransactions = user.transactionHistory.filter(
        (txn) => txn.sender === senderMobile
      );

      const mlResults = predictFraud({
        amount,
        transaction_history: sentTransactions,
      });

      fraud = mlResults.fraud;
      riskScore = mlResults.riskScore;
      decision = mlResults.decision;
      thresholds = mlResults.thresholds;

      console.log("ML Model Results:", { fraud, riskScore, decision, thresholds });
    } else {
      console.log("ML Model skipped for first 10 transactions");
    }

    const senderTransaction = {
      mode: 'Mobile-to-Mobile',
      sender: senderMobile,
      receiver: receiverMobile,
      amount: -amount,
      timestamp: new Date(),
      fraudReport: [
        {
          fraud,
          riskScore,
          decision,
          thresholds,
        },
      ],
    };

    console.log("Transaction Object of Sender:", senderTransaction);

    user.transactionHistory.push(senderTransaction);

    await user.save();

    console.log("Sender saved successfully!");

    // Access the _id of the newly created transaction
    const transactionNumber = user.transactionHistory[user.transactionHistory.length - 1]._id;

    res.status(200).json({
      message: 'Fraud detection completed and saved',
      fraud,
      riskScore,
      decision,
      thresholds,
      transactionNumber: transactionNumber, // Return the transaction number
    });

    // Increment the transaction counter
    transactionCounter++;
    console.log("Transaction Counter:", transactionCounter);
  } catch (error) {
    console.error('Error in ML endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const router = express.Router();

app.get('/api/fraud-report', async (req, res) => {
  const { mobile } = req.query;

  if (!mobile) {
    return res.status(400).json({ message: 'Mobile number is required' });
  }

  try {
    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const fraudReports = user.transactionHistory
      .filter((txn) => txn.fraudReport && txn.fraudReport.length > 0)
      .map((txn) => ({
        transactionNumber: txn.transactionNumber,
        amount: txn.amount,
        timestamp: txn.timestamp,
        fraud: txn.fraudReport[0].fraud,
        riskScore: txn.fraudReport[0].riskScore,
        decision: txn.fraudReport[0].decision,
        thresholds: txn.fraudReport[0].thresholds,
      }));

    res.status(200).json({ fraudReports });
  } catch (error) {
    console.error('Error fetching fraud reports:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));