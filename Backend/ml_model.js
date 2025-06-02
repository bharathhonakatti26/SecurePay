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

  return { fraud, riskScore, decision, thresholds: { threshold24Hours, thresholdLastMonth, thresholdLastYear } };
}

module.exports = { predictFraud }; // Use CommonJS syntax for export