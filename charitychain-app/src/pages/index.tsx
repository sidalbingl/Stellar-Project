import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getAddress, isConnected, requestAccess } from "@stellar/freighter-api";

export default function Home() {
  const router = useRouter();
  const [connected, setConnected] = useState<boolean>(false);
  const [address, setAddress] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const freighter = await isConnected();
        if (freighter) {
          const { address } = await getAddress();
          if (address) {
            setAddress(address);
            setConnected(true);
            localStorage.setItem("cc_publicKey", address);
          }
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const onConnect = async () => {
    setError("");
    try {
      const { address, error } = await requestAccess();
      if (error) {
        setError(String(error));
        return;
      }
      if (address) {
        setAddress(address);
        setConnected(true);
        localStorage.setItem("cc_publicKey", address);
        router.push("/main");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const onDisconnect = () => {
    localStorage.removeItem("cc_publicKey");
    setConnected(false);
    setAddress("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-md p-8 space-y-6 text-center">
        <h1 className="text-2xl font-semibold">💖 CharityChain</h1>
        <p className="text-gray-600">
          Connect your Freighter wallet to continue.
        </p>

        {!connected ? (
          <button
            onClick={onConnect}
            className="w-full py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
          >
            Connect Freighter
          </button>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-700 break-all">
              Connected: {address.substring(0, 6)}...{address.slice(-6)}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push("/main")}
                className="flex-1 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Go to App
              </button>
              <button
                onClick={onDisconnect}
                className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 text-sm text-red-600 bg-red-50 rounded-md p-2">
            {error}
          </div>
        )}

        <div className="text-center text-xs text-gray-400 pt-4 border-t">
          This application runs on the Stellar <strong>Testnet</strong>.
        </div>
      </div>
    </div>
  );
}
