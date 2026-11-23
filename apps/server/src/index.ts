import express from "express";
import { createResponse } from "@monorepo/utils";

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json(createResponse({ status: "ok", timestamp: Date.now() }));
});

app.get("/api/users", (_req, res) => {
  const users = [
    { id: "1", name: "Alice", email: "alice@example.com" },
    { id: "2", name: "Bob", email: "bob@example.com" },
  ];
  res.json(createResponse(users));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
