import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'path'
import dotenv from 'dotenv'
import publicRoutes from './routes/public'
import adminRoutes from './routes/admin'
import uploadRoutes from './routes/upload'

import pool from './db/pool' // 👈 IMPORTANTE para test DB

dotenv.config()

const app = express()

app.set('trust proxy', 1)

const PORT = process.env.PORT || 3001

// ── SECURITY ─────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://joseantoniobobadilla.net'
  ],
  credentials: true,
}))

app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))

// ── STATIC FILES ─────────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// ── RATE LIMIT ───────────────────────────────────────────
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }))

app.use('/api/admin/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos. Espera 15 minutos.' }
}))

// ── ROUTES ───────────────────────────────────────────────
app.use('/api', publicRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/upload', uploadRoutes)

// ── HEALTH ───────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// ── DB TEST (🔥 CLAVE) ───────────────────────────────────
pool.getConnection()
  .then(conn => {
    console.log("🟢 MYSQL CONECTADO OK")
    conn.release()
  })
  .catch(err => {
    console.error("🔴 ERROR MYSQL CONEXIÓN:", err.message)
  })

// ── 404 ───────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

// ── ERROR HANDLER ────────────────────────────────────────
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("🔥 ERROR GLOBAL:", err)
  res.status(500).json({ error: 'Error interno del servidor' })
})

// ── START SERVER ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Backend en puerto ${PORT}`)
  console.log("DB_HOST =", process.env.DB_HOST)
  console.log("DB_PORT =", process.env.DB_PORT)
})

export default app