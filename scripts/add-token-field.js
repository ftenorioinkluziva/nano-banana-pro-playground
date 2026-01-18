const { neon } = require('@neondatabase/serverless')
require('dotenv').config({ path: '.env.local' })

async function addTokenField() {
  try {
    const sql = neon(process.env.DATABASE_URL)

    console.log('🔧 Adicionando campo "token" à tabela session...\n')

    // First, check if any sessions exist
    const sessionCount = await sql`SELECT COUNT(*) as count FROM session`

    if (sessionCount[0].count > 0) {
      console.log(`⚠️  Encontradas ${sessionCount[0].count} sessões existentes. Limpando...`)
      // Delete existing sessions since we can't add a NOT NULL field with existing data
      await sql`DELETE FROM session`
      console.log('✅ Sessões antigas removidas\n')
    }

    // Add token field to session table
    console.log('Adicionando campo "token"...')
    try {
      await sql`
        ALTER TABLE session
        ADD COLUMN IF NOT EXISTS token TEXT NOT NULL UNIQUE
      `
      console.log('✅ Campo "token" adicionado à tabela session')
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Campo "token" já existe na tabela session')
      } else {
        throw error
      }
    }

    console.log('\n✅ Migração concluída com sucesso!')
    console.log('\n📝 Próximo passo: Reinicie o servidor (Ctrl+C e pnpm dev)')
    console.log('   Depois tente fazer signup/login novamente.')

  } catch (error) {
    console.error('\n❌ Erro ao adicionar campo token:', error.message)
    console.error(error)
    process.exit(1)
  }
}

addTokenField()
