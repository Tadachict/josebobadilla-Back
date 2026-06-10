import express, { Request, Response } from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import { authMiddleware } from '../middleware/auth'

const router = express.Router()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
})

// ── Storage: imágenes ────────────────────────────────────
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'jose-bobadilla/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  } as any,
})

// ── Storage: PDFs ────────────────────────────────────────
const pdfStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'jose-bobadilla/pdfs',
    resource_type: 'raw',
    allowed_formats: ['pdf'],
  } as any,
})

const imageUpload = multer({ storage: imageStorage, limits: { fileSize: 8 * 1024 * 1024 } })
const pdfUpload   = multer({ storage: pdfStorage,   limits: { fileSize: 50 * 1024 * 1024 } })

// ── POST /api/upload/image ───────────────────────────────
router.post('/image', authMiddleware, (req: Request, res: Response): void => {
  imageUpload.single('file')(req, res, (err) => {
    if (err) { res.status(400).json({ error: err.message }); return }
    if (!req.file) { res.status(400).json({ error: 'No se recibió ningún archivo' }); return }
    const url = (req.file as any).path  // URL completa de Cloudinary
    res.json({ url, filename: req.file.filename, size: req.file.size })
  })
})

// ── POST /api/upload/pdf ─────────────────────────────────
router.post('/pdf', authMiddleware, (req: Request, res: Response): void => {
  pdfUpload.single('file')(req, res, (err) => {
    if (err) { res.status(400).json({ error: err.message }); return }
    if (!req.file) { res.status(400).json({ error: 'No se recibió ningún archivo' }); return }
    const url = (req.file as any).path
    res.json({ url, filename: req.file.filename, size: req.file.size })
  })
})

// ── DELETE /api/upload/image/:publicId ───────────────────
router.delete('/image/:publicId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(`jose-bobadilla/images/${req.params.publicId}`)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'No se pudo eliminar' })
  }
})

// ── DELETE /api/upload/pdf/:publicId ─────────────────────
router.delete('/pdf/:publicId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(`jose-bobadilla/pdfs/${req.params.publicId}`, { resource_type: 'raw' })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'No se pudo eliminar' })
  }
})

export default router