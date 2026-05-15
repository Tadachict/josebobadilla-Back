import { Router, Request, Response } from 'express'
import pool from '../db/pool'

const router = Router()

// GET /api/nav
router.get('/nav', async (_req, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query('SELECT * FROM nav_items WHERE is_active=1 ORDER BY order_index ASC') as any[]
    res.json(rows)
  } catch {
    res.json([
      { id:1, label:'Noticia Personal',          slug:'noticia-personal',        order_index:1, is_bold:true,  is_active:true },
      { id:2, label:'Obras',                     slug:'obras',                   order_index:2, is_bold:true,  is_active:true },
      { id:3, label:'Comentarios y entrevistas', slug:'comentarios-entrevistas', order_index:3, is_bold:true,  is_active:true },
      { id:4, label:'Curriculum',                slug:'curriculum',              order_index:4, is_bold:true,  is_active:true },
      { id:5, label:'Iconografía',               slug:'iconografia',             order_index:5, is_bold:true,  is_active:true },
      { id:6, label:'Libro de visitas',          slug:'libro-visitas',           order_index:6, is_bold:false, is_active:true },
      { id:7, label:'Bibliografía',              slug:'bibliografia',            order_index:7, is_bold:true,  is_active:true },
      { id:8, label:'Créditos',                  slug:'creditos',                order_index:8, is_bold:true,  is_active:true },
    ])
  }
})

// GET /api/pages/:slug
router.get('/pages/:slug', async (req, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query('SELECT * FROM pages WHERE slug=? LIMIT 1', [req.params.slug]) as any[]
    if (!rows.length) { res.status(404).json({ error: 'No encontrada' }); return }
    res.json(rows[0])
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error' }) }
})

// GET /api/works  — list
router.get('/works', async (_req, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query('SELECT * FROM works ORDER BY order_index ASC, year DESC') as any[]
    res.json(rows)
  } catch { res.json([]) }
})

// GET /api/works/:id  — single work (used by PdfViewer)
router.get('/works/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query('SELECT * FROM works WHERE id=? LIMIT 1', [req.params.id]) as any[]
    if (!rows.length) { res.status(404).json({ error: 'Obra no encontrada' }); return }
    res.json(rows[0])
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error' }) }
})

// GET /api/comments
router.get('/comments', async (_req, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query('SELECT * FROM comments WHERE is_published=1 ORDER BY created_at DESC') as any[]
    res.json(rows)
  } catch { res.json([]) }
})

// GET /api/iconografia
router.get('/iconografia', async (_req, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query('SELECT * FROM iconografia ORDER BY order_index ASC, id DESC') as any[]
    res.json(rows)
  } catch { res.json([]) }
})

// GET /api/curriculum
router.get('/curriculum', async (_req, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query('SELECT * FROM curriculum ORDER BY category ASC, order_index ASC') as any[]
    res.json(rows)
  } catch { res.json([]) }
})

// GET /api/bibliografia
router.get('/bibliografia', async (_req, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query('SELECT * FROM bibliografia ORDER BY order_index ASC, year DESC') as any[]
    res.json(rows)
  } catch { res.json([]) }
})

// GET /api/guestbook
router.get('/guestbook', async (_req, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query(
      'SELECT id,name,message,created_at FROM guestbook WHERE is_approved=1 ORDER BY created_at DESC'
    ) as any[]
    res.json(rows)
  } catch { res.json([]) }
})

// POST /api/guestbook
router.post('/guestbook', async (req: Request, res: Response): Promise<void> => {
  const { name, email, message } = req.body
  if (!name || !message) { res.status(400).json({ error: 'Nombre y mensaje requeridos' }); return }
  try {
    await pool.query('INSERT INTO guestbook (name,email,message,is_approved) VALUES (?,?,?,0)',
      [name, email || '', message])
    res.status(201).json({ message: 'Mensaje enviado, pendiente de aprobación.' })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error al guardar' }) }
})

export default router