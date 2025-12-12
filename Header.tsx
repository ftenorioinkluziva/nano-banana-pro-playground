import Image from "next/image"
import Link from "next/link"

export function Header() {
  return (
    <header className="p-4">
      <Link href="/">
        <Image
          src="/creato-logo-transparent.png"
          alt="Creato Logo"
          width={150} // Ajuste a largura conforme necessário
          height={40} // Ajuste a altura conforme necessário
          priority // Adicione 'priority' se o logo estiver na primeira dobra da página para carregamento otimizado
        />
      </Link>
    </header>
  )
}