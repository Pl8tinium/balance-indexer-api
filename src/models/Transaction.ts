import { TransactionTransfer } from './TransactionOperation';

export interface Transaction {
  id: string;
  fees?: number;
  confirmed: boolean;
  blockHeight: number;
  timestamp: Date;
  inputs: Array<TransactionTransfer>;
  outputs: Array<TransactionTransfer>;
  additionalData?: any;
}
