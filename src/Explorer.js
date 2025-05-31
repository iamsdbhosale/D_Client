import React, { useEffect, useState } from "react";

function Explorer() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    // Fetch payment data - 
    // For demo, try localStorage or hardcoded JSON,
    // Replace with real backend or file fetch if available

    const data = localStorage.getItem("paymentData");
    if (data) {
      setPayments(JSON.parse(data));
    } else {
      setPayments([]);
    }
  }, []);

  return (
    <div style={{ padding: 30 }}>
      <h1>🔍 Blockchain Explorer - Payment History</h1>

      {payments.length === 0 ? (
        <p>No payment records found.</p>
      ) : (
        <table border="1" cellPadding="10" cellSpacing="0">
          <thead>
            <tr>
              <th>Account</th>
              <th>Station ID</th>
              <th>Vehicle ID</th>
              <th>Amount</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p, idx) => (
              <tr key={idx}>
                <td>{p.account}</td>
                <td>{p.stationId}</td>
                <td>{p.vehicleId}</td>
                <td>{p.amount}</td>
                <td>{p.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Explorer;
