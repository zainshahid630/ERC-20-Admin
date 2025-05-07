/**
 * Blockchain Configuration
 * Contains RPC URLs, Chain IDs, and token addresses for different blockchains
 */

export const blockchainConfig = {
  // Ethereum configuration
  Ethereum: {
    // Mainnet
    // mainnet: {
    //   name: "Ethereum Mainnet",
    //   rpcUrl: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY", // Replace with your Infura key
    //   chainId: 1,
    //   blockExplorer: "https://etherscan.io",
    //   tokens: {
    //     // Example tokens
    //     USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    //     USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    //     DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    //     // Add your tokens here
    //   }
    // },
    // // Goerli Testnet
    // goerli: {
    //   name: "Goerli Testnet",
    //   rpcUrl: "https://goerli.infura.io/v3/YOUR_INFURA_KEY", // Replace with your Infura key
    //   chainId: 5,
    //   blockExplorer: "https://goerli.etherscan.io",
    //   tokens: {
    //     // Example test tokens
    //     TestToken: "0x...", // Replace with your test token address
    //   }
    // },
    // Sepolia Testnet
    sepolia: {
      name: "Sepolia Testnet",
      rpcUrl: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161', // Public Infura endpoint
      chainId: 11155111, // Use decimal format for consistency
      blockExplorer: "https://sepolia.etherscan.io",
      tokens: {
        // Example test tokens
        TestToken: "0x17712AD044D30AFf9754c5E98454C3eb1de01b39", // USDT on Sepolia
      }
    }
  },
  
  // Binance Smart Chain configuration
  // BSC: {
  //   // Mainnet
  //   mainnet: {
  //     name: "BSC Mainnet",
  //     rpcUrl: "https://bsc-dataseed.binance.org/",
  //     chainId: 56,
  //     blockExplorer: "https://bscscan.com",
  //     tokens: {
  //       // Example tokens
  //       BUSD: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
  //       CAKE: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
  //       // Add your tokens here
  //     }
  //   },
  //   // Testnet
  //   testnet: {
  //     name: "BSC Testnet",
  //     rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  //     chainId: 97,
  //     blockExplorer: "https://testnet.bscscan.com",
  //     tokens: {
  //       // Example test tokens
  //       TestToken: "0x...", // Replace with your test token address
  //     }
  //   }
  // },
  
  // Polygon configuration
  // Polygon: {
  //   // Mainnet
  //   mainnet: {
  //     name: "Polygon Mainnet",
  //     rpcUrl: "https://polygon-rpc.com",
  //     chainId: 137,
  //     blockExplorer: "https://polygonscan.com",
  //     tokens: {
  //       // Example tokens
  //       USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
  //       USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  //       // Add your tokens here
  //     }
  //   },
  //   // Mumbai Testnet
  //   mumbai: {
  //     name: "Mumbai Testnet",
  //     rpcUrl: "https://rpc-mumbai.maticvigil.com",
  //     chainId: 80001,
  //     blockExplorer: "https://mumbai.polygonscan.com",
  //     tokens: {
  //       // Example test tokens
  //       TestToken: "0x...", // Replace with your test token address
  //     }
  //   }
  // },
  
  // Avalanche configuration
  // Avalanche: {
  //   // Mainnet
  //   mainnet: {
  //     name: "Avalanche C-Chain",
  //     rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
  //     chainId: 43114,
  //     blockExplorer: "https://snowtrace.io",
  //     tokens: {
  //       // Example tokens
  //       USDT: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
  //       USDC: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
  //       // Add your tokens here
  //     }
  //   },
  //   // Fuji Testnet
  //   fuji: {
  //     name: "Avalanche Fuji Testnet",
  //     rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
  //     chainId: 43113,
  //     blockExplorer: "https://testnet.snowtrace.io",
  //     tokens: {
  //       // Example test tokens
  //       TestToken: "0x...", // Replace with your test token address
  //     }
  //   }
  // },
  
  // Solana configuration
  Solana: {
    // Mainnet
    mainnet: {
      name: "Solana Mainnet",
      rpcUrl: "https://api.mainnet-beta.solana.com",
      tokens: {
        // Example tokens - Solana uses different address format
        USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        // Add your tokens here
      }
    },
    // Devnet
    devnet: {
      name: "Solana Devnet",
      rpcUrl: "https://api.devnet.solana.com",
      tokens: {
        // Example test tokens
        TestToken: "...", // Replace with your test token address
      }
    }
  },
  
  // Tron configuration
  Tron: {
    // Mainnet
    mainnet: {
      name: "Tron Mainnet",
      rpcUrl: "https://api.trongrid.io",
      tokens: {
        // Example tokens - Tron uses different address format
        USDT: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        // Add your tokens here
      }
    },
    // Shasta Testnet
    shasta: {
      name: "Tron Shasta Testnet",
      rpcUrl: "https://api.shasta.trongrid.io",
      tokens: {
        // Example test tokens
        TestToken: "...", // Replace with your test token address
      }
    }
  }
};

// Helper function to get network configuration
export const getNetworkConfig = (blockchain, network = 'mainnet') => {
  if (!blockchainConfig[blockchain]) {
    throw new Error(`Blockchain ${blockchain} not supported`);
  }
  
  if (!blockchainConfig[blockchain][network]) {
    throw new Error(`Network ${network} not supported for ${blockchain}`);
  }
  
  return blockchainConfig[blockchain][network];
};

// Helper function to get token address
export const getTokenAddress = (blockchain, network, tokenSymbol) => {
  const networkConfig = getNetworkConfig(blockchain, network);
  
  if (!networkConfig.tokens[tokenSymbol]) {
    throw new Error(`Token ${tokenSymbol} not found for ${blockchain} ${network}`);
  }
  
  return networkConfig.tokens[tokenSymbol];
};

// Helper function to switch network in MetaMask
export const switchNetwork = async (blockchain, network = 'sepolia') => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }
  
  const networkConfig = getNetworkConfig(blockchain, network);
  
  // Skip for non-EVM chains
  if (!networkConfig.chainId) {
    return;
  }
  
  const chainId = typeof networkConfig.chainId === 'string' && networkConfig.chainId.startsWith('0x') 
    ? networkConfig.chainId 
    : `0x${networkConfig.chainId.toString(16)}`;
  
  try {
    // Try to switch to the network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });
    
    console.log(`Switched to ${networkConfig.name} (${chainId})`);
    return true;
  } catch (error) {
    // This error code indicates that the chain has not been added to MetaMask
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId,
              chainName: networkConfig.name,
              nativeCurrency: {
                name: blockchain === 'Ethereum' ? 'Ether' : 
                       blockchain === 'BSC' ? 'BNB' : 
                       blockchain === 'Polygon' ? 'MATIC' : 
                       blockchain === 'Avalanche' ? 'AVAX' : 'Native',
                symbol: blockchain === 'Ethereum' ? 'ETH' : 
                       blockchain === 'BSC' ? 'BNB' : 
                       blockchain === 'Polygon' ? 'MATIC' : 
                       blockchain === 'Avalanche' ? 'AVAX' : 'Native',
                decimals: 18,
              },
              rpcUrls: [networkConfig.rpcUrl],
              blockExplorerUrls: networkConfig.blockExplorer ? [networkConfig.blockExplorer] : undefined,
            },
          ],
        });
        
        console.log(`Added and switched to ${networkConfig.name} (${chainId})`);
        return true;
      } catch (addError) {
        console.error("Error adding network:", addError);
        throw addError;
      }
    } else {
      console.error("Error switching network:", error);
      throw error;
    }
  }
};
