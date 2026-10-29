import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "auth-learn-api" });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`auth-learn-api listening on http://localhost:${port}`);
});
