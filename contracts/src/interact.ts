import {
  IdentityCommitment,
  Post,
  MinaPatron,
  offchainState,
  Field,
  PrivateKey,
  UInt64,
  Mina,
  AccountUpdate,
} from './minapatrons.js';

const Local = await Mina.LocalBlockchain({ proofsEnabled: true });
Mina.setActiveInstance(Local);

let tx;
let [deployer, creator, customer] = Local.testAccounts;

const zkAppPrivateKey = PrivateKey.random();
const zkAppAddress = zkAppPrivateKey.toPublicKey();
let minapatron_contract = new MinaPatron(zkAppAddress);
minapatron_contract.offchainState.setContractInstance(minapatron_contract);

if (Local.proofsEnabled) {
  console.time('compile program');
  await offchainState.compile();
  minapatron_contract.offchainState.setContractClass(MinaPatron);
  console.timeEnd('compile program');
  console.time('compile contract');
  await MinaPatron.compile();
  console.timeEnd('compile contract');
}

console.time('deploy');
tx = await Mina.transaction(deployer, async () => {
  AccountUpdate.fundNewAccount(deployer);
  await minapatron_contract.deploy();
})
  .prove()
  .sign([deployer.key, zkAppPrivateKey])
  .send();
console.log(tx.toPretty());
console.timeEnd('deploy');

console.time('create content');
const pkCreator = creator.key;
const creatorNullifier = Field.random();
const creatorIC = IdentityCommitment.createCommitment(
  pkCreator,
  creatorNullifier
);
const examplePostId = Field.random();
const examplePrice = UInt64.from(100);
let new_post = new Post({
  identityCommitment: creatorIC,
  price: examplePrice,
});
await Mina.transaction(creator, () =>
  minapatron_contract.createContent(examplePostId, new_post)
)
  .sign([creator.key])
  .prove()
  .send();
console.timeEnd('create content');

console.time('settlement proof 1');
let proof = await minapatron_contract.offchainState.createSettlementProof();
console.timeEnd('settlement proof 1');

console.time('settle 1');
await Mina.transaction(deployer, () => minapatron_contract.settle(proof))
  .sign([deployer.key])
  .prove()
  .send();
console.log(tx.toPretty());
console.timeEnd('settle 1');

console.time('buy content');
await Mina.transaction({ sender: customer, fee: examplePrice }, () =>
  minapatron_contract.buyContent(examplePostId)
)
  .sign([customer.key])
  .prove()
  .send();
console.timeEnd('buy content');

console.time('settlement proof 2');
proof = await minapatron_contract.offchainState.createSettlementProof();
console.timeEnd('settlement proof 2');

console.time('settle 2');
await Mina.transaction(deployer, () => minapatron_contract.settle(proof))
  .sign([deployer.key])
  .prove()
  .send();
console.log(tx.toPretty());
console.timeEnd('settle 2');

console.time('withdraw revenue');
await Mina.transaction(creator, () =>
  minapatron_contract.withdrawRevenue(pkCreator, creatorNullifier, zkAppAddress)
)
  .sign([creator.key])
  .prove()
  .send();
console.timeEnd('withdraw revenue');

console.time('settlement proof 3');
proof = await minapatron_contract.offchainState.createSettlementProof();
console.timeEnd('settlement proof 3');

console.time('settle 3');
await Mina.transaction(deployer, () => minapatron_contract.settle(proof))
  .sign([deployer.key])
  .prove()
  .send();
console.log(tx.toPretty());
console.timeEnd('settle 3');
