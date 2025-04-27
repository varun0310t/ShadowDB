import { Request, Response } from "express";
import { BackupService, BackupType } from "../lib/backupManager";

const backupService = new BackupService();

export const CreateBackup = async (req: Request, res: Response) => {
  try {
    const { databaseId, userId } = req.body;

    if (!databaseId) {
      res.status(400).json({ error: "Database ID is required" });
      return;
    }

    const backupId = await backupService.createBackup(
      databaseId,
      BackupType.MANUAL,
      userId
    );

    res.status(201).json({
      id: backupId,
      message: "Backup started successfully",
    });
    return;
  } catch (error: any) {
    console.error(`Backup creation error: ${error.message}`);
    res.status(500).json({ error: error.message });
    return;
  }
};

export const ListBackups = async (req: Request, res: Response) => {
  try {
    const databaseId = parseInt(req.params.databaseId);
    const limit = parseInt((req.query.limit as string) || "50");
    const offset = parseInt((req.query.offset as string) || "0");

    if (isNaN(databaseId)) {
      return res.status(400).json({ error: "Valid database ID is required" });
    }

    const backups = await backupService.listBackups(databaseId, limit, offset);

    return res.status(200).json(backups);
  } catch (error: any) {
    console.error(`List backups error: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
};

export const GetBackup = async (req: Request, res: Response) => {
  try {
    const backupId = parseInt(req.params.backupId);

    if (isNaN(backupId)) {
      return res.status(400).json({ error: "Valid backup ID is required" });
    }

    const backup = await backupService.getBackup(backupId);

    return res.status(200).json(backup);
  } catch (error: any) {
    console.error(`Get backup error: ${error.message}`);

    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }

    return res.status(500).json({ error: error.message });
  }
};
