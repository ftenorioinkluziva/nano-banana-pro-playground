const { neon } = require('@neondatabase/serverless')
require('dotenv').config({ path: '.env.local' })

async function cleanOrphanUser() {
  try {
    const sql = neon(process.env.DATABASE_URL)

    console.log('🧹 Limpando usuário órfão...\n')

    // Delete user without account
    const result = await sql`
      DELETE FROM "user"
      WHERE email = 'f.tenorio.email@gmail.com'
      RETURNING email
    `

    if (result.length > 0) {
      console.log(`✅ Usuário deletado: ${result[0].email}`)
      console.log('\n📝 Agora você pode criar uma nova conta via /signup')
      console.log('   O signup deve funcionar corretamente agora!')
    } else {
      console.log('⚠️  Nenhum usuário encontrado com esse email')
    }

  } catch (error) {
    console.error('❌ Erro ao limpar usuário:', error.message)
    console.error(error)
    process.exit(1)
  }
}

cleanOrphanUser()
