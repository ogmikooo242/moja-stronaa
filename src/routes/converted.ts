import express from "express";
import fs from "fs";

const router = express.Router();

router.get("/:filename", (req, res) => {
  const { filename } = req.params;

  if (!filename) {
    return res.status(400).json({ error: "Filename is required" });
  }

  if (fs.existsSync(`src//converted/${filename}.mp3`)) {
    return res.download(`src//converted/${filename}.mp3`);
  }

  return res.status(404).json({ error: "File not found" });
});

export default router;
