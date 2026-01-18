const { neon } = require('@neondatabase/serverless')
require('dotenv').config({ path: '.env.local' })

async function checkTables() {
  try {
    const sql = neon(process.env.DATABASE_URL)

    console.log('🔍 Verificando tabelas de autenticação...\n')

    // Check if auth tables exist
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('user', 'session', 'account', 'verification')
      ORDER BY table_name
    `

    console.log('📋 Tabelas encontradas:')
    tables.forEach(t => console.log(`  ✓ ${t.table_name}`))

    if (tables.length === 0) {
      console.log('\n❌ PROBLEMA: Nenhuma tabela de autenticação encontrada!')
      console.log('   Better Auth precisa criar as tabelas automaticamente.')
      console.log('   Tente criar uma conta via /signup para forçar a criação.\n')
      return
    }

    // Check user table structure
    console.log('\n📊 Estrutura da tabela "user":')
    const userColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'user'
      ORDER BY ordinal_position
    `
    userColumns.forEach(c => {
      console.log(`  - ${c.column_name}: ${c.data_type} ${c.is_nullable === 'NO' ? '(required)' : '(optional)'}`)
    })

    // Check account table structure
    console.log('\n📊 Estrutura da tabela "account":')
    const accountColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'account'
      ORDER BY ordinal_position
    `
    accountColumns.forEach(c => {
      console.log(`  - ${c.column_name}: ${c.data_type} ${c.is_nullable === 'NO' ? '(required)' : '(optional)'}`)
    })

    // Count users
    const userCount = await sql`SELECT COUNT(*) as count FROM "user"`
    console.log(`\n👥 Total de usuários: ${userCount[0].count}`)

    if (userCount[0].count > 0) {
      const users = await sql`SELECT id, name, email, role, "emailVerified", "createdAt" FROM "user" ORDER BY "createdAt" DESC LIMIT 5`
      console.log('\n📝 Últimos usuários criados:')
      users.forEach(u => {
        console.log(`  - ${u.email} (${u.role}) - Verificado: ${u.emailVerified}`)
      })
    }

    // Check account records
    const accountCount = await sql`SELECT COUNT(*) as count FROM account`
    console.log(`\n🔑 Total de accounts: ${accountCount[0].count}`)

    if (accountCount[0].count > 0) {
      const accounts = await sql`
        SELECT a.id, a."userId", a."providerId", a."accountId", u.email
        FROM account a
        JOIN "user" u ON a."userId" = u.id
        ORDER BY a."createdAt" DESC
        LIMIT 5
      `
      console.log('\n📝 Accounts criados:')
      accounts.forEach(a => {
        console.log(`  - ${a.email} (provider: ${a.providerId})`)
      })
    } else {
      console.log('  ⚠️  Nenhuma account encontrada!')
      console.log('  Isso explica o erro "Credential account not found"')
    }

    console.log('\n✅ Verificação completa!')

  } catch (error) {
    console.error('❌ Erro ao verificar tabelas:', error.message)
    console.error(error)
  }
}

checkTables()
