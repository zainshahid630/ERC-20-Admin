import { ethers } from 'ethers';
import { blockchainConfig, getNetworkConfig, switchNetwork } from '../config/blockchainConfig';
import { contractInteraction } from './contractInteraction';

// Initialize provider based on blockchain
export const initializeProvider = async (blockchain, network = 'sepolia') => {
  const networkConfig = getNetworkConfig(blockchain, network);
  
  if (blockchain === 'Ethereum' || blockchain === 'BSC' || blockchain === 'Polygon' || blockchain === 'Avalanche') {
    // EVM compatible chains
    if (window.ethereum) {
      try {
        // Try to switch to the correct network
        await switchNetwork(blockchain, network);
        
        // Create Web3Provider
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        return provider;
      } catch (error) {
        console.error(`Error initializing ${blockchain} provider:`, error);
        throw error;
      }
    } else {
      // Fallback to RPC provider if MetaMask is not available
      return new ethers.providers.JsonRpcProvider(networkConfig.rpcUrl);
    }
  }
  // Rest of the function remains unchanged
}

// Connect wallet based on blockchain
export const connectWallet = async (blockchain) => {
  if (blockchain === 'Ethereum' || blockchain === 'BSC' || blockchain === 'Polygon' || blockchain === 'Avalanche') {
    // EVM compatible chains
    if (!window.ethereum) {
      throw new Error(`MetaMask is required for ${blockchain}`);
    }
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Please unlock your wallet.");
      }
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = accounts[0];
      
      // Verify the connection by getting the network
      const network = await provider.getNetwork();
      console.log("Connected to network:", network.name, "Chain ID:", network.chainId);
      
      // Verify the signer works
      const signerAddress = await signer.getAddress();
      console.log("Signer address:", signerAddress);
      
      if (signerAddress.toLowerCase() !== address.toLowerCase()) {
        console.warn("Signer address doesn't match selected address");
      }
      
      return {
        address,
        provider,
        signer
      };
    } catch (error) {
      console.error("Wallet connection error:", error);
      throw error;
    }
  } else if (blockchain === 'Solana') {
    // Solana specific connection
    if (!window.solana || !window.solana.isPhantom) {
      throw new Error('Phantom wallet is not installed');
    }
    
    const resp = await window.solana.connect();
    return {
      address: resp.publicKey.toString(),
      provider: window.solana,
      // Solana doesn't have the concept of a signer in the same way as Ethereum
    };
  } else if (blockchain === 'Tron') {
    // Tron specific connection
    if (!window.tronWeb) {
      throw new Error('TronLink is not installed');
    }
    
    if (!window.tronWeb.defaultAddress.base58) {
      throw new Error('Please unlock your TronLink wallet');
    }
    
    return {
      address: window.tronWeb.defaultAddress.base58,
      provider: window.tronWeb,
      // TronWeb handles signing differently
    };
  } else {
    throw new Error(`Blockchain ${blockchain} not supported`);
  }
};

// Initialize contract based on blockchain and address
export const initializeContract = async (blockchain, contractAddress, provider) => {
  if (!contractAddress || !ethers.utils.isAddress(contractAddress)) {
    throw new Error("Invalid contract address");
  }
  
  if (!provider) {
    throw new Error("Provider is required to initialize contract");
  }
  
  if (blockchain === 'Ethereum' || blockchain === 'BSC' || blockchain === 'Polygon' || blockchain === 'Avalanche') {
    // EVM compatible chains
    try {
      const contract = contractInteraction.getContract(contractAddress, provider);
      
      // Verify contract is valid by calling a simple view function
      try {
        // Try multiple view functions in case some aren't implemented
        try {
          await contract.symbol();
          console.log("Contract initialized successfully (symbol check)");
        } catch (error) {
          // If symbol fails, try name
          await contract.name();
          console.log("Contract initialized successfully (name check)");
        }
        
        // Try to detect if this is actually an ERC20 token
        try {
          const decimals = await contract.decimals();
          const totalSupply = await contract.totalSupply();
          console.log("Confirmed ERC20 token:", {
            decimals: decimals.toString(),
            totalSupply: totalSupply.toString()
          });
        } catch (error) {
          console.warn("Contract may not be a standard ERC20 token:", error.message);
        }
        
        return contract;
      } catch (error) {
        console.error("Contract initialization verification failed:", error);
        throw new Error("Invalid contract or ABI mismatch. This may not be an ERC20 token.");
      }
    } catch (error) {
      console.error("Contract initialization error:", error);
      throw error;
    }
  } else if (blockchain === 'Solana') {
    // Solana specific contract initialization
    // This would require @solana/web3.js and would look different
    throw new Error('Solana contract initialization not implemented');
  } else if (blockchain === 'Tron') {
    // Tron specific contract initialization
    // This would require TronWeb and would look different
    throw new Error('Tron contract initialization not implemented');
  } else {
    throw new Error(`Blockchain ${blockchain} not supported`);
  }
};

// Get token balance based on blockchain
export const getTokenBalance = async (blockchain, contractAddress, walletAddress, provider) => {
  if (blockchain === 'Ethereum' || blockchain === 'BSC' || blockchain === 'Polygon' || blockchain === 'Avalanche') {
    // EVM compatible chains
    const contract = await initializeContract(blockchain, contractAddress, provider);
    const balance = await contractInteraction.readFunctions.getBalanceOf(contract, walletAddress);
    const decimals = await contractInteraction.readFunctions.getDecimals(contract);
    return formatTokenAmount(blockchain, balance, decimals);
  } else if (blockchain === 'Solana') {
    // Solana specific balance check
    throw new Error('Solana balance check not implemented');
  } else if (blockchain === 'Tron') {
    // Tron specific balance check
    throw new Error('Tron balance check not implemented');
  } else {
    throw new Error(`Blockchain ${blockchain} not supported`);
  }
};

// Format token amount based on blockchain and decimals
export const formatTokenAmount = (blockchain, amount, decimals) => {
  if (blockchain === 'Ethereum' || blockchain === 'BSC' || blockchain === 'Polygon' || blockchain === 'Avalanche') {
    // EVM compatible chains
    return ethers.utils.formatUnits(amount, decimals);
  } else if (blockchain === 'Solana') {
    // Solana typically uses 9 decimals for SPL tokens
    return amount / Math.pow(10, decimals || 9);
  } else if (blockchain === 'Tron') {
    // Tron typically uses 6 decimals for TRC20 tokens
    return amount / Math.pow(10, decimals || 6);
  } else {
    throw new Error(`Blockchain ${blockchain} not supported`);
  }
};

// Parse token amount based on blockchain and decimals
export const parseTokenAmount = (blockchain, amount, decimals) => {
  if (blockchain === 'Ethereum' || blockchain === 'BSC' || blockchain === 'Polygon' || blockchain === 'Avalanche') {
    // EVM compatible chains
    return ethers.utils.parseUnits(amount.toString(), decimals);
  } else if (blockchain === 'Solana') {
    // Solana typically uses 9 decimals for SPL tokens
    return Math.floor(amount * Math.pow(10, decimals || 9));
  } else if (blockchain === 'Tron') {
    // Tron typically uses 6 decimals for TRC20 tokens
    return Math.floor(amount * Math.pow(10, decimals || 6));
  } else {
    throw new Error(`Blockchain ${blockchain} not supported`);
  }
};
