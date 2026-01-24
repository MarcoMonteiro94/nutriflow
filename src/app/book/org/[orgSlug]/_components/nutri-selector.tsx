"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, ChevronDown, ChevronUp, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { OrgNutritionist } from "@/lib/queries/public-booking";
import { BookingForm } from "./booking-form";

interface NutriSelectorProps {
  nutritionists: OrgNutritionist[];
  organizationId: string;
}

interface NextSlotInfo {
  nutriId: string;
  loading: boolean;
  slot: {
    date: string;
    time: string;
  } | null;
}

interface AvailableDatesInfo {
  nutriId: string;
  loading: boolean;
  dates: Date[];
}

export function NutriSelector({ nutritionists, organizationId }: NutriSelectorProps) {
  const [expandedNutriId, setExpandedNutriId] = useState<string | null>(null);
  const [nextSlots, setNextSlots] = useState<Map<string, NextSlotInfo>>(new Map());
  const [availableDates, setAvailableDates] = useState<Map<string, AvailableDatesInfo>>(new Map());

  // Fetch next available slots for each nutritionist
  useEffect(() => {
    async function fetchNextSlots() {
      const slotsMap = new Map<string, NextSlotInfo>();

      for (const nutri of nutritionists) {
        slotsMap.set(nutri.id, { nutriId: nutri.id, loading: true, slot: null });
      }
      setNextSlots(new Map(slotsMap));

      // Fetch in parallel
      await Promise.all(
        nutritionists.map(async (nutri) => {
          try {
            const response = await fetch(`/api/availability/next-slot?nutriId=${nutri.id}`);
            if (response.ok) {
              const data = await response.json();
              slotsMap.set(nutri.id, {
                nutriId: nutri.id,
                loading: false,
                slot: data.slot ? {
                  date: new Date(data.slot.start).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  }),
                  time: new Date(data.slot.start).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                } : null,
              });
            } else {
              slotsMap.set(nutri.id, { nutriId: nutri.id, loading: false, slot: null });
            }
          } catch (error) {
            slotsMap.set(nutri.id, { nutriId: nutri.id, loading: false, slot: null });
          }
          setNextSlots(new Map(slotsMap));
        })
      );
    }

    fetchNextSlots();
  }, [nutritionists]);

  async function toggleExpanded(nutriId: string) {
    const isCurrentlyExpanded = expandedNutriId === nutriId;
    setExpandedNutriId(isCurrentlyExpanded ? null : nutriId);

    // Fetch available dates when expanding
    if (!isCurrentlyExpanded && !availableDates.has(nutriId)) {
      setAvailableDates(new Map(availableDates.set(nutriId, {
        nutriId,
        loading: true,
        dates: [],
      })));

      try {
        const supabase = createClient();
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 60);

        const { data: availability } = await supabase
          .from("nutri_availability")
          .select("day_of_week, start_time, end_time")
          .eq("nutri_id", nutriId)
          .eq("is_active", true);

        if (!availability || availability.length === 0) {
          setAvailableDates(new Map(availableDates.set(nutriId, {
            nutriId,
            loading: false,
            dates: [],
          })));
          return;
        }

        // Generate dates based on availability
        const dates: Date[] = [];
        const currentDate = new Date(now);

        while (currentDate <= futureDate) {
          const dayOfWeek = currentDate.getDay();
          const hasAvailability = availability.some(
            (slot) => slot.day_of_week === dayOfWeek
          );

          if (hasAvailability) {
            dates.push(new Date(currentDate));
          }

          currentDate.setDate(currentDate.getDate() + 1);
        }

        setAvailableDates(new Map(availableDates.set(nutriId, {
          nutriId,
          loading: false,
          dates,
        })));
      } catch (error) {
        setAvailableDates(new Map(availableDates.set(nutriId, {
          nutriId,
          loading: false,
          dates: [],
        })));
      }
    }
  }

  function getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  if (nutritionists.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Não há nutricionistas disponíveis no momento.</p>
        <p className="text-sm mt-2">
          Entre em contato diretamente para mais informações.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {nutritionists.map((nutri) => {
        const isExpanded = expandedNutriId === nutri.id;
        const slotInfo = nextSlots.get(nutri.id);

        return (
          <Card key={nutri.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base">
                        {nutri.full_name}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {nutri.email}
                    </p>

                    {/* Next available slot */}
                    <div className="mt-2">
                      {slotInfo?.loading ? (
                        <Badge variant="outline" className="text-xs">
                          Consultando disponibilidade...
                        </Badge>
                      ) : slotInfo?.slot ? (
                        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700 border-green-200">
                          <Calendar className="mr-1 h-3 w-3" />
                          Próximo horário: {slotInfo.slot.date} às {slotInfo.slot.time}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-700 border-yellow-200">
                          Sem horários disponíveis nos próximos 30 dias
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(nutri.id)}
                  className="ml-2"
                >
                  {isExpanded ? (
                    <>
                      Fechar
                      <ChevronUp className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Agendar
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              {/* Expanded booking form section */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t">
                  {availableDates.get(nutri.id)?.loading ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      Carregando disponibilidade...
                    </div>
                  ) : (
                    <BookingForm
                      nutriId={nutri.id}
                      organizationId={organizationId}
                      availableDates={availableDates.get(nutri.id)?.dates ?? []}
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
