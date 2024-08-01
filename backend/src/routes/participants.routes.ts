import express from "express";
import path from "path";

const router = express.Router();

// Обработка GET запроса для получения изображений
router.get("/:filename", (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(
    __dirname,
    "../../../client/src/participants",
    filename
  );
  res.sendFile(imagePath);
});

export default router;
