const { neon } = require('@neondatabase/serverless')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function runMigration() {
  try {
    const sql = neon(process.env.DATABASE_URL)
    const migrationPath = path.join(__dirname, '..', 'db', 'migrations', '010_create_auth_tables.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('Running migration: 010_create_auth_tables.sql...')

    // Split into individual statements, handling DO blocks specially
    const statements = []
    let currentStatement = ''
    let inDoBlock = false

    for (const line of migrationSQL.split('\n')) {
      const trimmed = line.trim()

      // Skip comments
      if (trimmed.startsWith('--')) continue

      // Track DO blocks
      if (trimmed.startsWith('DO $$')) inDoBlock = true
      if (inDoBlock && trimmed === 'END $$;') {
        currentStatement += line + '\n'
        statements.push(currentStatement.trim())
        currentStatement = ''
        inDoBlock = false
        continue
      }

      currentStatement += line + '\n'

      // Split on semicolon only if not in a DO block
      if (!inDoBlock && trimmed.endsWith(';')) {
        const stmt = currentStatement.trim()
        if (stmt && !stmt.startsWith('--')) {
          statements.push(stmt)
        }
        currentStatement = ''
      }
    }

    // Execute each statement
    let count = 0
    for (const statement of statements) {
      if (statement.length > 0) {
        await sql.query(statement)
        count++
      }
    }

    console.log('✅ Migration completed successfully!')
    console.log(`   Executed ${count} statements`)
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

runMigration()
