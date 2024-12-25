import {
  SmartContract,
  state,
  method,
  PrivateKey,
  Experimental,
  PublicKey,
  UInt64,
  Struct,
  Poseidon,
  Mina,
  Bool,
  AccountUpdate,
  Field,
} from 'o1js';

export {
  IdentityCommitment,
  Post,
  MinaPatron,
  offchainState,
  Buyer,
  Field,
  Struct,
  Bool,
  PrivateKey,
  Mina,
  UInt64,
  Poseidon,
  AccountUpdate,
  PublicKey,
};

class IdentityCommitment extends Struct({
  commitment: Field,
}) {
  static createCommitment(
    privatekey: PrivateKey,
    nullifier: Field
  ): IdentityCommitment {
    const pkHigh = privatekey.s.high254;
    const pkLow = privatekey.s.lowBit.toField();
    const commitment1 = Poseidon.hash([pkHigh, pkLow, nullifier]);
    return new IdentityCommitment({ commitment: commitment1 });
  }
  assertEquals(other: IdentityCommitment): void {
    this.commitment.assertEquals(other.commitment);
  }
}
class Post extends Struct({
  identityCommitment: IdentityCommitment,
  price: UInt64,
}) {
  static createPost(
    identityCommitment: IdentityCommitment,
    price: UInt64
  ): Post {
    return new Post({
      identityCommitment: identityCommitment,
      price: price,
    });
  }
}

class Buyer extends Struct({
  postId: Field,
  publicKey: PublicKey,
}) {
  static createBuyer(postId: Field, publicKey: PublicKey): Buyer {
    return new Buyer({
      postId: postId,
      publicKey: publicKey,
    });
  }
}

const { OffchainState, OffchainStateCommitments } = Experimental;

const offchainState: any = OffchainState(
  {
    posts: OffchainState.Map(Field, Post),
    revenues: OffchainState.Map(IdentityCommitment, UInt64),
    sold: OffchainState.Map(Buyer, Bool),
  },
  { logTotalCapacity: 10, maxActionsPerProof: 5 }
);

class StateProof extends offchainState.Proof {}

class MinaPatron extends SmartContract {
  @state(OffchainState.Commitments) offchainStateCommitments =
    offchainState.emptyCommitments();

  offchainState = offchainState.init(this);

  @method async settle(proof: StateProof) {
    await this.offchainState.settle(proof);
  }

  @method async createContent(postId: Field, post: Post) {
    const existingPost = await this.offchainState.fields.posts.get(postId);
    existingPost.isSome.assertFalse(); // assert a post with the given postId doesn't exists.
    this.offchainState.fields.posts.overwrite(postId, post);
  }

  @method async buyContent(postId: Field) {
    const post = (await this.offchainState.fields.posts.get(postId)).value;
    const buyer = Buyer.createBuyer(postId, this.sender.getUnconstrained());
    this.offchainState.fields.sold.overwrite(buyer, Bool(true));
    const payment_update = AccountUpdate.createSigned(
      this.sender.getAndRequireSignature()
    );
    payment_update.send({ to: this.address, amount: post.price });
  }

  @method async withdrawRevenue(
    privateKey: PrivateKey,
    nullifier: Field,
    receiver: PublicKey
  ) {
    const withdrawerIC = IdentityCommitment.createCommitment(
      privateKey,
      nullifier
    );
    const revenue = (await this.offchainState.fields.revenues.get(withdrawerIC))
      .value;
    this.offchainState.fields.revenues.overwrite(withdrawerIC, UInt64.zero);
    // subtract withdrawn amount
    const payment_update = AccountUpdate.createSigned(
      this.sender.getAndRequireSignature()
    );
    payment_update.send({ to: receiver, amount: revenue });
  }

  @method.returns(Bool) async isBought(postId: Field): Promise<Bool> {
    const buyer = Buyer.createBuyer(postId, this.sender.getUnconstrained());
    const bought = await this.offchainState.fields.sold.get(buyer);
    return bought.isSome;
  }
}
