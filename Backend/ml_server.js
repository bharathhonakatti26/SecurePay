const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import the cors package
const { predictFraud } = require('./ml_model'); // Import the ML model logic
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('ML Server: Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('ML Server: MongoDB connection error:', err.message);
});

// Endpoint for fraud detection
app.post('/predict', async (req, res) => {
  try {
    console.log('Received request at /predict endpoint'); // Checkpoint 1

    const transactionData = req.body;
    const { senderMobile, receiverMobile, amount } = transactionData;

    console.log('Transaction data received:', transactionData); // Checkpoint 2

    // Fetch the user from the database
    const user = await User.findOne({ mobile: senderMobile });
    if (!user) {
      return res.status(404).json({ message: 'Sender not found' });
    }

    // Call the ML model to predict fraud
    console.log('Calling predictFraud function...');
    const { fraud, riskScore, decision, thresholds } = predictFraud(transactionData);

    console.log('Prediction results:'); // Checkpoint 4
    console.log('Fraud:', fraud);
    console.log('Risk Score:', riskScore);
    console.log('Decision:', decision);
    console.log('Thresholds:', thresholds);

    // Save fraud report in the user's transaction history
    const transaction = {
      mode: 'Mobile-to-Mobile',
      sender: senderMobile,
      receiver: receiverMobile,
      amount,
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

    user.transactionHistory.push(transaction);
    await user.save();

    res.status(200).json({
      message: 'Fraud detection completed and saved',
      fraud,
      riskScore,
      decision,
      thresholds,
    });
    console.log('Response sent successfully'); // Checkpoint 5
  } catch (error) {
    console.error('Error in ML server:', error.message); // Checkpoint for errors
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the ML server
const PORT = 5001; // Separate port for ML server
app.listen(PORT, () => {
  console.log(`ML server running on http://localhost:${PORT}`); // Checkpoint for server start
});