import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, User } from "lucide-react";
import { getPublicNutriInfo } from "@/lib/queries/public-booking";
import { createClient } from "@/lib/supabase/server";
import type { NutriAvailability } from "@/types/database";
import { BookingForm } from "./_components/booking-form";

interface PageProps {
  params: Promise<{
    nutriId: string;
  }>;
}

// Format date to YYYY-MM-DD using local timezone (not UTC)
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function getNutriAvailability(nutriId: string): Promise<NutriAvailability[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("nutri_availability")
    .select("*")
    .eq("nutri_id", nutriId)
    .eq("is_active", true)
    .order("day_of_week", { ascending: true });

  return (data ?? []) as NutriAvailability[];
}

async function getAvailableDates(nutriId: string): Promise<Date[]> {
  const supabase = await createClient();

  // Get availability for the next 60 days
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 60);

  const { data: availability } = await supabase
    .from("nutri_availability")
    .select("day_of_week, start_time, end_time")
    .eq("nutri_id", nutriId)
    .eq("is_active", true);

  if (!availability || availability.length === 0) {
    return [];
  }

  // Generate dates based on availability
  const availableDates: Date[] = [];
  const currentDate = new Date(now);

  while (currentDate <= futureDate) {
    const dayOfWeek = currentDate.getDay();
    const hasAvailability = availability.some(
      (slot) => slot.day_of_week === dayOfWeek
    );

    if (hasAvailability) {
      availableDates.push(new Date(currentDate));
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return availableDates;
}

export default async function BookingPage({ params }: PageProps) {
  const { nutriId } = await params;

  // Fetch nutritionist info
  const nutriInfo = await getPublicNutriInfo(nutriId);

  if (!nutriInfo) {
    notFound();
  }

  const [availability, availableDates] = await Promise.all([
    getNutriAvailability(nutriId),
    getAvailableDates(nutriId),
  ]);

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
          {/* Nutritionist Info */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Nutricionista
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold text-lg">{nutriInfo.full_name}</p>
                <p className="text-sm text-muted-foreground">{nutriInfo.email}</p>
              </div>

              {availability.length > 0 && (
                <div className="pt-3 border-t">
                  <p className="text-sm font-medium mb-2">Horários disponíveis:</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {availability.map((slot) => {
                      const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
                      return (
                        <div key={slot.id} className="flex justify-between">
                          <span>{days[slot.day_of_week]}</span>
                          <span>
                            {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Calendar & Booking Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Selecione uma Data
              </CardTitle>
              <CardDescription>
                Escolha um dia disponível para sua consulta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                {availableDates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Não há horários disponíveis no momento.</p>
                    <p className="text-sm mt-2">
                      Entre em contato diretamente para mais informações.
                    </p>
                  </div>
                ) : (
                  <BookingForm nutriId={nutriId} availableDates={availableDates} />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
