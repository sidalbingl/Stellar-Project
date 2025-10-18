import { 
  isConnected, 
  requestAccess, 
  getAddress, 
  signTransaction,
  signMessage 
} from "@stellar/freighter-api";

/**
 * Check if Freighter wallet is installed and connected
 */
export async function checkFreighterConnection(): Promise<boolean> {
  try {
    const result = await isConnected();
    return result.isConnected;
  } catch (error) {
    console.error("Freighter connection check failed:", error);
    return false;
  }
}

/**
 * Request access to Freighter wallet
 */
export async function connectFreighter(): Promise<{ success: boolean; address?: string; error?: string }> {
  try {
    const result = await requestAccess();
    if (result.error) {
      return { success: false, error: result.error };
    }
    return { success: true, address: result.address };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Get current wallet address
 */
export async function getWalletAddress(): Promise<{ success: boolean; address?: string; error?: string }> {
  try {
    const result = await getAddress();
    if (result.error) {
      return { success: false, error: result.error };
    }
    return { success: true, address: result.address };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Sign a message with Freighter
 */
export async function signMessageWithFreighter(
  message: string, 
  address: string
): Promise<{ success: boolean; signedMessage?: string; error?: string }> {
  try {
    const result = await signMessage(message, { address });
    if (result.error) {
      return { success: false, error: result.error };
    }
    return { success: true, signedMessage: typeof result.signedMessage === 'string' ? result.signedMessage : undefined };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Sign a transaction with Freighter
 */
export async function signTransactionWithFreighter(
  xdr: string, 
  address: string,
  networkPassphrase: string
): Promise<{ success: boolean; signedTxXdr?: string; error?: string }> {
  try {
    const result = await signTransaction(xdr, { 
      networkPassphrase,
      address 
    });
    if (result.error) {
      return { success: false, error: result.error };
    }
    return { success: true, signedTxXdr: result.signedTxXdr };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}
