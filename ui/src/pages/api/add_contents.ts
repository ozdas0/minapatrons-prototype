import mysql from "mysql2/promise";
import { NextApiRequest, NextApiResponse } from "next";
import { dbConfig } from "./db_config";
import { generateUniqueId } from "./utils";

const {
Mina,
PublicKey,
Field,
UInt64,
PrivateKey,
MinaPatron,
offchainState,
} = await import("../../../../contracts/build/src/minapatrons.js");
const Network = Mina.Network("https://api.minascan.io/node/devnet/v1/graphql");
console.log("Devnet network instance configured");
Mina.setActiveInstance(Network);

console.time("compile program");
await offchainState.compile();
minapatron_contract.offchainState.setContractClass(MinaPatron);
console.timeEnd("compile program");
console.time("compile contract");
await MinaPatron.compile();
console.timeEnd("compile contract");

// POST /api/add_contents
export default async function handler(
req: NextApiRequest,
res: NextApiResponse
) {
if (req.method === "POST") {
try {
const connection = await mysql.createConnection(dbConfig);
await connection.beginTransaction();
const { contentName, contentData, pk, nullifier, price } = req.body;
  const id = generateUniqueId();
  const nullifierField = Field(nullifier)
  const idField = Field(id)
  const ic = IdentityCommitment.createCommitment(pk, nullifierField )
  const priceUInt64 = new UInt64(price)
  const newPost = new Post.createPost(ic, priceUInt64)
  const newContent = await Minapatrons.createContent(idField)
await connection.execute(
`
INSERT INTO contents (id, contentName, contentData)
VALUES (?, ?, ?)
`,
[id, contentName, contentData]
);
const [updateResult]: any = await connection.execute(
`UPDATE identity_commitment
SET content_id = ?
WHERE ic = ?`,
[id, ic]
);

res.send("Content added successfully");
if (updateResult.affectedRows === 0) {
await connection.rollback();
return res.status(404).json({ error: "Identity commitment not found" });
}

await connection.commit();
} catch (error) {
console.error("Error creating content:", error);
res.status(500).json({ error: "Error creating content" });
}
}
}
