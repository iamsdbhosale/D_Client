import React, { useEffect, useState } from "react";
import web3 from "./utils/web3";
import EVChargingPayment from "./contracts/EVChargingPayment.json";

const EV_CONTRACT_ADDRESS = "0x232b1Aa02d520E4706966e53ba93562a73062649";
const WFO_TOKEN_ADDRESS = "0xB80A36Ba18A708874f217ED5092A0030c82CC76e";

function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [form, setForm] = useState({ stationId: "", vehicleId: "", amount: "" });

  useEffect(() => {
    const init = async () => {
      try {
        const accounts = await web3.eth.getAccounts();
        if (!accounts.length) {
          alert("Please connect MetaMask!");
          return;
        }

        setAccount(accounts[0]);

        const evContract = new web3.eth.Contract(
          EVChargingPayment.abi,
          EV_CONTRACT_ADDRESS
        );
        setContract(evContract);
      } catch (error) {
        console.error("Error initializing web3:", error);
      }
    };

    init();
  }, []);

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
      const amountInWei = web3.utils.toWei(form.amount, "ether");

      await tokenContract.methods
        .approve(EV_CONTRACT_ADDRESS, amountInWei)
        .send({ from: account });

      alert("✅ WFO token approved!");
    } catch (err) {
      console.error("Approval error:", err);
      alert("❌ Approval failed!");
    }
  };

  const makePayment = async () => {
    try {
      const amountInWei = web3.utils.toWei(form.amount, "ether");

      await contract.methods
        .payCharging(form.stationId, form.vehicleId, amountInWei)
        .send({ from: account });

      const newRecord = {
        account,
        ...form,
        amount: form.amount + " WFO",
        timestamp: new Date().toLocaleString(),
      };

      savePaymentData(newRecord);
      alert("✅ Payment successful!");
    } catch (err) {
      console.error("Payment error:", err);
      alert("❌ Payment failed!");
    }
  };

  // Saving JSON file is not supported directly in browser (React)
  const savePaymentData = (record) => {
    // Example: Store in localStorage instead
    let data = JSON.parse(localStorage.getItem("paymentRecords") || "[]");
    data.push(record);
    localStorage.setItem("paymentRecords", JSON.stringify(data, null, 2));
    console.log("Saved payment:", record);
  };

  return (
    <div style={{ padding: 30 }}>
      <h1>🚗 EV Charging Payment</h1>
      <p><strong>Connected Wallet:</strong> {account || "Not connected"}</p>

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

      <button onClick={approveWFO}>Approve Token</button>
      <button onClick={makePayment} style={{ marginLeft: "10px" }}>Make Payment</button>
    </div>
  );
}

export default App;
