import { Router } from "express";
import multer from "multer";
import db from "../config";

const router = Router();

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: "./src/upload/",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Upload Image API (Async/Await)
router.post("/upload", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const imgPath = `/upload/${req.file.filename}`;
  const { campaign_id } = req.body;

  try {
    const sql = "INSERT INTO campaign_images (img_location, campaign_id) VALUES (?, ?)";
    await db.execute(sql, [imgPath, campaign_id]);

    res.json({ message: "Image uploaded successfully", imgPath });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch Campaign Image API (Async/Await)
router.get("/:id", async (req, res) => {
    const { id } = req.params;
  
    try {
      const sql = "SELECT img_location FROM campaign_images WHERE campaign_id = ?";
      const [rows]: [any[], any] = await db.execute(sql, [id]); 
  
      res.json(rows.length > 0 ? rows[0] : { message: "No image found" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  

export default router;
