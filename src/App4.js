import React, { useEffect, useState } from "react";
import web3 from "./utils/web3";
import EVChargingPayment from "./contracts/EVChargingPayment.json";

const EV_CONTRACT_ADDRESS = "0xbd0AfC19cE16e578465f69A3D031BB10160053d8";
const WFO_TOKEN_ADDRESS = "0xB80A36Ba18A708874f217ED5092A0030c82CC76e";

function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [form, setForm] = useState({ stationId: "", vehicleId: "", amount: "" });
  const [payments, setPayments] = useState([]);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    const init = async () => {
      const accounts = await web3.eth.getAccounts();
      setAccount(accounts[0]);

      const evContract = new web3.eth.Contract(EVChargingPayment.abi, EV_CONTRACT_ADDRESS);
      setContract(evContract);

      const saved = JSON.parse(localStorage.getItem("paymentRecords") || "[]");
      setPayments(saved);
    };

    init();
  }, []);

  const isFormFilled = form.stationId && form.vehicleId && form.amount;

  const approveWFO = async () => {
    try {
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

      setIsApproved(true);
      alert("✅ WFO token approved!");
    } catch (err) {
      console.error(err);
      alert("❌ Token approval failed!");
    }
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

    // ✅ Clear form fields and approval state
    setForm({ stationId: "", vehicleId: "", amount: "" });
    setIsApproved(false);
  } catch (err) {
    console.error(err);
    alert("❌ Payment failed!");
  }
};


  const downloadJSON = () => {
    const dataStr = JSON.stringify(payments, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payments.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: 30 }}>
      <h1>🚗 EV Charging Payment</h1>
      <p><strong>Connected Wallet:</strong> {account}</p>

      <input
        type="text"
        placeholder="Station ID"
        value={form.stationId}
        onChange={(e) => {
          setForm({ ...form, stationId: e.target.value });
          setIsApproved(false); // reset approval on change
        }}
      /><br /><br />

      <input
        type="text"
        placeholder="Vehicle ID"
        value={form.vehicleId}
        onChange={(e) => {
          setForm({ ...form, vehicleId: e.target.value });
          setIsApproved(false); // reset approval on change
        }}
      /><br /><br />

      <input
        type="text"
        placeholder="Amount in WFO"
        value={form.amount}
        onChange={(e) => {
          setForm({ ...form, amount: e.target.value });
          setIsApproved(false); // reset approval on change
        }}
      /><br /><br />

      <button onClick={approveWFO} disabled={!isFormFilled}>
        Approve Token
      </button>

      <button
        onClick={makePayment}
        disabled={!isFormFilled || !isApproved}
        style={{ marginLeft: "10px" }}
      >
        Make Payment
      </button>

      <button onClick={downloadJSON} style={{ marginLeft: "10px" }}>
        Download JSON
      </button>

      <hr />
      <h2>📄 Payment History</h2>
      {payments.length === 0 ? (
        <p>No records yet.</p>
      ) : (
        <table border="1" cellPadding="5">
          <thead>
            <tr>
              <th>Station ID</th>
              <th>Vehicle ID</th>
              <th>Amount</th>
              <th>Wallet</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p, i) => (
              <tr key={i}>
                <td>{p.stationId}</td>
                <td>{p.vehicleId}</td>
                <td>{p.amount}</td>
                <td>{p.account}</td>
                <td>{p.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;
