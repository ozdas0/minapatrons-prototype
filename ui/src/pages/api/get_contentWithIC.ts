import mysql from "mysql2/promise";
import { NextApiRequest, NextApiResponse } from "next";
import { dbConfig } from "./db_config";

// GET /api/get_contentWithIC
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const connection = await mysql.createConnection(dbConfig);
      const contentIc = req.query.ic;
      const content = await connection.execute(
        `SELECT 
        c.id AS content_id, 
        c.contentName, 
        c.contentData, 
        c.timestamp AS content_created 
     FROM 
        contents c 
     JOIN 
        identity_commitment ic ON c.id = ic.content_id 
     WHERE 
        ic.ic = ?`,
        [contentIc]
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
