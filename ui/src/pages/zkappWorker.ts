import {
  MinaPatron,
  Mina,
  IdentityCommitment,
  Post,
} from "../../../contracts/build/src/minapatrons.js";

import { fetchAccount } from "o1js";

import * as Comlink from "comlink";

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

const state = {
  MinaPatron: null as null | typeof MinaPatron,
  zkappInstance: null as null | MinaPatron,
  transaction: null as null | Transaction,
  offchainState: null as null | any,
  IdentityCommitment: null as null | typeof IdentityCommitment,
  Post: null as null | typeof Post,
};

export const api: any = {
  async setActiveInstanceToDevnet() {
    const { Mina } = await import("../../../contracts/src/minapatrons");
    const Network = Mina.Network(
      "https://api.minascan.io/node/devnet/v1/graphql"
    );
    console.log("Devnet network instance configured");
    Mina.setActiveInstance(Network);
  },
  async loadContract() {
    const { MinaPatron } = await import("../../../contracts/src/minapatrons");
    const { IdentityCommitment } = await import(
      "../../../contracts/src/minapatrons"
    );
    const { Post } = await import("../../../contracts/src/minapatrons");
    state.MinaPatron = MinaPatron;
    state.IdentityCommitment = IdentityCommitment;
    state.Post = Post;
  },
  async compileContract() {
    await state.MinaPatron!.compile();
    await state.offchainState!.compile();
  },
  async fetchAccount(publicKey58: string) {
    const { PublicKey } = await import("../../../contracts/src/minapatrons");
    const publicKey = PublicKey.fromBase58(publicKey58);
    return fetchAccount({ publicKey });
  },

  async fetchPrice(postId: string) {
    const { Field } = await import("../../../contracts/src/minapatrons");
    const post = await state.offchainState!.posts(Field(postId));
    return { price: post.price.toString() };
  },

  async createIdentityCommitment(privateKey: string, nullifier: string) {
    const { Field, PrivateKey, IdentityCommitment } = await import(
      "../../../contracts/src/minapatrons"
    );
    const identityCommitment = IdentityCommitment.createCommitment(
      PrivateKey.fromBase58(privateKey),
      Field(nullifier)
    );
    return identityCommitment.commitment.toString();
  },

  async initZkappInstance(publicKey58: string) {
    const { PublicKey } = await import("../../../contracts/src/minapatrons");
    const publicKey = PublicKey.fromBase58(publicKey58);
    state.zkappInstance = new state.MinaPatron!(publicKey);
  },
  async createBuyTransaction(
    postId: string,
    price: string,
    senderPublicKey: string
  ) {
    const { Mina, PublicKey, Field } = await import(
      "../../../contracts/src/minapatrons"
    );
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
    const { Mina, Field, UInt64, PrivateKey, IdentityCommitment, Post } =
      await import("../../../contracts/src/minapatrons");
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
    const { Mina, PublicKey, Field, PrivateKey } = await import(
      "../../../contracts/src/minapatrons"
    );
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

Comlink.expose(api);
