import mysql from "mysql2/promise";
import { NextApiRequest, NextApiResponse } from "next";
import { dbConfig } from "./db_config";

// GET /api/get_contents
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const connection = await mysql.createConnection(dbConfig);
      const contents = await connection.execute("SELECT * FROM contents");
      res.send(contents);
    } catch (error) {
      console.error("Error getting contents:", error);
      res.status(500).json({ error: "Error getting contents" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
