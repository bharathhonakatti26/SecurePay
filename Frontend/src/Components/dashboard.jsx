import React, { useEffect, useState, useRef } from 'react';
import './dashboard.css';
import { MdOutlineAddCard } from 'react-icons/md';
import { PiSwap } from "react-icons/pi";
import { MdOutlineAccountBalanceWallet } from "react-icons/md";
import { Doughnut } from 'react-chartjs-2'; // Import Doughnut graph component
import { Chart as ChartJS, CategoryScale, LinearScale, ArcElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, ArcElement, Title, Tooltip, Legend);

function Dashboard() {
  // Function to generate a unique transaction number in the frontend

  const [userName, setUserName] = useState('');
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [newCard, setNewCard] = useState({
    cardNumber: ['', '', '', ''], // Array for 4 groups of 4 digits
    cardType: 'Debit', // Default to Debit
    expiryDate: '',
  });
  const [showMpinPopup, setShowMpinPopup] = useState(false); // State to toggle MPIN popup
  const [mpin, setMpin] = useState(''); // State to store entered MPIN
  const [transactionDetails, setTransactionDetails] = useState(null); // Store transaction details temporarily
  const [showBalance, setShowBalance] = useState(false); // State to show balance
  const [showFullCardNumber, setShowFullCardNumber] = useState(false); // State to toggle card number visibility
  const [showSendMoneyPopup, setShowSendMoneyPopup] = useState(false); // State to toggle Send Money popup
  const [showSendToMobilePopup, setShowSendToMobilePopup] = useState(false); // State for the "Send to Mobile Number" popup
  const [receiverMobile, setReceiverMobile] = useState(''); // State for the receiver's mobile number
  const [receiverName, setReceiverName] = useState(''); // State for the receiver's name
  const [amount, setAmount] = useState(''); // State for the amount to send
  const [showAddMoneyPopup, setShowAddMoneyPopup] = useState(false); // State to toggle Add Money popup
  const [fromCardIndex, setFromCardIndex] = useState(0); // Default to the first card
  const [toCardIndex, setToCardIndex] = useState(1); // Default to the second card
  const [addMoneyAmount, setAddMoneyAmount] = useState(''); // State for the amount to transfer
  const [showMaskedBalance, setShowMaskedBalance] = useState(true); // State to toggle balance masking
  const [recentPayments, setRecentPayments] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [timeFrame, setTimeFrame] = useState('24hours'); // Default to 24 hours

  const inputRefs = useRef([]); // Ref array for card number inputs

  useEffect(() => {
    const fetchUserData = async () => {
      const mobile = localStorage.getItem('mobile'); // Get the mobile number from local storage
      if (!mobile) {
        setError('Mobile number not found. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/profile?mobile=${mobile}`);
        if (!response.ok) throw new Error('Failed to fetch user data');
        const data = await response.json();
        setUserName(data.name); // Set the user's name
        setCards(data.cards || []); // Set the cards from the response
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    const fetchRecentPayments = async () => {
      const mobile = localStorage.getItem('mobile'); // Get the mobile number from local storage
      if (!mobile) {
        setError('Mobile number not found. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/transaction-history?mobile=${mobile}`);
        if (!response.ok) throw new Error('Failed to fetch transaction history');
        const data = await response.json();
        const transactions = data.transactionHistory || [];
        setRecentPayments(transactions.slice(-3).reverse()); // Get the last 3 transactions in reverse order
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    const fetchExpenseData = async () => {
      const mobile = localStorage.getItem('mobile'); // Get the mobile number from local storage
      if (!mobile) {
        setError('Mobile number not found. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/transaction-history?mobile=${mobile}`);
        if (!response.ok) throw new Error('Failed to fetch transaction history');
        const data = await response.json();

        // Process data for the graph
        const transactions = data.transactionHistory || [];
        const expenses = transactions
          .filter((transaction) => transaction.sender === mobile) // Filter only "Sent" transactions
          .map((transaction) => ({
            amount: transaction.amount,
            timestamp: new Date(transaction.timestamp),
          }));

        setExpenseData(expenses);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUserData();
    fetchRecentPayments();
    fetchExpenseData();
  }, []); // Empty dependency array ensures this runs only once when the component mounts

  const handleNextCard = () => {
    // Increment the current card index, cycling back to 0 if at the end
    setCurrentCardIndex((prevIndex) => (prevIndex + 1) % cards.length);
  };

  const handleCardNumberChange = (value, index) => {
    // Allow only numeric input
    const numericValue = value.replace(/\D/g, ''); // Remove non-numeric characters

    const updatedCardNumber = [...newCard.cardNumber];
    updatedCardNumber[index] = numericValue.slice(0, 4); // Limit each box to 4 digits
    setNewCard({ ...newCard, cardNumber: updatedCardNumber });

    // Automatically move to the next input box
    if (numericValue.length === 4 && index < 3) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleAddCard = async (e) => {
    e.preventDefault();

    // Validate Expiry Date
    const today = new Date();
    const expiryDate = new Date(newCard.expiryDate);
    if (expiryDate <= today) {
      alert('Expiry Date must be greater than today.');
      return;
    }

    const mobile = localStorage.getItem('mobile');

    try {
      const response = await fetch('http://localhost:5000/api/add-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile,
          card: {
            cardNumber: newCard.cardNumber.join(''), // Combine the 4 groups into a single string
            cardType: newCard.cardType,
            expiryDate: newCard.expiryDate,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to add card');
      const data = await response.json();
      setCards(data.cards); // Update the cards list
      setShowForm(false); // Close the form
      setNewCard({ cardNumber: ['', '', '', ''], cardType: 'Debit', expiryDate: '' }); // Reset the form
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleMpinSubmit = async () => {
    const mobile = localStorage.getItem('mobile'); // Get the mobile number from local storage

    if (!mobile) {
      alert('Mobile number not found. Please log in again.');
      return;
    }

    try {
      // Validate MPIN
      const response = await fetch('http://localhost:5000/api/validate-mpin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, mpin }),
      });

      const result = await response.json();

      if (response.status === 200) {
        alert(result.message);

        // Fetch the balance for the selected card
        const cardResponse = await fetch(`http://localhost:5000/api/get-card-balance?mobile=${mobile}&cardNumber=${cards[currentCardIndex].cardNumber}`);
        if (!cardResponse.ok) throw new Error('Failed to fetch card balance');
        const cardData = await cardResponse.json();

        // Update the balance for the selected card
        const updatedCards = [...cards];
        updatedCards[currentCardIndex].balance = cardData.balance;
        setCards(updatedCards);

        setShowMaskedBalance(false); // Reveal the balance
        setMpin(''); // Clear the MPIN input
        setShowMpinPopup(false); // Close the popup
      } else {
        alert(result.message); // Show error message from the backend
        setMpin(''); // Clear the MPIN input but keep the popup open
      }
    } catch (err) {
      console.error('Error validating MPIN:', err);
      alert('An error occurred while validating MPIN. Please try again.');
      setMpin(''); // Clear the MPIN input but keep the popup open
    }
  };

  const handleMpinBoxChange = (value, index) => {
    // Allow only numeric input
    if (!/^\d?$/.test(value)) return;

    const updatedMpin = [...mpin];
    updatedMpin[index] = value; // Update the value of the current box
    setMpin(updatedMpin.join('')); // Update the MPIN state

    // Automatically move to the next box if a digit is entered
    if (value && index < 5) {
      document.querySelectorAll('.mpin-box')[index + 1].focus();
    }
  };

  const handleMpinKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !mpin[index] && index > 0) {
      // Move to the previous box if Backspace is pressed and the current box is empty
      document.querySelectorAll('.mpin-box')[index - 1].focus();
    }
  };

  const formatCardNumber = (cardNumber) => {
    // Add spaces between groups of 4 digits
    return cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const handleScanQR = () => {
    // Logic for scanning QR code
    alert('Scan QR functionality coming soon!');
  };
const triggerMpinValidation = () => {
  // Store transaction details (if needed) and show MPIN popup
  setTransactionDetails({
    type: 'sendMoney', // Example: You can add more details if needed
  });
  setShowSendMoneyPopup(true); // Show the MPIN popup
};

/*
const triggerMpinValidation = async () => {

  setTransactionDetails({
    type: 'sendMoney',
  });

  setShowMpinPopup(true);

  const isMpinValid = await validateMpin();

  if (isMpinValid) {
    setShowSendMoneyPopup(true);
  } else {
    setShowMpinPopup(false);
    alert('Invalid MPIN. Please try again.');
  }

};

*/

const handleClosePopup = () => {
  setShowSendMoneyPopup(false); // Close the popup
};

const handleAddMoney = () => {
  if (cards.length <= 1) {
    alert("You have only one card. You can't perform a self-transfer.");
    return; // Prevent the popup from opening
  }
  setShowAddMoneyPopup(true); // Show the "Add Money" popup
};

const handleOtherBills = () => {
  // Logic for paying other bills
  alert('Other Bills functionality coming soon!');
};

const handleSendToMobile = async () => {
  if (cards.length === 0) {
    // Redirect to /cards if no cards are found
    alert('No card found. Redirecting to add a card.');
    window.location.href = '/cards';
    return;
  }
  setShowSendMoneyPopup(false); // Close the "Send Money" popup
  setShowSendToMobilePopup(true); // Show the "Send to Mobile Number" popup
};

const fetchReceiverName = async (mobile) => {
  try {
    const response = await fetch(`http://localhost:5000/api/get-user?mobile=${mobile}`);
    if (!response.ok) throw new Error('Receiver not found');
    const data = await response.json();
    setReceiverName(data.name); // Set the receiver's name
  } catch (err) {
    console.error(err.message);
    setReceiverName(''); // Clear the receiver's name
    setReceiverMobile(''); // Clear the receiver's mobile number
    alert('Receiver not found. Please check the mobile number.');
  }
};

const handleSendMoneyToMobile = async (e) => {
  e.preventDefault();

  const senderMobile = localStorage.getItem('mobile');

  if (receiverMobile === senderMobile) {
    alert('Self-transfer detected. Redirecting to Add Money...');
    resetPopups();
    handleAddMoney();
    return;
  }

  try {
    const numericAmount = Number(amount);

    // Call /predict
    const predictResponse = await fetch('http://localhost:5000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderMobile,
        receiverMobile,
        amount: numericAmount,
      }),
    });

    const predictData = await predictResponse.json();

    console.log('Decision:', predictData.decision);
    console.log('Thresholds:', predictData.thresholds);

    if (predictData.fraud) {
      alert(`Transaction flagged as ${predictData.decision}.`);
      resetPopups();
      return;
    }

    // Proceed with sending money if no fraud detected
    const sendMoneyResponse = await fetch('http://localhost:5000/api/send-money', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderMobile,
        receiverMobile,
        amount: numericAmount,
        cardNumber: cards[currentCardIndex].cardNumber,
        transactionNumber: predictData.transactionNumber, // Send transactionNumber to /api/send-money
      }),
    });

    if (!sendMoneyResponse.ok) {
      const errorData = await sendMoneyResponse.json();
      throw new Error(errorData.message || 'Failed to send money');
    }

    const sendMoneyData = await sendMoneyResponse.json();
    alert(sendMoneyData.message);
    resetPopups();
  } catch (err) {
    console.error('Error:', err);
    alert(err.message);
  }
};

const handleSelfTransfer = async () => {
  if (fromCardIndex === toCardIndex) {
    alert('Cannot transfer money to the same card. Please select different cards.');
    resetPopups(); // Reset all states and close popups
    return;
  }

  try {
    const response = await fetch('http://localhost:5000/api/self-transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromCard: cards[fromCardIndex].cardNumber,
        toCard: cards[toCardIndex].cardNumber,
        amount: addMoneyAmount,
      }),
    });

    if (!response.ok) throw new Error('Failed to transfer money');
    alert('Money transferred successfully!');
    resetPopups(); // Reset all states and close popups
  } catch (err) {
    console.error(err.message);
    alert('Failed to transfer money. Please try again.');
    resetPopups(); // Reset all states and close popups
  }
};

const resetPopups = () => {
  setShowSendMoneyPopup(false);
  setShowSendToMobilePopup(false);
  setShowAddMoneyPopup(false);
  setShowMpinPopup(false);
  setReceiverMobile('');
  setReceiverName('');
  setAmount('');
  setAddMoneyAmount('');
  setFromCardIndex(0); // Reset to default first card
  setToCardIndex(1);   // Reset to default second card
  setMpin('');
};

if (loading) return <div>Loading...</div>;
if (error) return <div>Error: {error}</div>;

  // Prepare data for the graph
  const getGraphData = () => {
    const now = new Date();
    let filteredExpenses;

    if (timeFrame === '24hours') {
      filteredExpenses = expenseData.filter((expense) => (now - expense.timestamp) / (1000 * 60 * 60) <= 24);
    } else if (timeFrame === '7days') {
      filteredExpenses = expenseData.filter((expense) => (now - expense.timestamp) / (1000 * 60 * 60 * 24) <= 7);
    } else if (timeFrame === 'months') {
      filteredExpenses = expenseData.filter((expense) => (now - expense.timestamp) / (1000 * 60 * 60 * 24 * 30) <= 1);
    } else if (timeFrame === '1year') {
      filteredExpenses = expenseData.filter((expense) => (now - expense.timestamp) / (1000 * 60 * 60 * 24 * 365) <= 1);
    }

    return {
      labels: filteredExpenses.map((expense, index) => `Expense ${index + 1}`), // Label each expense
      datasets: [
        {
          label: `Expenses (${timeFrame})`,
          data: filteredExpenses.map((expense) => expense.amount),
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

return (
  <div className="dashboard-container">
    {/* Welcome Section */}
    <h1 className="dashboard-title">Welcome Back, {userName || 'Guest'}!</h1>

    {/* Dashboard Grid */}
    <div className="dashboard-grid">
      <div className="grid-item virtual-cards">
        <div className="Virtual-head">
          <h2>My Virtual Cards</h2>
          <div>
            {cards.length >= 2 && (
              <button className="add-card-btn" onClick={handleNextCard}>
                <PiSwap />
              </button>
            )}
            <button className="add-card-btn" onClick={() => setShowForm(true)}>
              <MdOutlineAddCard />
            </button>
          </div>
        </div>
        {cards.length === 0 ? (
          <p className="no-cards-message">No cards available. Click "Add Card" to create one.</p>
        ) : (
          <div className="cards-list">
            <div>
              <p>
                {currentCardIndex + 1} {"->"}{' '}
                {showFullCardNumber
                  ? formatCardNumber(cards[currentCardIndex].cardNumber) // Show full card number
                  : cards[currentCardIndex].cardNumber.replace(/^(\d{4})\d{8}(\d{4})$/, '$1 **** **** $2')}
              </p>
              <button className="add-card-btn" onClick={() => setShowMpinPopup(true)} >
                <MdOutlineAccountBalanceWallet />
              </button>
            </div>
            <div>
              <p>{cards[currentCardIndex].expiryDate}</p>
              <p>{cards[currentCardIndex].cardType}</p>
              <p>
                <strong>Balance :</strong> ₹{' '}
                {showMaskedBalance ? '****' : cards[currentCardIndex].balance}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Other Grids */}
      <div className="grid-item actions-grid">
        <button className="action-card" onClick={() => handleScanQR()}>
          Scan QR
        </button>
        <button className="action-card" onClick={triggerMpinValidation}>
          Send Money
        </button>
        <button className="action-card" onClick={() => handleAddMoney()}>
          Self Transfer
        </button>
        <button className="action-card" onClick={() => handleOtherBills()}>
          Other Bills
        </button>
      </div>
      <div className="grid-item expense-graph">
        <h2>Expense Graph</h2>
        <div className="timeframe-switch">
          <button
            className={`switch-btn ${timeFrame === '24hours' ? 'active' : ''}`}
            onClick={() => setTimeFrame('24hours')}
          >
            Last 24 Hours
          </button>
          <button
            className={`switch-btn ${timeFrame === '7days' ? 'active' : ''}`}
            onClick={() => setTimeFrame('7days')}
          >
            Last 7 Days
          </button>
          <button
            className={`switch-btn ${timeFrame === 'months' ? 'active' : ''}`}
            onClick={() => setTimeFrame('months')}
          >
            Last Month
          </button>
          <button
            className={`switch-btn ${timeFrame === '1year' ? 'active' : ''}`}
            onClick={() => setTimeFrame('1year')}
          >
            Last Year
          </button>
        </div>
        <Doughnut data={getGraphData()} /> {/* Replace Line with Doughnut */}
      </div>
      <div className="grid-item recent-payments">
        <h2>Recent Payments</h2>
        <ul>
          {recentPayments.length === 0 ? (
            <li>No recent payments found.</li>
          ) : (
            recentPayments.map((payment, index) => (
              <li key={index}>
                {payment.mode}: ₹{payment.amount} ({payment.sender === localStorage.getItem('mobile') ? 'Sent' : 'Received'}) on {new Date(payment.timestamp).toLocaleString()}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>

    {/* MPIN Popup */}
    {showMpinPopup && (
      <div className="mpin-popup">
        <h2>Enter MPIN</h2>
        <div className="mpin-input-container">
          {Array.from({ length: 6 }).map((_, index) => (
            <input
              key={index}
              type="password"
              inputMode="numeric" // Numeric keypad for mobile
              maxLength="1" // Limit each box to 1 digit
              value={mpin[index] || ''} // Display the current value or an empty string
              onChange={(e) => handleMpinBoxChange(e.target.value, index)} // Handle input change
              onKeyDown={(e) => handleMpinKeyDown(e, index)} // Handle navigation with arrow keys
              className="mpin-box"
            />
          ))}
        </div>
        <button onClick={handleMpinSubmit}>Submit</button>
        <button onClick={() => setShowMpinPopup(false)}>Cancel</button>
      </div>
    )}

    {/* Add Card Form */}
    {showForm && (
      <div className="add-card-form">
        <form onSubmit={handleAddCard}>
          <h2>Add New Card</h2>
          <label>
            Card Number:
            <div className="card-number-input">
              {newCard.cardNumber.map((group, index) => (
                <input
                  key={index}
                  type="text"
                  value={group}
                  onChange={(e) => handleCardNumberChange(e.target.value, index)}
                  maxLength="4" // Limit each box to 4 digits
                  ref={(el) => (inputRefs.current[index] = el)} // Assign ref to each input
                  required
                />
              ))}
            </div>
          </label>
          <label>
            Card Type:
            <div className="card-type-options">
              <label>
                <input
                  type="radio"
                  name="cardType"
                  value="Debit"
                  checked={newCard.cardType === 'Debit'}
                  onChange={(e) => setNewCard({ ...newCard, cardType: e.target.value })}
                />
                Debit
              </label>
              <label>
                <input
                  type="radio"
                  name="cardType"
                  value="Credit"
                  checked={newCard.cardType === 'Credit'}
                  onChange={(e) => setNewCard({ ...newCard, cardType: e.target.value })}
                />
                Credit
              </label>
            </div>
          </label>
          <label>
            Expiry Date:
            <input
              type="month" // Use month input for classical date picker
              value={newCard.expiryDate}
              onChange={(e) => setNewCard({ ...newCard, expiryDate: e.target.value })}
              required
            />
          </label>
          <button type="submit">Add Card</button>
          <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
        </form>
      </div>
    )}

    {/* Send Money Popup */}
    {showSendMoneyPopup && (
      <div className="send-money-popup">
        <div className="popup-content">
          <h2>Send Money</h2>
          <button
            className="popup-option"
            onClick={handleSendToMobile}
          >
            Send to Mobile Number
          </button>
          <button
            className="popup-option"
            onClick={() => alert('Send Money to Card Number')}
          >
            Send to Card Number
          </button>
          <button className="popup-close-btn" onClick={handleClosePopup}>
            Close
          </button>
        </div>
      </div>
    )}

    {/* Send Money to Mobile Popup */}
    {showSendToMobilePopup && (
      <div className="send-to-mobile-popup">
        <div className="popup-content">
          <h2>Send Money to Mobile Number</h2>
          <form onSubmit={handleSendMoneyToMobile}>
            <label>
              Select Card:
              <select
                value={currentCardIndex}
                onChange={(e) => setCurrentCardIndex(Number(e.target.value))}
                required
              >
                {cards.map((card, index) => (
                  <option key={index} value={index}>
                    {card.cardNumber.replace(/^(\d{4})\d{8}(\d{4})$/, '$1 **** **** $2')}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Receiver's Mobile Number:
              <input
                type="text"
                value={receiverMobile}
                onChange={(e) => {
                  const enteredMobile = e.target.value;
                  setReceiverMobile(enteredMobile);

                  // Validate the entered mobile number
                  const senderMobile = localStorage.getItem('mobile'); // Get the sender's mobile number
                  if (enteredMobile === senderMobile) {
                    alert('Self-transfer detected. Redirecting to Add Money...');
                    resetPopups();
                    handleAddMoney(); // Redirect to Add Money flow
                    return;
                  }

                  // Fetch the receiver's name if the mobile number is valid and complete
                  if (enteredMobile.length === 10) {
                    fetchReceiverName(enteredMobile);
                  }
                }}
                maxLength="10"
                required
              />
            </label>
            <label>
              Receiver's Name:
              <input
                type="text"
                value={receiverName}
                readOnly
                placeholder="Name will be fetched automatically"
              />
            </label>
            <label>
              Amount:
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                required
              />
            </label>
            <button type="submit" >Send Money</button>
            <button
              type="button"
              onClick={() => {
                setShowSendToMobilePopup(false); // Close "Send to Mobile Number" popup
                resetPopups(); // Reset all states
              }}
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    )}

    {/* Add Money Popup */}
    {showAddMoneyPopup && (
      <div className="add-money-popup">
        <div className="popup-content">
          <h2>Self Transfer</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSelfTransfer(); // Call the self-transfer function
            }}
          >
            <label>
              Select Card (From):
              <select
                value={fromCardIndex}
                onChange={(e) => setFromCardIndex(Number(e.target.value))}
                required
              >
                {cards.map((card, index) => (
                  <option key={index} value={index}>
                    {card.cardNumber.replace(/^(\d{4})\d{8}(\d{4})$/, '$1 **** **** $2')}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Select Card (To):
              <select
                value={toCardIndex}
                onChange={(e) => setToCardIndex(Number(e.target.value))}
                required
              >
                {cards.map((card, index) => (
                  <option key={index} value={index}>
                    {card.cardNumber.replace(/^(\d{4})\d{8}(\d{4})$/, '$1 **** **** $2')}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Amount:
              <input
                type="number"
                value={addMoneyAmount}
                onChange={(e) => setAddMoneyAmount(e.target.value)}
                min="1"
                required
              />
            </label>
            <button type="submit">Self Transfer</button>
            <button
              type="button"
              onClick={() => setShowAddMoneyPopup(false)} // Close the popup
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    )}
  </div>
);
}

export default Dashboard;