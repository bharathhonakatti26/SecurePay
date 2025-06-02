import React, { useEffect, useState } from 'react';
import './TransactionHistory.css'; // Ensure this CSS file is updated

function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactionHistory = async () => {
      const mobile = localStorage.getItem('mobile');
      if (!mobile) {
        setError('Mobile number not found. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/transaction-history?mobile=${mobile}`);
        if (!response.ok) throw new Error('Failed to fetch transaction history');
        const data = await response.json();
        const sortedTransactions = data.transactionHistory.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        setTransactions(sortedTransactions);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchTransactionHistory();
  }, []);

  if (loading) return <div className="transaction-history-container">Loading...</div>;
  if (error) return <div className="transaction-history-container">Error: {error}</div>;

  const loggedInMobile = localStorage.getItem('mobile');

  return (
    <div className="transaction-history-container">
      <h1 className="transaction-history-title">Transaction History</h1>
      {transactions.length === 0 ? (
        <p className="no-transactions-message">No transactions found.</p>
      ) : (
        <div className="transaction-cards-container">
          {transactions.map((transaction, index) => {
            const isSent = transaction.sender === loggedInMobile;
            const status = isSent ? 'Sent' : 'Received';
            const statusClass = isSent ? 'status-sent' : 'status-received';

            return (
              <div key={index} className="transaction-card">
                <div className="transaction-card-header">
                  <span className={`transaction-status ${statusClass}`}>{status}</span>
                  <span className="transaction-timestamp">{new Date(transaction.timestamp).toLocaleString()}</span>
                </div>
                <div className="transaction-card-body">
                  <p><strong>Transaction ID:</strong> {transaction.transactionNumber || 'N/A'}</p>
                  <p><strong>Mode:</strong> {transaction.mode}</p>
                  <p><strong>Amount:</strong> <span className={isSent ? 'amount-sent' : 'amount-received'}>₹{Math.abs(parseFloat(transaction.amount))}</span></p>
                  {isSent ? (
                    <p><strong>To:</strong> {transaction.receiver}</p>
                  ) : (
                    <p><strong>From:</strong> {transaction.sender}</p>
                  )}
                </div>
                {/* Optionally, add a footer for actions or more details */}
                {/* <div className="transaction-card-footer">
                  <button>View Details</button>
                </div> */}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TransactionHistory;