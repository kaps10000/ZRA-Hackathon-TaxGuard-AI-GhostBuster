import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const blockchainApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Block {
  index: number;
  timestamp: string;
  data: any;
  previousHash: string;
  hash: string;
  nonce?: number;
}

export interface BlockchainData {
  chain: Block[];
  length: number;
  latestBlock: Block;
  isValid: boolean;
  totalEvents: number;
}

export const getBlockchain = async (): Promise<BlockchainData> => {
  const response = await blockchainApi.get('/blockchain');
  return response.data.blockchain;
};

export const getBlock = async (index: number): Promise<Block> => {
  const response = await blockchainApi.get(`/blockchain/block/${index}`);
  return response.data.block;
};

export const validateChain = async (): Promise<boolean> => {
  const response = await blockchainApi.get('/blockchain/validate');
  return response.data.isValid;
};

export const getBlockchainStats = async () => {
  const response = await blockchainApi.get('/blockchain/stats');
  return response.data.stats;
};

export default blockchainApi;
