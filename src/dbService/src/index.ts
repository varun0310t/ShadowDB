import express from "express";
import databaseRoutes from "./routes/DatabaseRoute";
import databaseBackupRoutes from "./routes/DataBaseBackupRoute";
import { config } from "dotenv";

// Load environment variables
config();

const app = express();
const port = 6000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.send("Database Service API is running");
});

// Mount database routes
app.use("/api/databases", databaseRoutes);
app.use("/api/backup", databaseBackupRoutes);
// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
  }
);

// Start server
app.listen(port, () => {
  console.log(`Database service listening on port ${port}`);
});
