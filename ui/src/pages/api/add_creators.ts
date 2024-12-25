import mysql from "mysql2/promise";
import { NextApiRequest, NextApiResponse } from "next";
import { dbConfig } from "./db_config";

// POST /api/add_creators
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const connection = await mysql.createConnection(dbConfig);
      await connection.beginTransaction();
      const { ic } = req.body;
      await connection.execute(
        `
      INSERT INTO creators (ic)
      VALUES (?, ?)
      `,
        [ic]
      );

      await connection.commit();
    } catch (error) {
      console.error("Error creating creator:", error);
      res.status(500).json({ error: "Error creating creator" });
    }
  }
}
