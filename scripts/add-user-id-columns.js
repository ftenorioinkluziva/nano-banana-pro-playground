const { neon } = require('@neondatabase/serverless')
const fs = require('fs')
const path = require('path')

require('dotenv').config({ path: '.env.local' })

async function addUserIdColumns() {
  try {
    const sql = neon(process.env.DATABASE_URL)
    const migrationPath = path.join(__dirname, '..', 'db', 'migrations', '011_add_user_id_to_tables.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('🔄 Executando migration: 011_add_user_id_to_tables.sql...\n')

    // Split into individual DO blocks
    const statements = []
    let currentStatement = ''
    let inDoBlock = false

    for (const line of migrationSQL.split('\n')) {
      const trimmed = line.trim()

      // Skip comments and empty lines
      if (trimmed.startsWith('--') || trimmed === '') {
        if (!inDoBlock) continue
      }

      // Track DO blocks
      if (trimmed.startsWith('DO $$')) inDoBlock = true

      currentStatement += line + '\n'

      if (inDoBlock && trimmed === 'END $$;') {
        statements.push(currentStatement.trim())
        currentStatement = ''
        inDoBlock = false
      }
    }

    // Execute each statement
    console.log(`📝 Executando ${statements.length} blocos de alteração...\n`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.length > 0) {
        console.log(`   [${i + 1}/${statements.length}] Processando...`)
        await sql.query(statement)
      }
    }

    console.log('\n✅ Migration concluída com sucesso!')
    console.log('\n📝 Próximo passo: Reinicie o servidor (Ctrl+C e pnpm dev)')
    console.log('   As rotas de API devem funcionar corretamente agora.')

  } catch (error) {
    console.error('\n❌ Erro na migration:', error.message)
    console.error(error)
    process.exit(1)
  }
}

addUserIdColumns()
