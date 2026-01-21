import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center text-center">
        {/* Logo */}
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-soft-lg">
          <UtensilsCrossed className="h-10 w-10" />
        </div>

        {/* Error Code */}
        <h1 className="mb-2 text-8xl font-bold tracking-tighter text-primary">
          404
        </h1>

        {/* Message */}
        <h2 className="mb-3 text-2xl font-semibold tracking-tight">
          Página não encontrada
        </h2>
        <p className="mb-8 max-w-md text-muted-foreground">
          A página que você está procurando não existe ou foi movida.
          Verifique o endereço ou volte para a página inicial.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Ir para o Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Início
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
