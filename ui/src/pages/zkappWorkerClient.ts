import * as Comlink from "comlink";

export default class ZkappWorkerClient {
  // ---------------------------------------------------------------------------------------
  worker: Worker;
  // Proxy to interact with the worker's methods as if they were local
  remoteApi: Comlink.Remote<typeof import("./zkappWorker.ts").api>;

  constructor() {
    // Initialize the worker from the zkappWorker module
    const worker = new Worker(new URL("./zkappWorker.ts", import.meta.url), {
      type: "module",
    });
    // Wrap the worker with Comlink to enable direct method invocation
    this.remoteApi = Comlink.wrap(worker);
  }

  async setActiveInstanceToDevnet() {
    return this.remoteApi.setActiveInstanceToDevnet();
  }

  async loadContract() {
    return this.remoteApi.loadContract();
  }

  async compileContract() {
    return this.remoteApi.compileContract();
  }

  async fetchAccount(publicKeyBase58: string) {
    return this.remoteApi.fetchAccount(publicKeyBase58);
  }

  async fetchPrice(postId: string) {
    return this.remoteApi.fetchPrice(postId);
  }

  async createIdentityCommitment(privateKey: string, nullifier: string) {
    return this.remoteApi.createIdentityCommitment(privateKey, nullifier);
  }

  async initZkappInstance(publicKeyBase58: string) {
    return this.remoteApi.initZkappInstance(publicKeyBase58);
  }

  async createBuyTransaction(
    postId: string,
    price: string,
    senderPublicKeyBase58: string
  ) {
    return this.remoteApi.createBuyTransaction(
      postId,
      price,
      senderPublicKeyBase58
    );
  }

  async createCreateContentTransaction(
    postId: string,
    price: string,
    privateKey: string,
    nullifier: string
  ) {
    return this.remoteApi.createCreateContentTransaction(
      postId,
      price,
      privateKey,
      nullifier
    );
  }

  async createWithdrawTransaction(
    privateKey: string,
    nullifier: string,
    receiver: string
  ) {
    return this.remoteApi.createWithdrawTransaction(
      privateKey,
      nullifier,
      receiver
    );
  }

  async proveUpdateTransaction() {
    return this.remoteApi.proveUpdateTransaction();
  }

  async getTransactionJSON() {
    return this.remoteApi.getTransactionJSON();
  }
}
