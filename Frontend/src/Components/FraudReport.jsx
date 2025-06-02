import React, { useEffect, useState } from 'react';
import './FraudReport.css'; // Ensure this CSS file is created for styling

function FraudReport() {
  const [fraudReports, setFraudReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFraudReports = async () => {
      const mobile = localStorage.getItem('mobile'); // Get logged-in user's mobile number
      if (!mobile) {
        setError('Mobile number not found. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/fraud-report?mobile=${mobile}`);
        if (!response.ok) throw new Error('Failed to fetch fraud reports');
        const data = await response.json();
        setFraudReports(data.fraudReports);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchFraudReports();
  }, []);

  if (loading) return <div className="fraud-report-container">Loading...</div>;
  if (error) return <div className="fraud-report-container">Error: {error}</div>;

  return (
    <div className="fraud-report-container">
      <h1 className="fraud-report-title">Fraud Report</h1>
      {fraudReports.length === 0 ? (
        <p className="no-fraud-reports-message">No fraud reports found.</p>
      ) : (
        <div className="fraud-report-cards-container">
          {fraudReports.map((report, index) => (
            <div key={index} className="fraud-report-card">
              <div className="fraud-report-card-header">
                <span className="fraud-report-status">
                  {report.fraud ? '❌ Fraud Detected' : '✅ Normal'}
                </span>
                <span className="fraud-report-timestamp">
                  {new Date(report.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="fraud-report-card-body">
                <p><strong>Transaction ID:</strong> {report.transactionNumber || 'N/A'}</p>
                <p><strong>Amount:</strong> ₹{Math.abs(parseFloat(report.amount))}</p>
                <p><strong>Risk Score:</strong> {report.riskScore}</p>
                <p><strong>Decision:</strong> {report.decision}</p>
                <p><strong>Thresholds:</strong></p>
                <ul>
                  <li>24 Hours: ₹{report.thresholds.threshold24Hours}</li>
                  <li>Last Month: ₹{report.thresholds.thresholdLastMonth}</li>
                  <li>Last Year: ₹{report.thresholds.thresholdLastYear}</li>
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FraudReport;