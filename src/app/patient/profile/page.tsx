import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Target,
  UserCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
      <div className="p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <UserCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold">Conta não vinculada</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
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

  const profileFields = [
    {
      icon: User,
      label: "Nome Completo",
      value: patient.full_name,
    },
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
    {
      icon: Target,
      label: "Objetivo",
      value: patient.goal,
    },
  ];

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground">Suas informações pessoais.</p>
      </div>

      {/* Profile Avatar */}
      <Card>
        <CardContent className="flex flex-col items-center py-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-3">
            <User className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">{patient.full_name}</h2>
          {patient.email && (
            <p className="text-sm text-muted-foreground">{patient.email}</p>
          )}
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profileFields.map((field, index) => {
            if (!field.value) return null;
            return (
              <div key={index} className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <field.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{field.label}</p>
                  <p className="font-medium break-words">{field.value}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Conta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Membro desde</p>
              <p className="font-medium">
                {format(new Date(patient.created_at), "MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
