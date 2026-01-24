import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, User, Mail, Calendar } from "lucide-react";
import { getPublicOrgInfo, getOrgNutritionists } from "@/lib/queries/public-booking";

interface PageProps {
  params: Promise<{
    orgSlug: string;
  }>;
}

export default async function OrganizationBookingPage({ params }: PageProps) {
  const { orgSlug } = await params;

  // Fetch organization info
  const orgInfo = await getPublicOrgInfo(orgSlug);

  if (!orgInfo) {
    notFound();
  }

  // Fetch organization nutritionists
  const nutritionists = await getOrgNutritionists(orgInfo.id);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Agendar Consulta
          </h1>
          <p className="text-muted-foreground mt-2">
            Reserve seu horário de forma rápida e fácil
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Organization Info */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Clínica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold text-lg">{orgInfo.name}</p>
              </div>
            </CardContent>
          </Card>

          {/* Nutritionists List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Nutricionistas Disponíveis
              </CardTitle>
              <CardDescription>
                Selecione um nutricionista para agendar sua consulta
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nutritionists.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Não há nutricionistas disponíveis no momento.</p>
                  <p className="text-sm mt-2">
                    Entre em contato diretamente para mais informações.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {nutritionists.map((nutri) => (
                    <Card key={nutri.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <p className="font-semibold text-base">{nutri.full_name}</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="truncate">{nutri.email}</span>
                          </div>
                        </div>

                        <Button asChild className="w-full" size="sm">
                          <Link href={`/book/${nutri.id}`}>
                            <Calendar className="mr-2 h-4 w-4" />
                            Agendar Consulta
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
