import { ethers } from 'ethers';
import { Alert } from 'react-native';
import { ColorGeneratedEvent, config } from '../config/blockchain';

// Import ABI files
const ColorFlipABI = require('../app/abi/ColorFlip.json').abi;
const EntropyABI = require('../app/abi/IEntropyV2.json');

export class BlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private coinFlipContract: ethers.Contract | null = null;
  private entropyContract: ethers.Contract | null = null;

  constructor() {
    this.initializeContracts();
  }

  private initializeContracts() {
    try {
      if (!config.RPC_URL || !config.PRIVATE_KEY || !config.COINFLIP_ADDRESS || !config.ENTROPY_ADDRESS) {
        console.warn("Missing blockchain configuration");
        return;
      }

      this.provider = new ethers.JsonRpcProvider(config.RPC_URL);
      this.wallet = new ethers.Wallet(config.PRIVATE_KEY, this.provider);
      
      this.coinFlipContract = new ethers.Contract(
        config.COINFLIP_ADDRESS,
        ColorFlipABI,
        this.wallet
      );

      this.entropyContract = new ethers.Contract(
        config.ENTROPY_ADDRESS,
        EntropyABI,
        this.wallet
      );

      console.log("Blockchain contracts initialized successfully");
    } catch (error) {
      console.error("Failed to initialize blockchain contracts:", error);
    }
  }

  async generateRandomColor(): Promise<string | null> {
    if (!this.coinFlipContract || !this.entropyContract || !this.wallet) {
      Alert.alert("Error", "Blockchain contracts not initialized");
      return null;
    }

    try {
      // Get fee for entropy request
      const fee = await this.entropyContract.getFeeV2();
      console.log(`Entropy fee: ${fee.toString()}`);

      // Make the request to generate random color
      const txResponse = await this.coinFlipContract.request({
        value: fee,
      });
      console.log(`Color generation request tx: ${txResponse.hash}`);

      // Wait for transaction to be mined
      const receipt = await txResponse.wait();
      if (!receipt) throw new Error("Transaction receipt is null");

      // Parse the FlipRequested event from the receipt
      const flipEvent = receipt.logs
        .map((log: ethers.Log) => {
          try {
            return this.coinFlipContract!.interface.parseLog(log as any);
          } catch {
            return null;
          }
        })
        .find((e: ethers.LogDescription | null) => e?.name === "FlipRequested");

      if (!flipEvent) throw new Error("FlipRequested event not found in receipt");

      const sequenceNumber: number = Number(flipEvent.args.sequenceNumber);
      console.log(`Sequence number: ${sequenceNumber}`);

      // Listen for the ColorGenerated event
      const filter = this.coinFlipContract.filters.ColorGenerated(null);
      
      const colorEvent = await new Promise<ColorGeneratedEvent>((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.coinFlipContract!.off(filter, listener);
          reject(new Error("Timeout waiting for ColorGenerated event"));
        }, 120000); // 2 minute timeout

        const listener = (...args: any[]) => {
          const event = args[args.length - 1];
          const seq: number = Number(event.args?.sequenceNumber);
          const hexColor: string = event.args?.hexColor;
          
          if (seq === sequenceNumber) {
            clearTimeout(timeout);
            this.coinFlipContract!.off(filter, listener);
            resolve({
              args: { sequenceNumber: seq, hexColor },
              blockNumber: event.blockNumber,
              transactionHash: event.transactionHash,
            });
          }
        };

        this.coinFlipContract!.on(filter, listener);
      });

      console.log(`Generated color from blockchain: ${colorEvent.args.hexColor}`);
      return colorEvent.args.hexColor;

    } catch (error) {
      console.error("Error generating random color:", error);
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to generate random color");
      return null;
    }
  }

  // Utility method to check if contracts are ready
  isReady(): boolean {
    return !!(this.coinFlipContract && this.entropyContract && this.wallet);
  }

  // Get wallet address
  getWalletAddress(): string | null {
    return this.wallet?.address || null;
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();
