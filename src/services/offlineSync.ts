import { OfflineQueueTransaction } from '../types';
import { encryptPayloadAES, computeSHA256, generateDigitalSignToken } from './crypto';

const STORAGE_KEY = 'pranagrid_offline_queue_v1';

export class OfflineSyncService {
  private static getQueue(): OfflineQueueTransaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('LocalStorage access error:', e);
      return [];
    }
  }

  private static saveQueue(queue: OfflineQueueTransaction[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  // Get all pending transactions
  public static getPendingTransactions(): OfflineQueueTransaction[] {
    return this.getQueue();
  }

  // Clear all transactions (for testing/reset)
  public static clearQueue(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('LocalStorage clear error:', e);
    }
  }

  // Record a transaction while offline (or online)
  public static async recordTransaction(
    phcId: string,
    phcName: string,
    actionType: OfflineQueueTransaction['actionType'],
    payload: object,
    details: string,
    officerRole: string = 'Medical Officer'
  ): Promise<OfflineQueueTransaction> {
    const timestamp = new Date().toISOString();
    
    // 1. Encrypt payload with AES-GCM 256
    const { cipherTextBase64, ivBase64 } = await encryptPayloadAES(payload);

    // 2. Generate SHA-256 hash of payload
    const sha256Hash = await computeSHA256(JSON.stringify(payload));

    // 3. Generate simulated digital signature
    const { signature } = await generateDigitalSignToken(officerRole, phcId, details);

    const transaction: OfflineQueueTransaction = {
      id: `TX-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      phcId,
      phcName,
      actionType,
      details,
      recordedOfflineAt: timestamp,
      aesIvBase64: ivBase64,
      cipherTextBase64,
      sha256Hash,
      digitalSignature: signature,
      status: 'QUEUED_LOCAL',
    };

    const currentQueue = this.getQueue();
    currentQueue.unshift(transaction);
    this.saveQueue(currentQueue);

    return transaction;
  }

  // Reconcile and synchronize all pending offline transactions with national grid
  public static async reconcileTransactions(
    onProgress?: (reconciledCount: number, total: number) => void
  ): Promise<{ reconciled: number; failed: number }> {
    const queue = this.getQueue();
    if (queue.length === 0) return { reconciled: 0, failed: 0 };

    let reconciled = 0;
    const total = queue.length;

    for (let i = 0; i < queue.length; i++) {
      // Simulate cryptographic verification and server ingest delay
      await new Promise(resolve => setTimeout(resolve, 350));
      queue[i].status = 'RECONCILED';
      reconciled++;
      if (onProgress) {
        onProgress(reconciled, total);
      }
    }

    // Filter out reconciled items or keep with verified state
    this.saveQueue([]);
    return { reconciled, failed: 0 };
  }
}
