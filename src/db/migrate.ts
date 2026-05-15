import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

async function migrate() {
  // Connect without database first to create it
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     Number(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    charset:  'utf8mb4',
  })

  const db = process.env.DB_NAME || 'jose_bobadilla'
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${db}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  await conn.query(`USE \`${db}\``)

  // ---- ADMIN USERS ----
  await conn.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      username   VARCHAR(80)  NOT NULL UNIQUE,
      email      VARCHAR(180) NOT NULL UNIQUE,
      password   VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  // ---- NAV ITEMS ----
  await conn.query(`
    CREATE TABLE IF NOT EXISTS nav_items (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      label       VARCHAR(120) NOT NULL,
      slug        VARCHAR(120) NOT NULL UNIQUE,
      order_index INT          NOT NULL DEFAULT 0,
      is_bold     TINYINT(1)   NOT NULL DEFAULT 0,
      is_active   TINYINT(1)   NOT NULL DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  // ---- PAGES ----
  await conn.query(`
    CREATE TABLE IF NOT EXISTS pages (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      nav_item_id INT          NULL,
      slug        VARCHAR(120) NOT NULL UNIQUE,
      title       VARCHAR(255) NOT NULL,
      content     LONGTEXT     NOT NULL DEFAULT '',
      created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (nav_item_id) REFERENCES nav_items(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  // ---- WORKS ----
  await conn.query(`
    CREATE TABLE IF NOT EXISTS works (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      title       VARCHAR(255) NOT NULL,
      year        SMALLINT     NULL,
      category    VARCHAR(100) NOT NULL DEFAULT '',
      description TEXT         NOT NULL DEFAULT '',
      image_url   VARCHAR(500) NULL,
      order_index INT          NOT NULL DEFAULT 0,
      created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  // ---- COMMENTS / INTERVIEWS ----
  await conn.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      author       VARCHAR(150) NOT NULL,
      email        VARCHAR(180) NOT NULL DEFAULT '',
      body         TEXT         NOT NULL,
      source       VARCHAR(255) NOT NULL DEFAULT '',
      is_published TINYINT(1)   NOT NULL DEFAULT 1,
      created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  // ---- GUEST BOOK ----
  await conn.query(`
    CREATE TABLE IF NOT EXISTS guestbook (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      name        VARCHAR(150) NOT NULL,
      email       VARCHAR(180) NOT NULL DEFAULT '',
      message     TEXT         NOT NULL,
      is_approved TINYINT(1)   NOT NULL DEFAULT 0,
      created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  console.log('✅ Migración completada: todas las tablas creadas.')
  await conn.end()
}

migrate().catch(err => {
  console.error('❌ Error en migración:', err)
  process.exit(1)
})
