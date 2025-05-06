import { ethers } from 'ethers';
import { blockchainConfig, getNetworkConfig, switchNetwork } from '../config/blockchainConfig';
import { contractInteraction } from './contractInteraction';

// Initialize provider based on blockchain
export const initializeProvider = async (blockchain, network = 'mainnet') => {
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
  } else if (blockchain === 'Solana') {
    // Solana specific provider
    if (!window.solana || !window.solana.isPhantom) {
      throw new Error('Phantom wallet is not installed');
    }
    
    // Return Solana connection (would need @solana/web3.js in a real implementation)
    return { type: 'solana', connection: networkConfig.rpcUrl };
  } else if (blockchain === 'Tron') {
    // Tron specific provider
    if (!window.tronWeb) {
      throw new Error('TronLink is not installed');
    }
    
    // Check if TronWeb is connected to the correct network
    // This is simplified - in a real app you'd need to check the network and handle it
    return { type: 'tron', tronWeb: window.tronWeb };
  } else {
    throw new Error(`Blockchain ${blockchain} not supported`);
  }
};

// Connect wallet based on blockchain
export const connectWallet = async (blockchain) => {
  if (blockchain === 'Ethereum' || blockchain === 'BSC' || blockchain === 'Polygon' || blockchain === 'Avalanche') {
    // EVM compatible chains
    if (!window.ethereum) {
      throw new Error(`MetaMask is required for ${blockchain}`);
    }
    
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    
    return {
      address: accounts[0],
      provider,
      signer
    };
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
  if (blockchain === 'Ethereum' || blockchain === 'BSC' || blockchain === 'Polygon' || blockchain === 'Avalanche') {
    // EVM compatible chains
    return contractInteraction.getContract(contractAddress, provider);
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
    const contract = contractInteraction.getContract(contractAddress, provider);
    return await contractInteraction.readFunctions.getBalanceOf(contract, walletAddress);
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