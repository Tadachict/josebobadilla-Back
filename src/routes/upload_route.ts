import express, { Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { authMiddleware } from '../middleware/auth'

const router = express.Router()

// ── Ensure upload dirs exist ─────────────────────────────
const UPLOAD_DIR = path.join(process.cwd(), 'uploads')
const IMG_DIR    = path.join(UPLOAD_DIR, 'images')
const PDF_DIR    = path.join(UPLOAD_DIR, 'pdfs')
;[UPLOAD_DIR, IMG_DIR, PDF_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }) })

// ── Storage: images ──────────────────────────────────────
const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, IMG_DIR),
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase()
    const name = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`
    cb(null, name)
  },
})
const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) cb(null, true)
    else cb(new Error('Solo se permiten imágenes (jpg, png, gif, webp)'))
  },
})

// ── Storage: PDFs ────────────────────────────────────────
const pdfStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PDF_DIR),
  filename: (_req, file, cb) => {
    const name = `${Date.now()}-${Math.round(Math.random() * 1e6)}.pdf`
    cb(null, name)
  },
})
const pdfUpload = multer({
  storage: pdfStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf')
      cb(null, true)
    else cb(new Error('Solo se permiten archivos PDF'))
  },
})

// ── POST /api/upload/image ───────────────────────────────
router.post('/image', authMiddleware, (req: Request, res: Response): void => {
  imageUpload.single('file')(req, res, (err) => {
    if (err) { res.status(400).json({ error: err.message }); return }
    if (!req.file) { res.status(400).json({ error: 'No se recibió ningún archivo' }); return }
    const url = `/uploads/images/${req.file.filename}`
    res.json({ url, filename: req.file.filename, size: req.file.size })
  })
})

// ── POST /api/upload/pdf ─────────────────────────────────
router.post('/pdf', authMiddleware, (req: Request, res: Response): void => {
  pdfUpload.single('file')(req, res, (err) => {
    if (err) { res.status(400).json({ error: err.message }); return }
    if (!req.file) { res.status(400).json({ error: 'No se recibió ningún archivo' }); return }
    const url = `/uploads/pdfs/${req.file.filename}`
    res.json({ url, filename: req.file.filename, size: req.file.size })
  })
})

// ── DELETE /api/upload/image/:filename ───────────────────
router.delete('/image/:filename', authMiddleware, (req: Request, res: Response): void => {
  const filePath = path.join(IMG_DIR, req.params.filename)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  res.json({ ok: true })
})

// ── DELETE /api/upload/pdf/:filename ─────────────────────
router.delete('/pdf/:filename', authMiddleware, (req: Request, res: Response): void => {
  const filePath = path.join(PDF_DIR, req.params.filename)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  res.json({ ok: true })
})

export default router