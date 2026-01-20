import { redirect } from "next/navigation";
import { verifyPatientToken, setPatientTokenCookie } from "@/lib/patient-token";
import { Loader2 } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function PatientAccessPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <div className="rounded-full bg-destructive/10 p-4 mb-4">
          <svg
            className="h-8 w-8 text-destructive"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold">Link inválido</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs">
          O link de acesso não contém um token válido. Por favor, solicite um
          novo link ao seu nutricionista.
        </p>
      </div>
    );
  }

  // Verify the token
  const result = await verifyPatientToken(token);

  if (!result.valid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <div className="rounded-full bg-destructive/10 p-4 mb-4">
          <svg
            className="h-8 w-8 text-destructive"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold">Link expirado</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs">
          {result.error || "Este link de acesso expirou."} Por favor, solicite
          um novo link ao seu nutricionista.
        </p>
      </div>
    );
  }

  // Token is valid - set the cookie and redirect
  await setPatientTokenCookie(token);
  redirect("/patient/plan");

  // This will never be reached, but TypeScript wants a return
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
    </div>
  );
}
