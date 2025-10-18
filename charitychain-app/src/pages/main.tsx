import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getAddress } from "@stellar/freighter-api";
import { contribute, getTotalFunds } from "../lib/soroban";

export default function MainPage() {
  const router = useRouter();
  const [publicKey, setPublicKey] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [totalFunds, setTotalFunds] = useState<string>("0");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");

  // ✅ Check wallet connection
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const { address } = await getAddress();
        if (isMounted) {
          if (address) {
            setPublicKey(address);
            setIsInitialized(true);
            await refreshTotals();
          } else {
            router.replace("/");
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error("Failed to get wallet address:", error);
          router.replace("/");
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // ✅ Update total funds
  const refreshTotals = async () => {
    try {
      const totalResult = await getTotalFunds();
      if (totalResult.success && totalResult.total !== undefined) {
        setTotalFunds(String(totalResult.total));
      }
    } catch (e) {
      console.error("Failed to fetch totals:", e);
    }
  };

  // ✅ Send donation
  const sendDonation = async () => {
    if (!publicKey) {
      setStatus("⚠️ Wallet not connected.");
      return;
    }

    const amt = parseInt(amount, 10);
    if (!Number.isFinite(amt) || amt <= 0) {
      setStatus("⚠️ Invalid amount. Please enter a positive number.");
      return;
    }

    setIsLoading(true);
    setStatus("⏳ Sending transaction...");
    try {
      const result = await contribute(publicKey, amt);
      if (result.success) {
        setStatus(`✅ Donation successful! TX: ${result.txHash || "N/A"}`);
        // Slight delay to allow the blockchain to update the total
        setTimeout(async () => {
          await refreshTotals();
        }, 3000);
        setAmount("");
      } else {
        setStatus(`❌ Donation failed: ${result.error || "Unknown error"}`);
      }
    } catch (e) {
      console.error("Donation error:", e);
      setStatus("❌ Donation failed: " + ((e as Error).message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-700 text-lg font-medium">
          Connecting to wallet...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-center">💖 CharityChain</h1>

        <div className="text-sm text-center text-gray-500">
          {publicKey
            ? `Connected Account: ${publicKey.substring(0, 6)}...${publicKey.slice(-6)}`
            : "Wallet not connected"}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Donation Amount (XLM)
          </label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 10"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-100"
            disabled={isLoading}
          />
        </div>

        <button
          onClick={sendDonation}
          disabled={isLoading}
          className="w-full py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isLoading ? "Sending..." : "Donate"}
        </button>

        <div className="text-center">
          <div className="text-sm text-gray-600">Total Funds</div>
          <div className="text-xl font-bold">{totalFunds} XLM</div>
        </div>

        {status && (
          <div
            className={`text-center text-sm p-2 rounded-md break-all overflow-hidden ${
              status.includes("✅")
                ? "bg-green-50 text-green-700"
                : status.includes("❌")
                ? "bg-red-50 text-red-700"
                : status.includes("⚠️")
                ? "bg-yellow-50 text-yellow-700"
                : "bg-gray-50 text-gray-600"
            }`}
          >
            {status}
          </div>
        )}

        <div className="text-center text-xs text-gray-400 pt-4 border-t">
          This application runs on the Stellar <strong>Testnet</strong>.
        </div>
      </div>
    </div>
  );
}
