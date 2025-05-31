import React, { useEffect, useState } from "react";
import web3 from "./utils/web3";
import EVChargingPayment from "./contracts/EVChargingPayment.json";

const EV_CONTRACT_ADDRESS = "0xf54c3a13F52eacaB25F6E4a1f82D8b9D02Dc977D";
const WFO_TOKEN_ADDRESS = "0x564806dc1D412a0a125A84320Eb6357aD3bBD75f";

function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [form, setForm] = useState({ stationId: "", vehicleId: "", amount: "" });
  const [isApproved, setIsApproved] = useState(false);
  const [payments, setPayments] = useState([]);
  const [showExplorer, setShowExplorer] = useState(false);

  useEffect(() => {
    const init = async () => {
      const accounts = await web3.eth.getAccounts();
      setAccount(accounts[0]);

      const deployed = new web3.eth.Contract(EVChargingPayment.abi, EV_CONTRACT_ADDRESS);
      setContract(deployed);

      // Load existing payments from localStorage
      const stored = JSON.parse(localStorage.getItem("paymentRecords") || "[]");
      setPayments(stored);
    };
    init();
  }, []);

  const approveWFO = async () => {
    const tokenAbi = [
      {
        constant: false,
        inputs: [
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
        ],
        name: "approve",
        outputs: [{ name: "", type: "bool" }],
        type: "function",
      },
    ];

    const tokenContract = new web3.eth.Contract(tokenAbi, WFO_TOKEN_ADDRESS);

    await tokenContract.methods
      .approve(EV_CONTRACT_ADDRESS, web3.utils.toWei(form.amount, "ether"))
      .send({ from: account });

    alert("✅ WFO token approved!");
    setIsApproved(true);
  };

  const makePayment = async () => {
    try {
      await contract.methods
        .payCharging(form.stationId, form.vehicleId, web3.utils.toWei(form.amount, "ether"))
        .send({ from: account });

      const newRecord = {
        account,
        ...form,
        amount: form.amount + " WFO",
        timestamp: new Date().toLocaleString(),
      };

      const updated = [...payments, newRecord];
      localStorage.setItem("paymentRecords", JSON.stringify(updated, null, 2));
      setPayments(updated);

      alert("✅ Payment successful!");

      setForm({ stationId: "", vehicleId: "", amount: "" });
      setIsApproved(false);
    } catch (err) {
      console.error(err);
      alert("❌ Payment failed!");
    }
  };

  const isFormFilled = form.stationId && form.vehicleId && form.amount;

  const toggleExplorer = () => {
    setShowExplorer(!showExplorer);
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(payments, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "payments.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: 30 }}>
      <h1>🚗🏍️⚡ EV Charging Payment DApp</h1>
      <p>🔗 Connected Wallet: {account}</p>

      <input
        type="text"
        placeholder="Station ID"
        value={form.stationId}
        onChange={(e) => setForm({ ...form, stationId: e.target.value })}
      /><br /><br />

      <input
        type="text"
        placeholder="Vehicle ID"
        value={form.vehicleId}
        onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
      /><br /><br />

      <input
        type="text"
        placeholder="Amount in WFO"
        value={form.amount}
        onChange={(e) => setForm({ ...form, amount: e.target.value })}
      /><br /><br />

      <button onClick={approveWFO} disabled={!isFormFilled}>
        ✅ Approve Token
      </button>
      &nbsp;
      <button onClick={makePayment} disabled={!isFormFilled || !isApproved}>
        💰 Make Payment
      </button>
      &nbsp;
      <button onClick={toggleExplorer}>
        📜 {showExplorer ? "Hide Explorer" : "Blockchain Explorer"}
      </button>
      &nbsp;
      <button onClick={downloadJSON}>
        ⬇️ Download JSON
      </button>

      {showExplorer && (
        <div style={{ marginTop: 30 }}>
          <h2>📊 Payment History</h2>
          <table border="1" cellPadding="8" cellSpacing="0">
            <thead>
              <tr>
                <th>#</th>
                <th>Wallet</th>
                <th>Station ID</th>
                <th>Vehicle ID</th>
                <th>Amount</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan="6">No payments found.</td></tr>
              ) : (
                payments.map((p, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{p.account}</td>
                    <td>{p.stationId}</td>
                    <td>{p.vehicleId}</td>
                    <td>{p.amount}</td>
                    <td>{p.timestamp}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
