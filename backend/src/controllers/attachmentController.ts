import { Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../services/activityService';

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

export async function uploadAttachment(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { taskId } = req.body;
    const file = req.file;

    if (!taskId || !file) {
      return res.status(400).json({ error: 'taskId and file are required' });
    }

    const fileUrl = `/uploads/${file.filename}`;

    const attachment = await prisma.attachment.create({
      data: {
        taskId,
        name: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        url: fileUrl,
        uploaderId: req.user.id,
      },
      include: {
        uploader: { select: { id: true, name: true, email: true } },
      },
    });

    await logActivity({
      taskId,
      userId: req.user.id,
      action: `Uploaded attachment: "${file.originalname}"`,
    });

    return res.status(201).json(attachment);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to upload file', details: error.message });
  }
}

export async function deleteAttachment(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const att = await prisma.attachment.findUnique({ where: { id } });
    if (!att) return res.status(404).json({ error: 'Attachment not found' });

    // Remove local file if exists
    const filename = path.basename(att.url);
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.attachment.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to delete attachment' });
  }
}
