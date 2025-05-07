import { Ethereum } from '../ABI/Ethereum';
import { ethers } from 'ethers';

// Contract interaction functions
export const contractInteraction = {
  // Initialize contract with address
  getContract: (contractAddress, provider) => {
    if (!contractAddress || !provider) return null;
    
    // If provider has getSigner method, it's a Web3Provider, so use the signer for write operations
    if (provider.getSigner) {
      try {
        const signer = provider.getSigner();
        return new ethers.Contract(contractAddress, Ethereum, signer);
      } catch (error) {
        console.error("Error getting signer:", error);
        return new ethers.Contract(contractAddress, Ethereum, provider);
      }
    }
    
    return new ethers.Contract(contractAddress, Ethereum, provider);
  },

  // Read functions
  readFunctions: {
    // Get token name
    getName: async (contract) => {
      try {
        return await contract.name();
      } catch (error) {
        console.error("Error getting token name:", error);
        throw error;
      }
    },

    // Get token symbol
    getSymbol: async (contract) => {
      try {
        return await contract.symbol();
      } catch (error) {
        console.error("Error getting token symbol:", error);
        throw error;
      }
    },

    // Get token decimals
    getDecimals: async (contract) => {
      try {
        return await contract.decimals();
      } catch (error) {
        console.error("Error getting token decimals:", error);
        throw error;
      }
    },

    // Get total supply
    getTotalSupply: async (contract) => {
      try {
        const totalSupply = await contract.totalSupply();
        return totalSupply;
      } catch (error) {
        console.error("Error getting total supply:", error);
        throw error;
      }
    },

    // Get balance of address
    getBalanceOf: async (contract, address) => {
      try {
        // Check if address is valid
        if (!address || address === '') {
          console.warn("Empty address provided to getBalanceOf");
          return ethers.BigNumber.from(0);
        }
        
        const balance = await contract.balanceOf(address);
        return balance;
      } catch (error) {
        console.error("Error getting balance:", error);
        throw error;
      }
    },

    // Get allowance
    getAllowance: async (contract, owner, spender) => {
      try {
        // Check if addresses are valid
        if (!owner || owner === '' || !spender || spender === '') {
          console.warn("Empty address provided to getAllowance");
          return ethers.BigNumber.from(0);
        }
        
        const allowance = await contract.allowance(owner, spender);
        return allowance;
      } catch (error) {
        console.error("Error getting allowance:", error);
        throw error;
      }
    },

    // Check if paused
    isPaused: async (contract) => {
      try {
        return await contract.paused();
      } catch (error) {
        console.error("Error checking if paused:", error);
        throw error;
      }
    },

    // Check if address is blacklisted
    isBlackListed: async (contract, address) => {
      try {
        // Check if address is valid
        if (!address || address === '') {
          console.warn("Empty address provided to isBlackListed");
          return false;
        }
        
        return await contract.isBlackListed(address);
      } catch (error) {
        console.error("Error checking blacklist status:", error);
        throw error;
      }
    },

    // Check if address is whitelisted
    isWhiteListed: async (contract, address) => {
      try {
        // Check if address is valid
        if (!address || address === '') {
          console.warn("Empty address provided to isWhiteListed");
          return false;
        }
        
        return await contract.isWhiteListed(address);
      } catch (error) {
        console.error("Error checking whitelist status:", error);
        throw error;
      }
    },

    // Check if whitelist is enabled
    isWhitelistEnabled: async (contract) => {
      try {
        return await contract.isWhitelistEnabled();
      } catch (error) {
        console.error("Error checking if whitelist is enabled:", error);
        throw error;
      }
    },
  },

  // Write functions
  writeFunctions: {
    // Transfer tokens
    transfer: async (contract, to, amount) => {
      try {
        // Ensure we're using a contract connected to a signer
        if (!contract.signer) {
          throw new Error("Contract must be connected to a signer for write operations");
        }
        
        // Validate the recipient address
        if (!to || to === '' || !ethers.utils.isAddress(to)) {
          throw new Error("Invalid recipient address");
        }
        
        // Validate amount
        if (!amount || amount.lte(ethers.BigNumber.from(0))) {
          throw new Error("Amount must be greater than 0");
        }
        
        // Get the signer's address
        const signerAddress = await contract.signer.getAddress();
        console.log("Signer address:", signerAddress);
        
        // Check if the user has enough balance
        const balance = await contract.balanceOf(signerAddress);
        console.log("User balance:", balance.toString(), "Transfer amount:", amount.toString());
        
        if (balance.lt(amount)) {
          throw new Error("Insufficient balance for transfer");
        }
        
        // Check if the contract is paused
        try {
          const isPaused = await contract.paused();
          if (isPaused) {
            throw new Error("Token transfers are currently paused");
          }
        } catch (error) {
          console.log("Could not check if contract is paused, continuing anyway");
        }
        
        // Check if sender is blacklisted
        try {
          const isBlacklisted = await contract.isBlackListed(signerAddress);
          if (isBlacklisted) {
            throw new Error("Your address is blacklisted");
          }
        } catch (error) {
          console.log("Could not check blacklist status, continuing anyway");
        }
        
        // Check if whitelist is enabled and if sender is whitelisted
        try {
          const isWhitelistEnabled = await contract.isWhitelistEnabled();
          if (isWhitelistEnabled) {
            const isWhitelisted = await contract.isWhiteListed(signerAddress);
            if (!isWhitelisted) {
              throw new Error("Whitelist is enabled and your address is not whitelisted");
            }
          }
        } catch (error) {
          console.log("Could not check whitelist status, continuing anyway");
        }
        
        console.log("Attempting transfer to:", to, "Amount:", amount.toString());
        
        // Try to estimate gas first to catch potential errors
    
        
        // Send the transaction with explicit gas limit and higher gas price
        const tx = await contract.transfer(to, amount, {
          gasLimit: 200000, // Use estimate or fallback
    
        });
        
        console.log("Transaction hash:", tx.hash);
        
        // Wait for transaction confirmation
        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt);
        
        // Check if transaction was successful
        if (receipt.status === 0) {
          throw new Error("Transaction failed on-chain");
        }
        
        return receipt;
      } catch (error) {
        console.error("Error transferring tokens:", error);
        // Unwrap nested errors
        if (error.error) {
          throw error.error;
        }
        throw error;
      }
    },

    // Approve spender
    approve: async (contract, spender, amount) => {
      try {
        const tx = await contract.approve(spender, amount);
        return await tx.wait();
      } catch (error) {
        console.error("Error approving tokens:", error);
        throw error;
      }
    },

    // Transfer tokens from one address to another (requires approval)
    transferFrom: async (contract, from, to, amount) => {
      try {
        const tx = await contract.transferFrom(from, to, amount);
        return await tx.wait();
      } catch (error) {
        console.error("Error transferring tokens from address:", error);
        throw error;
      }
    },

    // Mint new tokens (requires owner permission)
    mint: async (contract, userAddress, amount) => {
      try {
        const tx = await contract.mint(userAddress, amount);
        return await tx.wait();
      } catch (error) {
        console.error("Error minting tokens:", error);
        throw error;
      }
    },

    // Burn tokens
    burn: async (contract, amount) => {
      try {
        const tx = await contract.burn(amount);
        return await tx.wait();
      } catch (error) {
        console.error("Error burning tokens:", error);
        throw error;
      }
    },

    // Add address to blacklist (requires owner permission)
    addBlackList: async (contract, address) => {
      try {
        const tx = await contract.addBlackList(address);
        return await tx.wait();
      } catch (error) {
        console.error("Error adding address to blacklist:", error);
        throw error;
      }
    },

    // Remove address from blacklist (requires owner permission)
    removeBlackList: async (contract, address) => {
      try {
        const tx = await contract.removeBlackList(address);
        return await tx.wait();
      } catch (error) {
        console.error("Error removing address from blacklist:", error);
        throw error;
      }
    },

    // Add address to whitelist (requires owner permission)
    addWhiteList: async (contract, address) => {
      try {
        const tx = await contract.addWhiteList(address);
        return await tx.wait();
      } catch (error) {
        console.error("Error adding address to whitelist:", error);
        throw error;
      }
    },

    // Remove address from whitelist (requires owner permission)
    removeWhiteList: async (contract, address) => {
      try {
        const tx = await contract.removeWhiteList(address);
        return await tx.wait();
      } catch (error) {
        console.error("Error removing address from whitelist:", error);
        throw error;
      }
    },

    // Enable whitelist (requires owner permission)
    enableWhiteList: async (contract) => {
      try {
        const tx = await contract.enableWhiteList();
        return await tx.wait();
      } catch (error) {
        console.error("Error enabling whitelist:", error);
        throw error;
      }
    },

    // Disable whitelist (requires owner permission)
    disableWhiteList: async (contract) => {
      try {
        const tx = await contract.disableWhiteList();
        return await tx.wait();
      } catch (error) {
        console.error("Error disabling whitelist:", error);
        throw error;
      }
    },

    // Pause contract (requires owner permission)
    pause: async (contract) => {
      try {
        const tx = await contract.pause();
        return await tx.wait();
      } catch (error) {
        console.error("Error pausing contract:", error);
        throw error;
      }
    },

    // Unpause contract (requires owner permission)
    unpause: async (contract) => {
      try {
        const tx = await contract.unpause();
        return await tx.wait();
      } catch (error) {
        console.error("Error unpausing contract:", error);
        throw error;
      }
    },

    // Transfer ownership (requires owner permission)
    transferOwnership: async (contract, newOwner) => {
      try {
        // Ensure we're using a contract connected to a signer
        if (!contract.signer) {
          throw new Error("Contract must be connected to a signer for write operations");
        }
        
        // Validate the new owner address
        if (!newOwner || newOwner === '' || !ethers.utils.isAddress(newOwner)) {
          throw new Error("Invalid new owner address");
        }
        
        // Get the signer's address
        const signerAddress = await contract.signer.getAddress();
        console.log("Signer address:", signerAddress);
        
        // Check if the signer is the current owner
        try {
          const owner = await contract.owner();
          if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
            throw new Error("Only the current owner can transfer ownership");
          }
        } catch (error) {
          console.error("Error checking ownership:", error);
          throw new Error("Failed to verify ownership status");
        }
        
        console.log("Attempting to transfer ownership to:", newOwner);
        
        // Send the transaction with explicit gas limit
        const tx = await contract.transferOwnership(newOwner, {
          gasLimit: 200000,
        });
        
        console.log("Transaction hash:", tx.hash);
        
        // Wait for transaction confirmation
        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt);
        
        // Check if transaction was successful
        if (receipt.status === 0) {
          throw new Error("Transaction failed on-chain");
        }
        
        return receipt;
      } catch (error) {
        console.error("Error transferring ownership:", error);
        // Unwrap nested errors
        if (error.error) {
          throw error.error;
        }
        throw error;
      }
    }
  }
};
