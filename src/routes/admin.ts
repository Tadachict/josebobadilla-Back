import { Router, Response } from 'express'
import pool from '../db/pool'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()

// ─────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────
router.post('/login', async (req, res: Response): Promise<void> => {
  const { username, password } = req.body
  if (!username || !password) { res.status(400).json({ error: 'Campos requeridos' }); return }
  try {
    const [rows] = await pool.query('SELECT * FROM admin_users WHERE username = ? LIMIT 1', [username]) as any[]
    if (!rows.length) { res.status(401).json({ error: 'Credenciales incorrectas' }); return }
    const user = rows[0]
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) { res.status(401).json({ error: 'Credenciales incorrectas' }); return }
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' })
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error en login' }) }
})

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const [rows] = await pool.query('SELECT id, username, email FROM admin_users WHERE id = ? LIMIT 1', [req.userId]) as any[]
  if (!rows.length) { res.status(404).json({ error: 'No encontrado' }); return }
  res.json(rows[0])
})

router.get('/stats', authMiddleware, async (_req, res: Response): Promise<void> => {
  try {
    const [[pages]]    = await pool.query('SELECT COUNT(*) as c FROM pages') as any
    const [[works]]    = await pool.query('SELECT COUNT(*) as c FROM works') as any
    const [[comments]] = await pool.query('SELECT COUNT(*) as c FROM comments') as any
    const [[guest]]    = await pool.query('SELECT COUNT(*) as c FROM guestbook') as any
    const [[icono]]    = await pool.query('SELECT COUNT(*) as c FROM iconografia') as any
    res.json({ pages: pages.c, works: works.c, comments: comments.c, guestbook: guest.c, iconografia: icono.c })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error' }) }
})

// ─────────────────────────────────────────────────────────
// PAGES
// ─────────────────────────────────────────────────────────
router.get('/pages', authMiddleware, async (_req, res: Response): Promise<void> => {
  const [rows] = await pool.query('SELECT * FROM pages ORDER BY updated_at DESC')
  res.json(rows)
})
router.post('/pages', authMiddleware, async (req, res: Response): Promise<void> => {
  const { slug, title, content, nav_item_id } = req.body
  try {
    const [r] = await pool.query('INSERT INTO pages (slug,title,content,nav_item_id) VALUES (?,?,?,?)',
      [slug, title, content || '', nav_item_id || null]) as any
    res.status(201).json({ id: r.insertId })
  } catch (e: any) { res.status(400).json({ error: e.message }) }
})
router.put('/pages/:id', authMiddleware, async (req, res: Response): Promise<void> => {
  const { slug, title, content, nav_item_id } = req.body
  await pool.query('UPDATE pages SET slug=?,title=?,content=?,nav_item_id=? WHERE id=?',
    [slug, title, content || '', nav_item_id || null, req.params.id])
  res.json({ ok: true })
})
router.delete('/pages/:id', authMiddleware, async (req, res: Response): Promise<void> => {
  await pool.query('DELETE FROM pages WHERE id=?', [req.params.id])
  res.json({ ok: true })
})

// ─────────────────────────────────────────────────────────
// WORKS
// ─────────────────────────────────────────────────────────
router.get('/works', authMiddleware, async (_req, res: Response): Promise<void> => {
  const [rows] = await pool.query('SELECT * FROM works ORDER BY order_index ASC, year DESC')
  res.json(rows)
})
router.post('/works', authMiddleware, async (req, res: Response): Promise<void> => {
  const { title, year, category, description, image_url, pdf_url, order_index } = req.body
  try {
    const [r] = await pool.query(
      'INSERT INTO works (title,year,category,description,image_url,pdf_url,order_index) VALUES (?,?,?,?,?,?,?)',
      [title, year || null, category || '', description || '', image_url || null, pdf_url || null, order_index || 0]
    ) as any
    res.status(201).json({ id: r.insertId })
  } catch (e: any) { res.status(400).json({ error: e.message }) }
})
router.put('/works/:id', authMiddleware, async (req, res: Response): Promise<void> => {
  const { title, year, category, description, image_url, pdf_url, order_index } = req.body
  await pool.query(
    'UPDATE works SET title=?,year=?,category=?,description=?,image_url=?,pdf_url=?,order_index=? WHERE id=?',
    [title, year || null, category || '', description || '', image_url || null, pdf_url || null, order_index || 0, req.params.id]
  )
  res.json({ ok: true })
})
router.delete('/works/:id', authMiddleware, async (req, res: Response): Promise<void> => {
  await pool.query('DELETE FROM works WHERE id=?', [req.params.id])
  res.json({ ok: true })
})

// ─────────────────────────────────────────────────────────
// ICONOGRAFÍA
// ─────────────────────────────────────────────────────────
router.get('/iconografia', authMiddleware, async (_req, res: Response): Promise<void> => {
  const [rows] = await pool.query('SELECT * FROM iconografia ORDER BY order_index ASC, id DESC')
  res.json(rows)
})
router.post('/iconografia', authMiddleware, async (req, res: Response): Promise<void> => {
  const { title, image_url, caption, year, order_index } = req.body
  try {
    const [r] = await pool.query(
      'INSERT INTO iconografia (title,image_url,caption,year,order_index) VALUES (?,?,?,?,?)',
      [title, image_url, caption || '', year || '', order_index || 0]
    ) as any
    res.status(201).json({ id: r.insertId })
  } catch (e: any) { res.status(400).json({ error: e.message }) }
})
router.put('/iconografia/:id', authMiddleware, async (req, res: Response): Promise<void> => {
  const { title, image_url, caption, year, order_index } = req.body
  await pool.query(
    'UPDATE iconografia SET title=?,image_url=?,caption=?,year=?,order_index=? WHERE id=?',
    [title, image_url, caption || '', year || '', order_index || 0, req.params.id]
  )
  res.json({ ok: true })
})
router.delete('/iconografia/:id', authMiddleware, async (req, res: Response): Promise<void> => {
  await pool.query('DELETE FROM iconografia WHERE id=?', [req.params.id])
  res.json({ ok: true })
})

// ─────────────────────────────────────────────────────────
// CURRICULUM
// ─────────────────────────────────────────────────────────
router.get('/curriculum', authMiddleware, async (_req, res: Response): Promise<void> => {
  const [rows] = await pool.query('SELECT * FROM curriculum ORDER BY category ASC, order_index ASC')
  res.json(rows)
})
router.post('/curriculum', authMiddleware, async (req, res: Response): Promise<void> => {
  const { period, description, institution, category, order_index } = req.body
  const [r] = await pool.query(
    'INSERT INTO curriculum (period,description,institution,category,order_index) VALUES (?,?,?,?,?)',
    [period, description, institution || '', category || 'formacion', order_index || 0]
  ) as any
  res.status(201).json({ id: r.insertId })
})
router.put('/curriculum/:id', authMiddleware, async (req, res: Response): Promise<void> => {
  const { period, description, institution, category, order_index } = req.body
  await pool.query(
    'UPDATE curriculum SET period=?,description=?,institution=?,category=?,order_index=? WHERE id=?',
    [period, description, institution || '', category || 'formacion', order_index || 0, req.params.id]
  )
  res.json({ ok: true })
})
router.delete('/curriculum/:id', authMiddleware, async (req, res: Response): Promise<void> => {
  await pool.query('DELETE FROM curriculum WHERE id=?', [req.params.id])
  res.json({ ok: true })
})

// ─────────────────────────────────────────────────────────
// BIBLIOGRAFÍA
// ─────────────────────────────────────────────────────────
router.get('/bibliografia', authMiddleware, async (_req, res: Response): Promise<void> => {
  const [rows] = await pool.query('SELECT * FROM bibliografia ORDER BY order_index ASC, year DESC')
  res.json(rows)
})
router.post('/bibliografia', authMiddleware, async (req, res: Response): Promise<void> => {
  const { author, title, publisher, year, notes, order_index } = req.body
  const [r] = await pool.query(
    'INSERT INTO bibliografia (author,title,publisher,year,notes,order_index) VALUES (?,?,?,?,?,?)',
    [author, title, publisher || '', year || '', notes || '', order_index || 0]
  ) as any
  res.status(201).json({ id: r.insertId })
})
router.put('/bibliografia/:id', authMiddleware, async (req, res: Response): Promise<void> => {
  const { author, title, publisher, year, notes, order_index } = req.body
  await pool.query(
    'UPDATE bibliografia SET author=?,title=?,publisher=?,year=?,notes=?,order_index=? WHERE id=?',
    [author, title, publisher || '', year || '', notes || '', order_index || 0, req.params.id]
  )
  res.json({ ok: true })
})
router.delete('/bibliografia/:id', authMiddleware, async (req, res: Response): Promise<void> => {
  await pool.query('DELETE FROM bibliografia WHERE id=?', [req.params.id])
  res.json({ ok: true })
})

// ─────────────────────────────────────────────────────────
// COMMENTS
// ─────────────────────────────────────────────────────────
router.get('/comments', authMiddleware, async (_req, res: Response): Promise<void> => {
  const [rows] = await pool.query('SELECT * FROM comments ORDER BY created_at DESC')
  res.json(rows)
})
router.post('/comments', authMiddleware, async (req, res: Response): Promise<void> => {
  const { author, email, body, source, is_published } = req.body
  const [r] = await pool.query(
    'INSERT INTO comments (author,email,body,source,is_published) VALUES (?,?,?,?,?)',
    [author, email || '', body, source || '', is_published ? 1 : 0]
  ) as any
  res.status(201).json({ id: r.insertId })
})
router.put('/comments/:id', authMiddleware, async (req, res: Response): Promise<void> => {
  const { author, email, body, source, is_published } = req.body
  await pool.query(
    'UPDATE comments SET author=?,email=?,body=?,source=?,is_published=? WHERE id=?',
    [author, email || '', body, source || '', is_published ? 1 : 0, req.params.id]
  )
  res.json({ ok: true })
})
router.delete('/comments/:id', authMiddleware, async (req, res: Response): Promise<void> => {
  await pool.query('DELETE FROM comments WHERE id=?', [req.params.id])
  res.json({ ok: true })
})

// ─────────────────────────────────────────────────────────
// GUESTBOOK
// ─────────────────────────────────────────────────────────
router.get('/guestbook', authMiddleware, async (_req, res: Response): Promise<void> => {
  const [rows] = await pool.query('SELECT * FROM guestbook ORDER BY created_at DESC')
  res.json(rows)
})
router.put('/guestbook/:id', authMiddleware, async (req, res: Response): Promise<void> => {
  const { is_approved } = req.body
  await pool.query('UPDATE guestbook SET is_approved=? WHERE id=?', [is_approved ? 1 : 0, req.params.id])
  res.json({ ok: true })
})
router.delete('/guestbook/:id', authMiddleware, async (req, res: Response): Promise<void> => {
  await pool.query('DELETE FROM guestbook WHERE id=?', [req.params.id])
  res.json({ ok: true })
})

// ─────────────────────────────────────────────────────────
// NAV ITEMS
// ─────────────────────────────────────────────────────────
router.get('/nav', authMiddleware, async (_req, res: Response): Promise<void> => {
  const [rows] = await pool.query('SELECT * FROM nav_items ORDER BY order_index ASC')
  res.json(rows)
})
router.post('/nav', authMiddleware, async (req, res: Response): Promise<void> => {
  const { label, slug, order_index, is_bold, is_active } = req.body
  try {
    const [r] = await pool.query(
      'INSERT INTO nav_items (label,slug,order_index,is_bold,is_active) VALUES (?,?,?,?,?)',
      [label, slug, order_index || 0, is_bold ? 1 : 0, is_active ? 1 : 0]
    ) as any
    res.status(201).json({ id: r.insertId })
  } catch (e: any) { res.status(400).json({ error: e.message }) }
})
router.put('/nav/:id', authMiddleware, async (req, res: Response): Promise<void> => {
  const { label, slug, order_index, is_bold, is_active } = req.body
  await pool.query(
    'UPDATE nav_items SET label=?,slug=?,order_index=?,is_bold=?,is_active=? WHERE id=?',
    [label, slug, order_index || 0, is_bold ? 1 : 0, is_active ? 1 : 0, req.params.id]
  )
  res.json({ ok: true })
})
router.delete('/nav/:id', authMiddleware, async (req, res: Response): Promise<void> => {
  await pool.query('DELETE FROM nav_items WHERE id=?', [req.params.id])
  res.json({ ok: true })
})

export default router