import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Target,
  UserCircle,
  Sparkles,
  Shield,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default async function PatientProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get patient record linked to this user
  const { data: patient } = await supabase
    .from("patients")
    .select("id, full_name, email, phone, birth_date, gender, goal, created_at")
    .eq("user_id", user.id)
    .single();

  if (!patient) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 lg:px-8">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <UserCircle className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">Conta não vinculada</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Sua conta ainda não está vinculada a um perfil de paciente.
              Entre em contato com seu nutricionista para vincular sua conta.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatGender = (gender: string | null) => {
    if (!gender) return null;
    const genderMap: Record<string, string> = {
      male: "Masculino",
      female: "Feminino",
      other: "Outro",
    };
    return genderMap[gender.toLowerCase()] || gender;
  };

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(patient.birth_date);

  const profileFields = [
    {
      icon: Mail,
      label: "E-mail",
      value: patient.email,
    },
    {
      icon: Phone,
      label: "Telefone",
      value: patient.phone,
    },
    {
      icon: Calendar,
      label: "Data de Nascimento",
      value: patient.birth_date
        ? format(new Date(patient.birth_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
        : null,
    },
    {
      icon: UserCircle,
      label: "Gênero",
      value: formatGender(patient.gender),
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8 lg:py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm">Perfil</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight lg:text-3xl">
          Meu Perfil
        </h1>
        <p className="mt-1 text-muted-foreground">
          Suas informações pessoais e dados cadastrais.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left - Avatar Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="flex flex-col items-center py-8">
              {/* Avatar */}
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 lg:h-28 lg:w-28">
                  <User className="h-12 w-12 text-primary lg:h-14 lg:w-14" />
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-card bg-green-500">
                  <Shield className="h-4 w-4 text-white" />
                </div>
              </div>

              {/* Name */}
              <h2 className="mt-4 text-xl font-semibold text-center">
                {patient.full_name}
              </h2>

              {/* Quick Info */}
              <div className="mt-2 flex items-center gap-2">
                {age && (
                  <Badge variant="secondary">{age} anos</Badge>
                )}
                {patient.gender && (
                  <Badge variant="outline">{formatGender(patient.gender)}</Badge>
                )}
              </div>

              {/* Goal */}
              {patient.goal && (
                <div className="mt-4 w-full rounded-xl bg-primary/5 p-4 text-center">
                  <div className="mb-1 flex items-center justify-center gap-1 text-xs font-medium text-muted-foreground">
                    <Target className="h-3 w-3" />
                    Meu Objetivo
                  </div>
                  <p className="text-sm font-medium text-primary">{patient.goal}</p>
                </div>
              )}

              {/* Member since */}
              <p className="mt-4 text-xs text-muted-foreground">
                Membro desde {format(new Date(patient.created_at), "MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right - Info Cards */}
        <div className="space-y-6 lg:col-span-2">
          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>
                Dados cadastrados pelo seu nutricionista
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {profileFields.map((field, index) => {
                  if (!field.value) return null;
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-3 rounded-xl bg-muted/30 p-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm">
                        <field.icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          {field.label}
                        </p>
                        <p className="mt-0.5 font-medium break-words">
                          {field.value}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Empty state */}
              {profileFields.filter(f => f.value).length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-3 rounded-full bg-muted p-3">
                    <User className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Nenhuma informação adicional cadastrada
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Conta Vinculada
              </CardTitle>
              <CardDescription>
                Sua conta está segura e vinculada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-400">
                      Conta verificada
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Vinculada em {format(new Date(patient.created_at), "dd/MM/yyyy")}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
