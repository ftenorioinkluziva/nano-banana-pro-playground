const { neon } = require('@neondatabase/serverless')
require('dotenv').config({ path: '.env.local' })

async function fixTables() {
  try {
    const sql = neon(process.env.DATABASE_URL)

    console.log('🔧 Adicionando campos faltantes às tabelas de autenticação...\n')

    // Add createdAt and updatedAt to account table
    console.log('1. Adicionando campos à tabela "account"...')
    try {
      await sql`
        ALTER TABLE account
        ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      `
      console.log('   ✅ Campos adicionados à tabela "account"')
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ⚠️  Campos já existem na tabela "account"')
      } else {
        throw error
      }
    }

    // Add createdAt and updatedAt to session table
    console.log('2. Adicionando campos à tabela "session"...')
    try {
      await sql`
        ALTER TABLE session
        ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      `
      console.log('   ✅ Campos adicionados à tabela "session"')
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ⚠️  Campos já existem na tabela "session"')
      } else {
        throw error
      }
    }

    console.log('\n✅ Tabelas corrigidas com sucesso!')
    console.log('\n📝 Próximo passo: Reinicie o servidor (Ctrl+C e pnpm dev)')
    console.log('   Depois tente fazer login novamente.')

  } catch (error) {
    console.error('\n❌ Erro ao corrigir tabelas:', error.message)
    console.error(error)
    process.exit(1)
  }
}

fixTables()
