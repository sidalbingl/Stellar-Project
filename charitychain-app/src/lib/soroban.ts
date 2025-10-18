import { 
  Address, 
  Contract, 
  rpc, 
  TransactionBuilder, 
  xdr, 
  BASE_FEE, 
  Networks,
  Account,
  Operation
} from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";

// Contract configuration
const SOROBAN_RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || Networks.TESTNET;
const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || "";

// Initialize RPC server
const server = new rpc.Server(SOROBAN_RPC_URL, { allowHttp: true });

/**
 * Get contract instance
 */
export function getContract(): Contract | null {
  if (!CONTRACT_ID) {
    console.error("Contract ID not configured");
    return null;
  }
  return new Contract(CONTRACT_ID);
}

/**
 * Get account info from RPC
 */
export async function getAccountInfo(publicKey: string): Promise<Account | null> {
  try {
    const accountResponse = await server.getAccount(publicKey);
    return new Account(publicKey, accountResponse.sequenceNumber());
  } catch (error) {
    console.error("Failed to get account info:", error);
    return null;
  }
}

/**
 * Contribute to charity (write operation)
 */
export async function contribute(
  contributorAddress: string, 
  amount: number
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  const contract = getContract();
  if (!contract) {
    return { success: false, error: "Contract not configured" };
  }

  try {
    // Get account info
    const account = await getAccountInfo(contributorAddress);
    if (!account) {
      return { success: false, error: "Failed to get account info" };
    }

    // Build transaction
    const contributor = Address.fromString(contributorAddress);
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          "contribute",
          contributor.toScVal(),
          xdr.ScVal.scvU32(amount)
        )
      )
      .setTimeout(30)
      .build();

    // Prepare transaction
    const preparedTx = await server.prepareTransaction(tx);
    
    // Sign with Freighter
    const signedResult = await signTransaction(preparedTx.toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
      address: contributorAddress,
    });

    if (signedResult.error) {
      return { success: false, error: signedResult.error };
    }

    // Submit transaction
    const submitTx = TransactionBuilder.fromXDR(signedResult.signedTxXdr, NETWORK_PASSPHRASE);
    const result = await server.sendTransaction(submitTx);
    
    return { 
      success: true, 
      txHash: result.hash 
    };
  } catch (error) {
    console.error("Contribute error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Get total funds (read operation)
 */
export async function getTotalFunds(): Promise<{ success: boolean; total?: number; error?: string }> {
  const contract = getContract();
  if (!contract) {
    return { success: false, error: "Contract not configured" };
  }

  try {
    // Create a dummy account for simulation
    const dummyAccount = new Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0");
    
    const tx = new TransactionBuilder(dummyAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call("get_total_funds"))
      .setTimeout(30)
      .build();

    const preparedTx = await server.prepareTransaction(tx);
    const simulation = await server.simulateTransaction(preparedTx);
    
    // Check for simulation errors
    if ('error' in simulation && simulation.error) {
      return { 
        success: false, 
        error: `Simulation error: ${simulation.error}` 
      };
    }

    // Extract result from simulation
    if (simulation && 'result' in simulation && simulation.result) {
      const result = simulation.result.retval;
      if (result) {
        try {
          const scVal = xdr.ScVal.fromXDR(result.toXDR("base64"), "base64");
          const total = scVal.value ? Number(scVal.value()) : 0;
          return { success: true, total };
        } catch (parseError) {
          console.error("Error parsing total funds:", parseError);
          return { success: false, error: "Failed to parse contract response" };
        }
      }
    }
    
    return { success: false, error: "No result from simulation" };
  } catch (error) {
    console.error("Get total funds error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Get last contributor (read operation)
 */
export async function getLastContributor(): Promise<{ success: boolean; address?: string; error?: string }> {
  const contract = getContract();
  if (!contract) {
    return { success: false, error: "Contract not configured" };
  }

  try {
    // Create a dummy account for simulation
    const dummyAccount = new Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0");
    
    const tx = new TransactionBuilder(dummyAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call("get_last_contributor"))
      .setTimeout(30)
      .build();

    const preparedTx = await server.prepareTransaction(tx);
    const simulation = await server.simulateTransaction(preparedTx);
    
    // Check for simulation errors first
    if ('error' in simulation && simulation.error) {
      return { 
        success: false, 
        error: `Simulation error: ${simulation.error}` 
      };
    }

    // Check if simulation has results
    if (!simulation || !('result' in simulation) || !simulation.result) {
      return { 
        success: false, 
        error: "No result from simulation" 
      };
    }

    // Extract result from simulation
    const result = simulation.result.retval;
    if (!result) {
      return { 
        success: false, 
        error: "No contributor data available (contract may be empty)" 
      };
    }

    try {
      // Parse the ScVal safely
      const scVal = xdr.ScVal.fromXDR(result.toXDR("base64"), "base64");
      
      // Check if it's an Address type
      if (!scVal || typeof scVal.switch !== 'function') {
        return { 
          success: false, 
          error: "Invalid response format from contract" 
        };
      }

      // Try to parse as Address
      const address = Address.fromScVal(scVal);
      if (!address) {
        return { 
          success: false, 
          error: "Could not parse address from contract" 
        };
      }

      return { success: true, address: address.toString() };
    } catch (parseError) {
      console.error("Error parsing last contributor:", parseError);
      
      // More helpful error message
      if (parseError instanceof Error) {
        if (parseError.message.includes("switch")) {
          return { 
            success: false, 
            error: "Contract returned invalid data format (possible empty state)" 
          };
        }
        return { 
          success: false, 
          error: `Parse error: ${parseError.message}` 
        };
      }
      
      return { 
        success: false, 
        error: "Failed to parse contributor address" 
      };
    }
  } catch (error) {
    console.error("Get last contributor error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}