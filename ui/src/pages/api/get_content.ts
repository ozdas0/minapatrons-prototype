import mysql from "mysql2/promise";
import { NextApiRequest, NextApiResponse } from "next";
import { dbConfig } from "./db_config";

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
const zkAppPrivateKey = PrivateKey.random();
const zkAppAddress = zkAppPrivateKey.toPublicKey();
let minapatron_contract = new MinaPatron(zkAppAddress);
minapatron_contract.offchainState.setContractInstance(minapatron_contract);

console.time("compile program");
await offchainState.compile();
minapatron_contract.offchainState.setContractClass(MinaPatron);
console.timeEnd("compile program");
console.time("compile contract");
await MinaPatron.compile();
console.timeEnd("compile contract");
// GET /api/get_content
export default async function handler(
req: NextApiRequest,
res: NextApiResponse
) {
if (req.method === "GET") {
try {
const connection = await mysql.createConnection(dbConfig);
const contentId = req.query.id;

if (typeof contentId !== "string") {
return res.status(400).json({ error: "Invalid contentId" });
}

const contentIdField = Field(contentId);

const bought = await minapatron_contract.isBought(contentIdField);
if (!bought) {
return res.status(400).json({ error: "Content is not bought" });
}
const [content] = await connection.execute(
`SELECT * FROM contents WHERE id = ?`,
[contentId]
);
res.send(content);
} catch (error) {
console.error("Error getting content:", error);
res.status(500).json({ error: "Error getting content" });
}
} else {
res.setHeader("Allow", ["GET"]);
res.status(405).end(`Method ${req.method} Not Allowed`);
}
}
