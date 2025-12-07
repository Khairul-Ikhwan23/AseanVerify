#!/usr/bin/env node
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

dotenv.config();

const fileArg = process.argv[2];
if (!fileArg) {
  console.error("Usage: node scripts/run-sql-file.js <path-to-sql>");
  process.exit(1);
}

const sqlPath = path.resolve(process.cwd(), fileArg);
if (!fs.existsSync(sqlPath)) {
  console.error("SQL file not found:", sqlPath);
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set in environment");
  process.exit(1);
}

const run = async () => {
  try {
    const sqlClient = neon(DATABASE_URL);
    const sqlText = fs.readFileSync(sqlPath, "utf8");
    // Split on semicolons that end statements
    const statements = sqlText
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(Boolean);
    for (const stmt of statements) {
      await sqlClient(stmt);
    }
    console.log("Executed SQL file:", sqlPath);
  } catch (err) {
    console.error("Failed executing SQL:", err.message);
    process.exit(1);
  }
};

run();



