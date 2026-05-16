import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'path'
import dotenv from 'dotenv'
import publicRoutes from './routes/public'
import adminRoutes  from './routes/admin'
import uploadRoutes from './routes/upload'

dotenv.config()

const app  = express()

app.set('trust proxy', 1)

const PORT = process.env.PORT || 3001

// ── Security ─────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow images/PDFs from frontend
}))
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Serve uploaded files statically ──────────────────────
// Accessible at: /uploads/images/<filename>  and  /uploads/pdfs/<filename>
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// ── Rate limiting ─────────────────────────────────────────
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }))
app.use('/api/admin/login', rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { error: 'Demasiados intentos. Espera 15 minutos.' }
}))

// ── Routes ────────────────────────────────────────────────
app.use('/api',          publicRoutes)
app.use('/api/admin',    adminRoutes)
app.use('/api/upload',   uploadRoutes)

// ── Health ────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

// ── 404 ───────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }))

// ── Error handler ─────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Error interno del servidor' })
})

app.listen(PORT, () => {
  console.log(`✅ Backend en http://localhost:${PORT}`)
})
console.log("DB_HOST =", process.env.DB_HOST)
console.log("DB_PORT =", process.env.DB_PORT)
export default app
