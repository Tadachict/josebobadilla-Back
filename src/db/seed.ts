import bcrypt from 'bcryptjs'
import pool from './pool'

async function seed() {
  const conn = await pool.getConnection()
  try {
    // Admin user — contraseña: admin123 (CAMBIA ESTO)
    const hash = await bcrypt.hash('admin123', 12)
    await conn.query(`INSERT IGNORE INTO admin_users (username, email, password) VALUES ('admin', 'admin@josebobadilla.com', ?)`, [hash])

    // Nav items
    const navItems = [
      { label:'Noticia Personal',          slug:'noticia-personal',        order_index:1, is_bold:1 },
      { label:'Obras',                     slug:'obras',                   order_index:2, is_bold:1 },
      { label:'Comentarios y entrevistas', slug:'comentarios-entrevistas', order_index:3, is_bold:1 },
      { label:'Curriculum',                slug:'curriculum',              order_index:4, is_bold:1 },
      { label:'Iconografía',               slug:'iconografia',             order_index:5, is_bold:1 },
      { label:'Libro de visitas',          slug:'libro-visitas',           order_index:6, is_bold:0 },
      { label:'Bibliografía',              slug:'bibliografia',            order_index:7, is_bold:1 },
      { label:'Créditos',                  slug:'creditos',                order_index:8, is_bold:1 },
    ]
    for (const item of navItems) {
      await conn.query(`INSERT IGNORE INTO nav_items (label,slug,order_index,is_bold,is_active) VALUES (?,?,?,?,1)`,
        [item.label, item.slug, item.order_index, item.is_bold])
    }

    // Sample pages
    const pages = [
      { slug:'noticia-personal', title:'Noticia Personal', content:'<p>Edita este contenido desde el panel de administración.</p>' },
      { slug:'creditos',         title:'Créditos',         content:'<p>Diseño y desarrollo del sitio web.</p>' },
      { slug:'biblioteca',       title:'Biblioteca',       content:'<p>Contenido de la biblioteca.</p>' },
      { slug:'filmoteca',        title:'Filmoteca',        content:'<p>Contenido de la filmoteca.</p>' },
      { slug:'pinacoteca',       title:'Pinacoteca',       content:'<p>Contenido de la pinacoteca.</p>' },
      { slug:'discoteca',        title:'Discoteca',        content:'<p>Contenido de la discoteca.</p>' },
    ]
    for (const p of pages) {
      await conn.query(`INSERT IGNORE INTO pages (slug,title,content) VALUES (?,?,?)`, [p.slug, p.title, p.content])
    }

    // Sample curriculum
    await conn.query(`INSERT IGNORE INTO curriculum (period,description,institution,category,order_index) VALUES (?,?,?,?,?)`,
      ['1990–1995','Licenciatura en Filología Hispánica','Universidad de ejemplo','formacion',1])

    // Sample obra
    await conn.query(`INSERT IGNORE INTO works (title,year,category,description,order_index) VALUES (?,?,?,?,?)`,
      ['Obra de ejemplo', 2003, 'Novela', 'Sinopsis de la obra. Edita desde el panel de administración.', 1])

    console.log('✅ Seed completado.')
    console.log('👤 Admin: usuario=admin | contraseña=admin123')
    console.log('⚠️  CAMBIA LA CONTRASEÑA tras el primer acceso.')
  } finally {
    conn.release()
    process.exit(0)
  }
}

seed().catch(err => { console.error('❌ Error en seed:', err); process.exit(1) })
