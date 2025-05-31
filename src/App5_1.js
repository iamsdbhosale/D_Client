import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import web3 from "./utils/web3";
import EVChargingPayment from "./contracts/EVChargingPayment.json";
import Explorer from "./Explorer";

const EV_CONTRACT_ADDRESS = "0xbd0AfC19cE16e578465f69A3D031BB10160053d8";
const WFO_TOKEN_ADDRESS = "0xB80A36Ba18A708874f217ED5092A0030c82CC76e";

function MainApp() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [form, setForm] = useState({ stationId: "", vehicleId: "", amount: "" });
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    const init = async () => {
      const accounts = await web3.eth.getAccounts();
      setAccount(accounts[0]);

      const deployed = new web3.eth.Contract(
        EVChargingPayment.abi,
        EV_CONTRACT_ADDRESS
      );
      setContract(deployed);
    };
    init();
  }, []);

  const isValidAmount = (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
  };

  const isFormFilled =
    form.stationId.trim() !== "" &&
    form.vehicleId.trim() !== "" &&
    isValidAmount(form.amount);

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

    try {
      await tokenContract.methods
        .approve(EV_CONTRACT_ADDRESS, web3.utils.toWei(form.amount, "ether"))
        .send({ from: account });

      setIsApproved(true);
      alert("WFO token approved!");
    } catch (error) {
      console.error(error);
      alert("Approval failed!");
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

      savePaymentData(newRecord);
      alert("Payment successful!");

      setForm({ stationId: "", vehicleId: "", amount: "" });
      setIsApproved(false);
    } catch (err) {
      console.error(err);
      alert("Payment failed!");
    }
  };

  const savePaymentData = (record) => {
    // Store in localStorage (for demo)
    const existing = localStorage.getItem("paymentData");
    let data = existing ? JSON.parse(existing) : [];
    data.push(record);
    localStorage.setItem("paymentData", JSON.stringify(data));
  };

  // Open /explorer route in new tab
  const openExplorer = () => {
    window.open("/explorer", "_blank");
  };

  return (
    <div style={{ padding: 30 }}>
      <h1>🚗 EV Charging Payment</h1>
      <p>Connected Wallet: {account}</p>

      <input
        type="text"
        placeholder="Station ID"
        value={form.stationId}
        onChange={(e) => setForm({ ...form, stationId: e.target.value })}
      />
      <br />
      <br />

      <input
        type="text"
        placeholder="Vehicle ID"
        value={form.vehicleId}
        onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
      />
      <br />
      <br />

      <input
        type="text"
        placeholder="Amount in WFO"
        value={form.amount}
        onChange={(e) => setForm({ ...form, amount: e.target.value })}
      />
      <br />
      <br />

      <button onClick={approveWFO} disabled={!isFormFilled} style={{ marginRight: 10 }}>
        ✅ Approve Token
      </button>

      <button onClick={makePayment} disabled={!isFormFilled || !isApproved} style={{ marginRight: 10 }}>
        💰 Make Payment
      </button>

      <button onClick={openExplorer}>
        🔍 Blockchain Explorer
      </button>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/explorer" element={<Explorer />} />
      </Routes>
    </Router>
  );
}
