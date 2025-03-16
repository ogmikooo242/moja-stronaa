import express from "express";
import ytSearch from "yt-search";
import youtubedl from "youtube-dl-exec";
import fs from "fs";
const fs = require("fs");

const router = express.Router();
const path = "data.iq65";

const getMusicData = (videoId: string) => {
  if (!fs.existsSync(path)) return null;
  const data = JSON.parse(fs.readFileSync(path, "utf8"));
  return data[videoId] || null;
};

const saveMusicData = (videoId: string, dataObj: any) => {
  let stored = {};
  if (fs.existsSync(path)) stored = JSON.parse(fs.readFileSync(path, "utf8"));
  stored[videoId] = dataObj;
  fs.writeFileSync(path, JSON.stringify(stored));
};

router.post("/convert", async (req, res) => {
  const { link } = req.body;

  if (!link) {
    return res.status(400).json({ error: "Link is required" });
  }

  const videoId = link.split("v=")[1];

  if (fs.existsSync(`src/converted/${videoId}.mp3`)) {
    const data = getMusicData(videoId);

    if (!data) {
      return res.status(404).json({ error: "Data not found" });
    }

    return res.json(data);
  }

  try {
    const video = await ytSearch({ videoId });

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    try {
      youtubedl(link, {
        extractAudio: true,
        audioFormat: "mp3",
        output: `src/converted/${videoId}.mp3`,
        env: { PYTHON: "/usr/bin/python3.9" },
      })
        .then(() => {
          res.json({
            imageURL: video.thumbnail,
            title: video.title,
            channel: video.author.name,
            link: `https://api.sincerpg.pl/converted/${videoId}`,
            videoId: videoId,
          });
          console.log(`File ${videoId}.mp3 has been converted`);

          saveMusicData(videoId, {
            imageURL: video.thumbnail,
            title: video.title,
            channel: video.author.name,
            link: `https://api.sincerpg.pl/converted/${videoId}`,
            videoId: videoId,
          });
        })
        .catch((s) => {
          console.log(`s: ${s}`);
          return res.status(500).json({ error: "Failed to convert" });
        });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ error: "An error occurred while converting the video" });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: "An error occurred while converting the video" });
  }
});

router.get("/converted/:videoId", async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    return res.status(400).json({ error: "Video ID is required" });
  }

  const data = getMusicData(videoId);

  if (!data) {
    return res.status(404).json({ error: "Data not found" });
  }

  res.json(data);
});

export default router;
