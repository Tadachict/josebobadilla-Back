import bcrypt from 'bcryptjs'
import pool from './pool'

async function seed() {
  const conn = await pool.getConnection()

  try {
    // Admin user (password: admin123 — change immediately after first login)
    const hash = await bcrypt.hash('admin123', 12)
    await conn.query(`
      INSERT IGNORE INTO admin_users (username, email, password)
      VALUES ('admin', 'admin@josebobadilla.com', ?)
    `, [hash])

    // Default nav items
    const navItems = [
      { label: 'Noticia Personal',        slug: 'noticia-personal',        order_index: 1, is_bold: 1 },
      { label: 'Obras',                   slug: 'obras',                   order_index: 2, is_bold: 1 },
      { label: 'Comentarios y entrevistas', slug: 'comentarios-entrevistas', order_index: 3, is_bold: 1 },
      { label: 'Curriculum',              slug: 'curriculum',              order_index: 4, is_bold: 1 },
      { label: 'Iconografía',             slug: 'iconografia',             order_index: 5, is_bold: 1 },
      { label: 'Libro de visitas',        slug: 'libro-visitas',           order_index: 6, is_bold: 0 },
      { label: 'Bibliografía',            slug: 'bibliografia',            order_index: 7, is_bold: 1 },
      { label: 'Créditos',               slug: 'creditos',                order_index: 8, is_bold: 1 },
    ]
    for (const item of navItems) {
      await conn.query(`
        INSERT IGNORE INTO nav_items (label, slug, order_index, is_bold, is_active)
        VALUES (?, ?, ?, ?, 1)
      `, [item.label, item.slug, item.order_index, item.is_bold])
    }

    // Sample pages
    const pages = [
      {
        slug: 'noticia-personal',
        title: 'Noticia Personal',
        content: '<p>José Bobadilla nació en...</p><p>Añade aquí la información personal del autor.</p>'
      },
      {
        slug: 'curriculum',
        title: 'Curriculum',
        content: '<p>Formación académica y trayectoria profesional de José Bobadilla.</p>'
      },
      {
        slug: 'iconografia',
        title: 'Iconografía',
        content: '<p>Galería fotográfica e iconográfica de José Bobadilla.</p>'
      },
      {
        slug: 'bibliografia',
        title: 'Bibliografía',
        content: '<p>Referencias bibliográficas y obras citadas.</p>'
      },
      {
        slug: 'creditos',
        title: 'Créditos',
        content: '<p>Diseño y desarrollo del sitio web.</p>'
      },
    ]
    for (const page of pages) {
      await conn.query(`
        INSERT IGNORE INTO pages (slug, title, content)
        VALUES (?, ?, ?)
      `, [page.slug, page.title, page.content])
    }

    // Sample work
    await conn.query(`
      INSERT IGNORE INTO works (title, year, category, description, order_index)
      VALUES ('Título de ejemplo', 2005, 'Novela', 'Descripción de la obra de ejemplo.', 1)
    `)

    // Sample comment
    await conn.query(`
      INSERT IGNORE INTO comments (author, body, source, is_published)
      VALUES ('Crítico Literario', 'Una obra de gran profundidad y calidad literaria.', 'Revista de Literatura, 2005', 1)
    `)

    console.log('✅ Seed completado. Usuario admin creado (contraseña: admin123)')
    console.log('⚠️  CAMBIA LA CONTRASEÑA del admin después del primer acceso.')
  } finally {
    conn.release()
    process.exit(0)
  }
}

seed().catch(err => {
  console.error('❌ Error en seed:', err)
  process.exit(1)
})
