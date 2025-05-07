import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { contractInteraction } from './utils/contractInteraction';
import { blockchainConfig, getNetworkConfig, getTokenAddress } from './config/blockchainConfig';
import { initializeProvider, connectWallet } from './utils/blockchainInteraction';

// Get available blockchains from config
const availableBlockchains = Object.keys(blockchainConfig);

// Wallet mapping
const blockchainWallets = {
  'Ethereum': 'MetaMask',
  'BSC': 'MetaMask',
  'Polygon': 'MetaMask',
  'Avalanche': 'MetaMask',
  'Solana': 'Phantom',
  'Tron': 'TronLink'
};

const menuItems = [
  'Token Info',
  'Transfers',
  'Access Control',
  'Security',
  'Settings'
];

export default function AdminPanel() {
  // State variables
  const [selectedMenu, setSelectedMenu] = useState('Token Info');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedBlockchain, setSelectedBlockchain] = useState('Ethereum');
  const [selectedNetwork, setSelectedNetwork] = useState('sepolia');
  const [availableNetworks, setAvailableNetworks] = useState([]);
  const [availableTokens, setAvailableTokens] = useState({});
  const [selectedToken, setSelectedToken] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [walletError, setWalletError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [contractAddress, setContractAddress] = useState('');
  const [tokenInfo, setTokenInfo] = useState({
    name: '',
    symbol: '',
    decimals: 0,
    totalSupply: '0',
    balance: '0',
    isOwner: false,
    isPaused: false,
    isWhitelistEnabled: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentChainId, setCurrentChainId] = useState(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);
  
  // Form state variables
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [blacklistAddress, setBlacklistAddress] = useState('');
  const [whitelistAddress, setWhitelistAddress] = useState('');
  const [newOwnerAddress, setNewOwnerAddress] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [mintAddress, setMintAddress] = useState('');
  const [burnAmount, setBurnAmount] = useState('');

  useEffect(()=>{
    initializeContract()
  },[walletAddress])

  // Update available networks when blockchain changes
  useEffect(() => {
    if (selectedBlockchain && blockchainConfig[selectedBlockchain]) {
      const networks = Object.keys(blockchainConfig[selectedBlockchain]);
      setAvailableNetworks(networks);
      setSelectedNetwork(networks[0] || 'mainnet');
    }
  }, [selectedBlockchain]);
  
  // Update available tokens when network changes
  useEffect(() => {
    if (selectedBlockchain && selectedNetwork && 
        blockchainConfig[selectedBlockchain] && 
        blockchainConfig[selectedBlockchain][selectedNetwork]) {
      const tokens = blockchainConfig[selectedBlockchain][selectedNetwork].tokens || {};
      setAvailableTokens(tokens);
      setSelectedToken('');
      setContractAddress('');
    }
  }, [selectedBlockchain, selectedNetwork]);
  
  // Update contract address when token changes
  useEffect(() => {
    if (selectedToken && availableTokens[selectedToken]) {
      setContractAddress(availableTokens[selectedToken]);
    }
  }, [selectedToken, availableTokens]);

  // Connect wallet
  const connectWalletHandler = async () => {
    // Check if blockchain and token are selected
    if (!selectedBlockchain) {
      setWalletError("Please select a blockchain first");
      return;
    }
    
    setIsConnecting(true);
    setWalletError('');
    
    try {
      const { address, provider: walletProvider, signer: walletSigner } = 
        await connectWallet(selectedBlockchain);
      
      setWalletAddress(address);
      setProvider(walletProvider);
      setSigner(walletSigner);
      
      // Check if we're on the correct network
      const network = await walletProvider.getNetwork();
      const targetChainId = blockchainConfig['Ethereum']['sepolia'].chainId;
      setCurrentChainId(network.chainId);
      setIsCorrectNetwork(network.chainId === targetChainId);
      
      // Initialize contract after wallet connection if contract address is available
      if (contractAddress) {
        try {
          setIsLoading(true);
          const tokenContract = contractInteraction.getContract(contractAddress, walletProvider);
          setContract(tokenContract);
          
          // Load token info
          await loadTokenInfo(tokenContract);
        } catch (error) {
          console.error("Error initializing contract:", error);
          setWalletError("Error initializing contract: " + error.message);
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      setWalletError(error.message);
      console.error('Wallet connection error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setWalletAddress('');
    setProvider(null);
    setSigner(null);
    setContract(null);
    setContractAddress('');
    setTokenInfo({
      name: '',
      symbol: '',
      decimals: 0,
      totalSupply: '0',
      balance: '0',
      isOwner: false,
      isPaused: false,
      isWhitelistEnabled: false
    });
  };

  // Handle blockchain change
  const handleBlockchainChange = (e) => {
    setSelectedBlockchain(e.target.value);
    setWalletAddress(''); // Reset wallet connection when blockchain changes
    setWalletError('');
    setProvider(null);
    setSigner(null);
    setContract(null);
  };
  
  // Handle network change
  const handleNetworkChange = (e) => {
    setSelectedNetwork(e.target.value);
    setWalletAddress(''); // Reset wallet connection when network changes
    setWalletError('');
    setProvider(null);
    setSigner(null);
    setContract(null);
  };
  
  // Handle token selection
  const handleTokenChange = (e) => {
    setSelectedToken(e.target.value);
    setWalletError(''); // Clear any errors when token changes
    
    // Update contract address based on selected token
    if (e.target.value && availableTokens[e.target.value]) {
      setContractAddress(availableTokens[e.target.value]);
    } else {
      setContractAddress('');
    }
  };

  // Handle contract address change
  const handleContractAddressChange = (e) => {
    setContractAddress(e.target.value);
    setWalletError(''); // Clear any errors when contract address changes
    
    // If manually entering contract address, clear selected token
    if (e.target.value) {
      setSelectedToken('');
    }
  };

  // Initialize contract
  const initializeContract = async () => {
    if (!contractAddress) {
      // setWalletError("Please enter a contract address");
      return;
    }
    
    try {
      setIsLoading(true);
      // Use provider instead of signer for read-only operations if signer is not available
      const tokenContract = contractInteraction.getContract(contractAddress, signer || provider);
      setContract(tokenContract);
      
      // Load token info
      await loadTokenInfo(tokenContract);
    } catch (error) {
      console.error("Error initializing contract:", error);
      setWalletError("Error initializing contract: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load token information
  const loadTokenInfo = async (tokenContract) => {
    if (!tokenContract) return;
    
    try {
      setIsLoading(true);
      
      // Get decimals first since we need it to format other values
      const decimals = await contractInteraction.readFunctions.getDecimals(tokenContract);
      
      // Check if wallet address is available before querying balance
      let balance = ethers.BigNumber.from(0);
      if (walletAddress && walletAddress !== '') {
        balance = await contractInteraction.readFunctions.getBalanceOf(tokenContract, walletAddress);
      }
      
      const [name, symbol, totalSupply, isPaused, isWhitelistEnabled] = await Promise.all([
        contractInteraction.readFunctions.getName(tokenContract),
        contractInteraction.readFunctions.getSymbol(tokenContract),
        contractInteraction.readFunctions.getTotalSupply(tokenContract),
        contractInteraction.readFunctions.isPaused(tokenContract).catch(() => false),
        contractInteraction.readFunctions.isWhitelistEnabled(tokenContract).catch(() => false)
      ]);
      
      // Check if connected wallet is the owner
      let isOwner = false;
      try {
        console.log('walletAddress',walletAddress)
        if (walletAddress ) {
          const owner = await tokenContract.owner();
          console.log('owner',owner)
          isOwner = owner.toLowerCase() === walletAddress.toLowerCase();
        }
      } catch (error) {
        console.log("Could not determine owner status:", error);
      }
      
      setTokenInfo({
        name,
        symbol,
        decimals: decimals.toString(),
        totalSupply: ethers.utils.formatUnits(totalSupply, decimals),
        balance: ethers.utils.formatUnits(balance, decimals),
        isOwner,
        isPaused,
        isWhitelistEnabled
      });
    } catch (error) {
      console.error("Error loading token info:", error);
      setWalletError("Error loading token info: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Transfer tokens
  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!contract || !transferTo || !transferAmount) return;

    try {
      setIsLoading(true);
      
      // Validate recipient address
      if (!ethers.utils.isAddress(transferTo)) {
        toast.error("Invalid recipient address format");
        return;
      }
      
      // Validate amount
      if (parseFloat(transferAmount) <= 0) {
        toast.error("Amount must be greater than 0");
        return;
      }
      
      // Get decimals from token info
      const decimals = parseInt(tokenInfo.decimals);
      
      // Parse amount with correct decimals
      const amount = ethers.utils.parseUnits(transferAmount, decimals);
      
      // Check if user has enough balance
      const currentBalance = ethers.utils.parseUnits(tokenInfo.balance, decimals);
      if (currentBalance.lt(amount)) {
        toast.error(`Insufficient balance. You have ${tokenInfo.balance} ${tokenInfo.symbol}`);
        console.log('Isss')
        return;
      }
      
      // Check if the contract is paused
      if (tokenInfo.isPaused) {
        toast.error("Token transfers are currently paused");
        return;
      }
      
      // Show pending toast
      const pendingToast = toast.loading(`Initiating transfer of ${transferAmount} ${tokenInfo.symbol} to ${transferTo.substring(0, 6)}...${transferTo.substring(transferTo.length - 4)}`);
      
      try {
        // Execute transfer
        const receipt = await contractInteraction.writeFunctions.transfer(contract, transferTo, amount);
        
        // Refresh balance after transfer
        const newBalance = await contractInteraction.readFunctions.getBalanceOf(contract, walletAddress);
        
        setTokenInfo({
          ...tokenInfo,
          balance: ethers.utils.formatUnits(newBalance, decimals)
        });
        
        setTransferTo('');
        setTransferAmount('');
        
        // Update toast to success
        toast.update(pendingToast, { 
          render: `Successfully transferred ${transferAmount} ${tokenInfo.symbol}`, 
          type: "success", 
          isLoading: false,
          autoClose: 5000
        });
      } catch (error) {
        console.error("Transfer error:", error);
        
        // Extract the most useful error message
        let errorMessage = "Unknown error occurred";
        
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.data && error.data.message) {
          errorMessage = error.data.message;
        } else if (error.reason) {
          errorMessage = error.reason;
        }
        
        // Clean up common MetaMask error messages
        if (errorMessage.includes("user rejected transaction")) {
          errorMessage = "Transaction was rejected in your wallet";
        } else if (errorMessage.includes("insufficient funds")) {
          errorMessage = "Insufficient ETH for gas fees";
        } else if (errorMessage.includes("CALL_EXCEPTION")) {
          errorMessage = "Transaction failed. The contract may have restrictions on transfers.";
        }
        
        // Update toast to error
        toast.update(pendingToast, { 
          render: `Transfer failed: ${errorMessage}`, 
          type: "error", 
          isLoading: false,
          autoClose: 5000
        });
      }
    } catch (error) {
      toast.error(`Error preparing transfer: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Add to blacklist
  const handleAddBlacklist = async (e) => {
    e.preventDefault();
    if (!contract || !blacklistAddress || !tokenInfo.isOwner) return;
    
    try {
      setIsLoading(true);
      
      // Validate address
      if (!ethers.utils.isAddress(blacklistAddress)) {
        toast.error("Invalid address format");
        return;
      }
      
      // Show pending toast
      const pendingToast = toast.loading(`Adding ${blacklistAddress.substring(0, 6)}...${blacklistAddress.substring(blacklistAddress.length - 4)} to blacklist`);
      
      try {
        await contractInteraction.writeFunctions.addBlackList(contract, blacklistAddress);
        setBlacklistAddress('');
        
        // Update toast to success
        toast.update(pendingToast, { 
          render: `Address added to blacklist successfully`, 
          type: "success", 
          isLoading: false,
          autoClose: 5000
        });
      } catch (error) {
        console.error("Blacklist error:", error);
        
        // Extract error message
        let errorMessage = error.message || "Unknown error occurred";
        
        // Update toast to error
        toast.update(pendingToast, { 
          render: `Failed to add to blacklist: ${errorMessage}`, 
          type: "error", 
          isLoading: false,
          autoClose: 5000
        });
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove from blacklist
  const handleRemoveBlacklist = async (e) => {
    e.preventDefault();
    if (!contract || !blacklistAddress || !tokenInfo.isOwner) return;
    
    try {
      setIsLoading(true);
      
      // Validate address
      if (!ethers.utils.isAddress(blacklistAddress)) {
        toast.error("Invalid address format");
        return;
      }
      
      // Show pending toast
      const pendingToast = toast.loading(`Removing ${blacklistAddress.substring(0, 6)}...${blacklistAddress.substring(blacklistAddress.length - 4)} from blacklist`);
      
      try {
        await contractInteraction.writeFunctions.removeBlackList(contract, blacklistAddress);
        setBlacklistAddress('');
        
        // Update toast to success
        toast.update(pendingToast, { 
          render: `Address removed from blacklist successfully`, 
          type: "success", 
          isLoading: false,
          autoClose: 5000
        });
      } catch (error) {
        console.error("Remove from blacklist error:", error);
        
        // Extract error message
        let errorMessage = error.message || "Unknown error occurred";
        
        // Update toast to error
        toast.update(pendingToast, { 
          render: `Failed to remove from blacklist: ${errorMessage}`, 
          type: "error", 
          isLoading: false,
          autoClose: 5000
        });
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Add to whitelist
  const handleAddWhitelist = async (e) => {
    e.preventDefault();
    if (!contract || !whitelistAddress || !tokenInfo.isOwner) return;
    
    try {
      setIsLoading(true);
      
      // Validate address
      if (!ethers.utils.isAddress(whitelistAddress)) {
        toast.error("Invalid address format");
        return;
      }
      
      // Show pending toast
      const pendingToast = toast.loading(`Adding ${whitelistAddress.substring(0, 6)}...${whitelistAddress.substring(whitelistAddress.length - 4)} to whitelist`);
      
      try {
        await contractInteraction.writeFunctions.addWhiteList(contract, whitelistAddress);
        setWhitelistAddress('');
        
        // Update toast to success
        toast.update(pendingToast, { 
          render: `Address added to whitelist successfully`, 
          type: "success", 
          isLoading: false,
          autoClose: 5000
        });
      } catch (error) {
        console.error("Whitelist error:", error);
        
        // Extract error message
        let errorMessage = error.message || "Unknown error occurred";
        
        // Update toast to error
        toast.update(pendingToast, { 
          render: `Failed to add to whitelist: ${errorMessage}`, 
          type: "error", 
          isLoading: false,
          autoClose: 5000
        });
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove from whitelist
  const handleRemoveWhitelist = async (e) => {
    e.preventDefault();
    if (!contract || !whitelistAddress || !tokenInfo.isOwner) return;
    
    try {
      setIsLoading(true);
      
      // Validate address
      if (!ethers.utils.isAddress(whitelistAddress)) {
        toast.error("Invalid address format");
        return;
      }
      
      // Show pending toast
      const pendingToast = toast.loading(`Removing ${whitelistAddress.substring(0, 6)}...${whitelistAddress.substring(whitelistAddress.length - 4)} from whitelist`);
      
      try {
        await contractInteraction.writeFunctions.removeWhiteList(contract, whitelistAddress);
        setWhitelistAddress('');
        
        // Update toast to success
        toast.update(pendingToast, { 
          render: `Address removed from whitelist successfully`, 
          type: "success", 
          isLoading: false,
          autoClose: 5000
        });
      } catch (error) {
        console.error("Remove from whitelist error:", error);
        
        // Extract error message
        let errorMessage = error.message || "Unknown error occurred";
        
        // Update toast to error
        toast.update(pendingToast, { 
          render: `Failed to remove from whitelist: ${errorMessage}`, 
          type: "error", 
          isLoading: false,
          autoClose: 5000
        });
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle pause state
  const togglePause = async () => {
    if (!contract || !tokenInfo.isOwner) return;
    
    try {
      setIsLoading(true);
      
      const action = tokenInfo.isPaused ? "Unpausing" : "Pausing";
      const pendingToast = toast.loading(`${action} token transfers...`);
      
      try {
        if (tokenInfo.isPaused) {
          await contractInteraction.writeFunctions.unpause(contract);
        } else {
          await contractInteraction.writeFunctions.pause(contract);
        }
        
        // Update pause status
        const isPaused = await contractInteraction.readFunctions.isPaused(contract);
        setTokenInfo({
          ...tokenInfo,
          isPaused
        });
        
        // Update toast to success
        toast.update(pendingToast, { 
          render: `Token transfers ${isPaused ? 'paused' : 'unpaused'} successfully`, 
          type: "success", 
          isLoading: false,
          autoClose: 5000
        });
      } catch (error) {
        console.error("Pause toggle error:", error);
        
        // Extract error message
        let errorMessage = error.message || "Unknown error occurred";
        
        // Update toast to error
        toast.update(pendingToast, { 
          render: `Failed to ${tokenInfo.isPaused ? 'unpause' : 'pause'} transfers: ${errorMessage}`, 
          type: "error", 
          isLoading: false,
          autoClose: 5000
        });
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle whitelist state
  const toggleWhitelist = async () => {
    if (!contract || !tokenInfo.isOwner) return;
    
    try {
      setIsLoading(true);
      
      const action = tokenInfo.isWhitelistEnabled ? "Disabling" : "Enabling";
      const pendingToast = toast.loading(`${action} whitelist...`);
      
      try {
        if (tokenInfo.isWhitelistEnabled) {
          await contractInteraction.writeFunctions.disableWhiteList(contract);
        } else {
          await contractInteraction.writeFunctions.enableWhiteList(contract);
        }
        
        // Update whitelist status
        const isWhitelistEnabled = await contractInteraction.readFunctions.isWhitelistEnabled(contract);
        setTokenInfo({
          ...tokenInfo,
          isWhitelistEnabled
        });
        
        // Update toast to success
        toast.update(pendingToast, { 
          render: `Whitelist ${isWhitelistEnabled ? 'enabled' : 'disabled'} successfully`, 
          type: "success", 
          isLoading: false,
          autoClose: 5000
        });
      } catch (error) {
        console.error("Whitelist toggle error:", error);
        
        // Extract error message
        let errorMessage = error.message || "Unknown error occurred";
        
        // Update toast to error
        toast.update(pendingToast, { 
          render: `Failed to ${tokenInfo.isWhitelistEnabled ? 'disable' : 'enable'} whitelist: ${errorMessage}`, 
          type: "error", 
          isLoading: false,
          autoClose: 5000
        });
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Transfer ownership
  const handleTransferOwnership = async (e) => {
    e.preventDefault();
    if (!contract || !newOwnerAddress || !tokenInfo.isOwner) return;
    
    try {
      setIsLoading(true);
      
      // Validate address
      if (!ethers.utils.isAddress(newOwnerAddress)) {
        toast.error("Invalid address format");
        return;
      }
      
      // Confirm with user
      if (!window.confirm(`Are you sure you want to transfer ownership to ${newOwnerAddress}? This action cannot be undone!`)) {
        toast.info("Ownership transfer cancelled");
        return;
      }
      
      // Show pending toast
      const pendingToast = toast.loading(`Transferring ownership to ${newOwnerAddress.substring(0, 6)}...${newOwnerAddress.substring(newOwnerAddress.length - 4)}`);
      
      try {
        await contractInteraction.writeFunctions.transferOwnership(contract, newOwnerAddress);
        setNewOwnerAddress('');
        
        // Update owner status
        setTokenInfo({
          ...tokenInfo,
          isOwner: false // No longer the owner
        });
        
        // Update toast to success
        toast.update(pendingToast, { 
          render: `Ownership transferred successfully`, 
          type: "success", 
          isLoading: false,
          autoClose: 5000
        });
      } catch (error) {
        console.error("Transfer ownership error:", error);
        
        // Extract error message
        let errorMessage = error.message || "Unknown error occurred";
        
        // Update toast to error
        toast.update(pendingToast, { 
          render: `Failed to transfer ownership: ${errorMessage}`, 
          type: "error", 
          isLoading: false,
          autoClose: 5000
        });
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Mint tokens
  const handleMint = async (e) => {
    e.preventDefault();
    if (!contract || !mintAddress || !mintAmount || !tokenInfo.isOwner) return;
    
    try {
      setIsLoading(true);
      
      // Validate address
      if (!ethers.utils.isAddress(mintAddress)) {
        toast.error("Invalid recipient address format");
        return;
      }
      
      // Validate amount
      if (parseFloat(mintAmount) <= 0) {
        toast.error("Amount must be greater than 0");
        return;
      }
      
      // Show pending toast
      const pendingToast = toast.loading(`Minting ${mintAmount} ${tokenInfo.symbol} to ${mintAddress.substring(0, 6)}...${mintAddress.substring(mintAddress.length - 4)}`);
      
      try {
        const amount = ethers.utils.parseUnits(mintAmount, tokenInfo.decimals);
        await contractInteraction.writeFunctions.mint(contract, mintAddress, amount);
        
        // Refresh total supply after minting
        const totalSupply = await contractInteraction.readFunctions.getTotalSupply(contract);
        
        // Refresh balance if minting to self
        let newBalance = null;
        if (mintAddress.toLowerCase() === walletAddress.toLowerCase()) {
          newBalance = await contractInteraction.readFunctions.getBalanceOf(contract, walletAddress);
        }
        
        setTokenInfo({
          ...tokenInfo,
          totalSupply: ethers.utils.formatUnits(totalSupply, tokenInfo.decimals),
          ...(newBalance ? { balance: ethers.utils.formatUnits(newBalance, tokenInfo.decimals) } : {})
        });
        
        setMintAddress('');
        setMintAmount('');
        
        // Update toast to success
        toast.update(pendingToast, { 
          render: `Successfully minted ${mintAmount} ${tokenInfo.symbol}`, 
          type: "success", 
          isLoading: false,
          autoClose: 5000
        });
      } catch (error) {
        console.error("Mint error:", error);
        
        // Extract error message
        let errorMessage = error.message || "Unknown error occurred";
        
        // Update toast to error
        toast.update(pendingToast, { 
          render: `Failed to mint tokens: ${errorMessage}`, 
          type: "error", 
          isLoading: false,
          autoClose: 5000
        });
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Burn tokens
  const handleBurn = async (e) => {
    e.preventDefault();
    if (!contract || !burnAmount || !tokenInfo.isOwner) return;
    
    try {
      setIsLoading(true);
      
      // Validate amount
      if (parseFloat(burnAmount) <= 0) {
        toast.error("Amount must be greater than 0");
        return;
      }
      
      // Parse amount with correct decimals
      const amount = ethers.utils.parseUnits(burnAmount, tokenInfo.decimals);
      
      // Check if user has enough balance
      const currentBalance = ethers.utils.parseUnits(tokenInfo.balance, tokenInfo.decimals);
      if (currentBalance.lt(amount)) {
        toast.error(`Insufficient balance. You have ${tokenInfo.balance} ${tokenInfo.symbol}`);
        return;
      }
      
      // Show pending toast
      const pendingToast = toast.loading(`Burning ${burnAmount} ${tokenInfo.symbol}`);
      
      try {
        await contractInteraction.writeFunctions.burn(contract, amount);
        
        // Refresh total supply and balance after burning
        const [totalSupply, balance] = await Promise.all([
          contractInteraction.readFunctions.getTotalSupply(contract),
          contractInteraction.readFunctions.getBalanceOf(contract, walletAddress)
        ]);
        
        setTokenInfo({
          ...tokenInfo,
          totalSupply: ethers.utils.formatUnits(totalSupply, tokenInfo.decimals),
          balance: ethers.utils.formatUnits(balance, tokenInfo.decimals)
        });
        
        setBurnAmount('');
        
        // Update toast to success
        toast.update(pendingToast, { 
          render: `Successfully burned ${burnAmount} ${tokenInfo.symbol}`, 
          type: "success", 
          isLoading: false,
          autoClose: 5000
        });
      } catch (error) {
        console.error("Burn error:", error);
        
        // Extract error message
        let errorMessage = error.message || "Unknown error occurred";
        
        // Update toast to error
        toast.update(pendingToast, { 
          render: `Failed to burn tokens: ${errorMessage}`, 
          type: "error", 
          isLoading: false,
          autoClose: 5000
        });
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function to switch to Sepolia
  const switchToSepolia = async () => {
    if (!provider) return;
    
    try {
      setIsLoading(true);
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia chainId in hex
      });
      
      // Refresh the page after switching
      window.location.reload();
    } catch (error) {
      // This error code indicates that the chain has not been added to MetaMask
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0xaa36a7',
                chainName: 'Sepolia Testnet',
                nativeCurrency: {
                  name: 'Sepolia ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });
          
          // Try switching again
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
          });
          
          // Refresh the page after switching
          window.location.reload();
        } catch (addError) {
          toast.error(`Failed to add Sepolia network: ${addError.message}`);
        }
      } else {
        toast.error(`Failed to switch network: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Add this useEffect to check the network when provider changes
  useEffect(() => {
    const checkNetwork = async () => {
      if (provider) {
        try {
          const network = await provider.getNetwork();
          setCurrentChainId(network.chainId);
          
          // Check if we're on Sepolia (chainId 11155111)
          const targetChainId = blockchainConfig['Ethereum']['sepolia'].chainId;
          setIsCorrectNetwork(network.chainId === targetChainId);
        } catch (error) {
          console.error("Error checking network:", error);
          setIsCorrectNetwork(false);
        }
      }
    };
    
    checkNetwork();
  }, [provider]);

  // Render content based on selected menu
  const renderContent = () => {
    if (!walletAddress && !contract) {
      return (
        <div className="space-y-4">
          <p className="text-gray-500 mb-4">Please connect your wallet to view token information.</p>
          
          <div className="bg-gray-50 p-4 rounded">
            <h4 className="font-medium text-gray-700 mb-2">Blockchain Settings</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Blockchain Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Blockchain
                </label>
                <select 
                  className="w-full border p-2 rounded"
                  value={selectedBlockchain}
                  onChange={handleBlockchainChange}
                >
                  {availableBlockchains.map(blockchain => (
                    <option key={blockchain} value={blockchain}>
                      {blockchain}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Network Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Network
                </label>
                <select 
                  className="w-full border p-2 rounded"
                  value={selectedNetwork}
                  onChange={handleNetworkChange}
                >
                  {availableNetworks.map(network => (
                    <option key={network} value={network}>
                      {blockchainConfig[selectedBlockchain][network]?.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Token Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Token
              </label>
              <select 
                className="w-full border p-2 rounded"
                value={selectedToken}
                onChange={handleTokenChange}
                disabled={Object.keys(availableTokens).length === 0}
              >
                <option value="">-- Select a token --</option>
                {Object.keys(availableTokens).map(token => (
                  <option key={token} value={token}>
                    {token} ({availableTokens[token].substring(0, 6)}...{availableTokens[token].substring(availableTokens[token].length - 4)})
                  </option>
                ))}
              </select>
            </div>
            
            {/* Custom Contract Address */}
   
          </div>
        </div>
      );
    }

    // if () {
    //   return (
    //     <div className="mt-4">
    //       <p className="mb-2">Initialize Contract:</p>
    //       <div className="flex flex-col sm:flex-row gap-2">
    //         <input
    //           type="text"
    //           value={contractAddress}
    //           onChange={(e) => setContractAddress(e.target.value)}
    //           placeholder="0x..."
    //           className="border p-2 rounded flex-grow"
    //           disabled={selectedToken !== ''}
    //         />
    //         <button
    //           onClick={initializeContract}
    //           disabled={!contractAddress || isLoading}
    //           className="bg-blue-800 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400"
    //         >
    //           {isLoading ? 'Loading...' : 'Load Contract'}
    //         </button>
    //       </div>
    //     </div>
    //   );
    // }

    switch (selectedMenu) {
      case 'Token Info':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-700">Name</h4>
                <p className="text-lg">{tokenInfo?.name}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-700">Symbol</h4>
                <p className="text-lg">{tokenInfo.symbol}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-700">Decimals</h4>
                <p className="text-lg">{tokenInfo.decimals}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-700">Total Supply</h4>
                <p className="text-lg">{tokenInfo.totalSupply} {tokenInfo.symbol}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-700">Your Balance</h4>
                <p className="text-lg">{tokenInfo.balance} {tokenInfo.symbol}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-700">Contract Address</h4>
                <p className="text-sm break-all">{contractAddress}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-700">Owner Status</h4>
                <p className="text-lg">{tokenInfo.isOwner ? 'You are the owner' : 'You are not the owner'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-700">Contract Status</h4>
                <p className="text-lg">
                  {tokenInfo.isPaused ? 'Paused' : 'Active'} / 
                  Whitelist {tokenInfo.isWhitelistEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
          </div>
        );
      case 'Transfers':
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-medium text-gray-700">Transfer Tokens</h4>
              <form onSubmit={handleTransfer} className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    placeholder="Recipient Address"
                    className="border p-2 rounded flex-grow"
                  />
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="Amount"
                    className="border p-2 rounded flex-grow"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!transferTo || !transferAmount || isLoading}
                  className="bg-blue-800 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {isLoading ? 'Transferring...' : 'Transfer'}
                </button>
              </form>
            </div>
            
            {tokenInfo.isOwner && (
              <>
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium text-gray-700">Mint Tokens</h4>
                  <form onSubmit={handleMint} className="space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={mintAddress}
                        onChange={(e) => setMintAddress(e.target.value)}
                        placeholder="Recipient Address"
                        className="border p-2 rounded flex-grow"
                      />
                      <input
                        type="number"
                        value={mintAmount}
                        onChange={(e) => setMintAmount(e.target.value)}
                        placeholder="Amount"
                        className="border p-2 rounded flex-grow"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!mintAddress || !mintAmount || isLoading}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-green-400"
                    >
                      {isLoading ? 'Minting...' : 'Mint'}
                    </button>
                  </form>
                </div>
                
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium text-gray-700">Burn Tokens</h4>
                  <form onSubmit={handleBurn} className="space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="number"
                        value={burnAmount}
                        onChange={(e) => setBurnAmount(e.target.value)}
                        placeholder="Amount"
                        className="border p-2 rounded flex-grow"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!burnAmount || isLoading}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-red-400"
                    >
                      {isLoading ? 'Burning...' : 'Burn'}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        );
      case 'Access Control':
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Manage whitelist and blacklist for your token on {selectedBlockchain}</h3>
              
              {tokenInfo.isOwner ? (
                <>
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-700 mb-2">Whitelist Management</h4>
                    <div className="flex items-center mb-4">
                      <div className="mr-2 p-2 bg-blue-100 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm">
                        Whitelist status: <span className="font-medium">{tokenInfo.isWhitelistEnabled ? 'Enabled' : 'Disabled'}</span>
                      </span>
                    </div>
                    
                    <button
                      onClick={toggleWhitelist}
                      disabled={isLoading}
                      className="mb-4 bg-blue-800 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400"
                    >
                      {isLoading ? 'Processing...' : tokenInfo.isWhitelistEnabled ? 'Disable Whitelist' : 'Enable Whitelist'}
                    </button>
                    
                    <form onSubmit={handleAddWhitelist} className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address to Whitelist
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={whitelistAddress}
                          onChange={(e) => setWhitelistAddress(e.target.value)}
                          placeholder="Enter ethereum address..."
                          className="border p-2 rounded flex-grow"
                        />
                        <button
                          type="submit"
                          disabled={!whitelistAddress || isLoading}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-green-400"
                        >
                          {isLoading ? 'Adding...' : 'Add to Whitelist'}
                        </button>
                      </div>
                    </form>
                    
                    <form onSubmit={handleRemoveWhitelist}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Remove from Whitelist
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={whitelistAddress}
                          onChange={(e) => setWhitelistAddress(e.target.value)}
                          placeholder="Enter ethereum address..."
                          className="border p-2 rounded flex-grow"
                        />
                        <button
                          type="submit"
                          disabled={!whitelistAddress || isLoading}
                          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-red-400"
                        >
                          {isLoading ? 'Removing...' : 'Remove from Whitelist'}
                        </button>
                      </div>
                    </form>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Blacklist Management</h4>
                    <form onSubmit={handleAddBlacklist} className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address to Blacklist
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={blacklistAddress}
                          onChange={(e) => setBlacklistAddress(e.target.value)}
                          placeholder="Enter ethereum address..."
                          className="border p-2 rounded flex-grow"
                        />
                        <button
                          type="submit"
                          disabled={!blacklistAddress || isLoading}
                          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-red-400"
                        >
                          {isLoading ? 'Blacklisting...' : 'Add to Blacklist'}
                        </button>
                      </div>
                    </form>
                    
                    <form onSubmit={handleRemoveBlacklist}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Remove from Blacklist
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={blacklistAddress}
                          onChange={(e) => setBlacklistAddress(e.target.value)}
                          placeholder="Enter ethereum address..."
                          className="border p-2 rounded flex-grow"
                        />
                        <button
                          type="submit"
                          disabled={!blacklistAddress || isLoading}
                          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-red-400"
                        >
                          {isLoading ? 'Removing...' : 'Remove from Blacklist'}
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              ) : (
                <p className="text-yellow-600">You need to be the contract owner to manage whitelist and blacklist.</p>
              )}
            </div>
          </div>
        );
      case 'Security':
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Security Controls</h3>
              <p className="text-gray-600 mb-4">Manage security settings for your token on {selectedBlockchain}</p>
              
              {tokenInfo.isOwner ? (
                <>
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-700 mb-2">Emergency Controls</h4>
                    <p className="text-sm text-gray-600 mb-4">These controls allow you to pause and unpause all token transfers in case of emergency.</p>
                    
                    <div className="flex flex-col sm:flex-row gap-2 mb-6">
                      {tokenInfo.isPaused ? (
                        <button
                          onClick={togglePause}
                          disabled={isLoading}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-green-400"
                        >
                          {isLoading ? 'Processing...' : 'Unpause Transfers'}
                        </button>
                      ) : (
                        <button
                          onClick={togglePause}
                          disabled={isLoading}
                          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-red-400"
                        >
                          {isLoading ? 'Processing...' : 'Pause All Transfers'}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-700 mb-2">Whitelist/Blacklist</h4>
                    <form onSubmit={handleAddWhitelist} className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address to Whitelist
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={whitelistAddress}
                          onChange={(e) => setWhitelistAddress(e.target.value)}
                          placeholder="Enter ethereum address..."
                          className="border p-2 rounded flex-grow"
                        />
                        <button
                          type="submit"
                          disabled={!whitelistAddress || isLoading}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-green-400"
                        >
                          {isLoading ? 'Adding...' : 'Add to Whitelist'}
                        </button>
                      </div>
                    </form>
                    
                    <form onSubmit={handleAddBlacklist} className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address to Blacklist
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={blacklistAddress}
                          onChange={(e) => setBlacklistAddress(e.target.value)}
                          placeholder="Enter ethereum address..."
                          className="border p-2 rounded flex-grow"
                        />
                        <button
                          type="submit"
                          disabled={!blacklistAddress || isLoading}
                          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-red-400"
                        >
                          {isLoading ? 'Blacklisting...' : 'Add to Blacklist'}
                        </button>
                      </div>
                    </form>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Security Recommendations</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                      <li>Always verify addresses before performing token operations</li>
                      <li>Use multi-signature wallets for enhanced security</li>
                      <li>Regularly audit your token contract for vulnerabilities</li>
                      <li>Keep your private keys secure and never share them</li>
                      <li>Consider implementing time locks for critical functions</li>
                    </ul>
                  </div>
                </>
              ) : (
                <p className="text-yellow-600">You need to be the contract owner to access security controls.</p>
              )}
            </div>
          </div>
        );
      case 'Settings':
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Settings</h3>
              <p className="text-gray-600 mb-4">Configure settings for your token on {selectedBlockchain}</p>
              
              {tokenInfo.isOwner ? (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Ownership Management</h4>
                  <p className="text-sm text-gray-600 mb-4">Transfer ownership of your token contract to another address.</p>
                  
                  <form onSubmit={handleTransferOwnership} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Owner Address
                      </label>
                      <input
                        type="text"
                        value={newOwnerAddress}
                        onChange={(e) => setNewOwnerAddress(e.target.value)}
                        placeholder="Enter ethereum address..."
                        className="w-full border p-2 rounded"
                      />
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                      <p className="text-sm text-yellow-700">
                        <strong>Warning:</strong> Transferring ownership is irreversible. Make sure you enter the correct address.
                      </p>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={!newOwnerAddress || isLoading}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-red-400"
                    >
                      {isLoading ? 'Transferring...' : 'Transfer Ownership'}
                    </button>
                  </form>
                </div>
              ) : (
                <p className="text-yellow-600">You need to be the contract owner to access settings.</p>
              )}
            </div>
          </div>
        );
      default:
        return (
          <p className="text-gray-500">This section is reserved for future features.</p>
        );
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      {/* Toast Container */}
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden bg-blue-900 p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Token Admin</h1>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-white p-2"
        >
          {sidebarOpen ? 'Close' : 'Menu'}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-full md:w-64 bg-blue-900 text-white flex flex-col p-4`}>
        <h1 className="hidden md:block text-2xl font-bold mb-6">Token Admin</h1>
        <div className="flex flex-col space-y-2">
          {menuItems.map((item) => (
            <button
              key={item}
              className={`text-left p-2 rounded ${selectedMenu === item ? 'bg-blue-700' : 'hover:bg-blue-800'}`}
              onClick={() => {
                setSelectedMenu(item);
                setSidebarOpen(false);
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white shadow">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 sm:mb-0">
            <span className="text-sm text-gray-600">
              {selectedBlockchain} / {blockchainConfig[selectedBlockchain][selectedNetwork]?.name}
            </span>
            {selectedToken && (
              <span className="text-sm text-gray-600">
                 {selectedToken}
              </span>
            )}
          </div>
          
          {walletAddress ? (
            <>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm text-gray-600">
                {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
              </span>
              <button 
                onClick={disconnectWallet}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Disconnect
              </button>
              <button 
                onClick={initializeContract}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Refresh
              </button>
            </div>
       
            </>
          ) : (
            <div className="flex flex-col w-full sm:w-auto">
              <button 
                onClick={connectWalletHandler}
                disabled={isConnecting || (!selectedBlockchain || (!selectedToken && !contractAddress))}
                className="bg-blue-800 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400"
              >
                {isConnecting ? 'Connecting...' : `Connect ${blockchainWallets[selectedBlockchain] || 'Wallet'}`}
              </button>
              {walletError && <p className="text-red-500 text-sm mt-1">{walletError}</p>}
              {!selectedBlockchain && <p className="text-yellow-500 text-sm mt-1">Please select a blockchain</p>}
              {selectedBlockchain && !selectedToken && !contractAddress && 
                <p className="text-yellow-500 text-sm mt-1">Please select a token or enter a contract address</p>
              }
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-4 md:p-6 overflow-auto">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">Token Admin</h2>
          
          {/* Network Warning Banner */}
          {walletAddress && !isCorrectNetwork && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="mb-2 md:mb-0">
                  <p className="font-bold">Wrong Network Detected</p>
                  <p className="text-sm">
                    Please switch to Sepolia Testnet to interact with the token contracts.
                    Current network: {currentChainId ? `Chain ID: ${currentChainId}` : 'Unknown'}
                  </p>
                </div>
                <button
                  onClick={switchToSepolia}
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                  {isLoading ? 'Switching...' : 'Switch to Sepolia'}
                </button>
              </div>
            </div>
          )}
          
          <h3 className="text-lg md:text-xl font-medium mb-2">{selectedMenu}</h3>
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
