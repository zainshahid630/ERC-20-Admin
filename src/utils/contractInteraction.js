import { Ethereum } from '../ABI/Ethereum';
import { ethers } from 'ethers';

// Contract interaction functions
export const contractInteraction = {
  // Initialize contract with address
  getContract: (contractAddress, provider) => {
    if (!contractAddress || !provider) return null;
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
        return await contract.isBlackListed(address);
      } catch (error) {
        console.error("Error checking blacklist status:", error);
        throw error;
      }
    },

    // Check if address is whitelisted
    isWhiteListed: async (contract, address) => {
      try {
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
        const tx = await contract.transfer(to, amount);
        return await tx.wait();
      } catch (error) {
        console.error("Error transferring tokens:", error);
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
  }
};