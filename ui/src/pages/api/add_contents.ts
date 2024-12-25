import mysql from "mysql2/promise";
import { NextApiRequest, NextApiResponse } from "next";
import { dbConfig } from "./db_config";
import { generateUniqueId } from "./utils";

// POST /api/add_contents
export default async function handler(
req: NextApiRequest,
res: NextApiResponse
) {
if (req.method === "POST") {
try {
const connection = await mysql.createConnection(dbConfig);
await connection.beginTransaction();
const { contentName, contentData, ic } = req.body;
const id = generateUniqueId();
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
