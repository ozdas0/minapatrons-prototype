import { fetchAccount, Mina, PublicKey, Field, PrivateKey, UInt64 } from "o1js";

import * as Comlink from "comlink";
import { MinaPatron } from "../../contracts/build/src/minapatrons";

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

const state = {
  MinaPatronInstance: null as null | typeof MinaPatron,
  zkappInstance: null as null | MinaPatron,
  transaction: null as null | Transaction,
  offchainState: null as null | any,
};

export const api: any = {
  async setActiveInstanceToDevnet() {
    const { Mina } = await import("../../contracts/build/src/minapatrons");
    const Network = Mina.Network(
      "https://api.minascan.io/node/devnet/v1/graphql"
    );
    console.log("Devnet network instance configured");
    Mina.setActiveInstance(Network);
  },
  async loadContract() {
    const { MinaPatron } = await import(
      "../../contracts/build/src/minapatrons.js"
    );
    state.MinaPatronInstance = MinaPatron;
  },
  async compileContract() {
    await state.MinaPatronInstance!.compile();
    await state.offchainState!.compile();
  },
  async fetchAccount(publicKey58: string) {
    const publicKey = PublicKey.fromBase58(publicKey58);
    return fetchAccount({ publicKey });
  },

  async fetchPrice(postId: string) {
    const post = await state.offchainState!.posts(Field(postId));
    return { price: post.price.toString() };
  },

  async createIdentityCommitment(privateKey: string, nullifier: string) {
    const { IdentityCommitment } = await import(
      "../../contracts/build/src/minapatrons"
    );
    const identityCommitment = IdentityCommitment.createCommitment(
      PrivateKey.fromBase58(privateKey),
      Field(nullifier)
    );
    return identityCommitment.commitment.toString();
  },

  async initZkappInstance(publicKey58: string) {
    const { MinaPatron } = await import(
      "../../contracts/build/src/minapatrons"
    );
    const publicKey = PublicKey.fromBase58(publicKey58);
    state.zkappInstance = new MinaPatron(publicKey);
    state.offchainState = state.zkappInstance.offchainState;
  },
  async createBuyTransaction(
    postId: string,
    price: string,
    senderPublicKey: string
  ) {
    const sender = PublicKey.fromBase58(senderPublicKey);
    state.transaction = await Mina.transaction(
      { sender: sender, fee: price },
      async () => {
        await state.zkappInstance!.buyContent(Field(postId));
      }
    );
  },
  async createCreateContentTransaction(
    postId: string,
    price: string,
    privateKey: string,
    nullifier: string
  ) {
    const { IdentityCommitment, Post } = await import(
      "../../contracts/build/src/minapatrons"
    );
    // create IdentityCommitment from ic, create Post from price and IdentiyCommitment.
    const identityCommitment = IdentityCommitment.createCommitment(
      PrivateKey.fromBase58(privateKey),
      Field(nullifier)
    );

    const money = UInt64.from(price);
    const newPost = Post.createPost(identityCommitment, money);

    state.transaction = await Mina.transaction(async () => {
      await state.zkappInstance!.createContent(Field(postId), newPost);
    });
  },
  async createWithdrawTransaction(
    privateKey: string,
    nullifier: string,
    receiver: string
  ) {
    state.transaction = await Mina.transaction(async () => {
      await state.zkappInstance!.withdrawRevenue(
        PrivateKey.fromBase58(privateKey),
        Field(nullifier),
        PublicKey.fromBase58(receiver)
      );
    });
  },

  async proveUpdateTransaction() {
    await state.transaction!.prove();
  },
  async getTransactionJSON() {
    return state.transaction!.toJSON();
  },
};

if (typeof window !== "undefined") {
  Comlink.expose(api);
}
