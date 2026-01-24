import { NextRequest, NextResponse } from "next/server";
import { checkTimeSlotAvailability } from "@/lib/scheduling/conflict-checker";
import {
  createPublicPatient,
  createPublicAppointment,
  getPublicNutriInfo,
  type PublicPatientData,
} from "@/lib/queries/public-booking";

interface BookingRequest {
  nutriId: string;
  patientData: {
    full_name: string;
    email: string;
    phone?: string;
    notes?: string;
  };
  scheduledAt: string;
  durationMinutes?: number;
  notes?: string;
  organizationId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BookingRequest;
    const {
      nutriId,
      patientData,
      scheduledAt,
      durationMinutes = 60,
      notes,
      organizationId,
    } = body;

    // Validate required fields
    if (!nutriId) {
      return NextResponse.json(
        { error: "ID do nutricionista não fornecido" },
        { status: 400 }
      );
    }

    if (!scheduledAt) {
      return NextResponse.json(
        { error: "Data e hora do agendamento não fornecidos" },
        { status: 400 }
      );
    }

    if (!patientData?.full_name || !patientData?.email) {
      return NextResponse.json(
        { error: "Nome e email do paciente são obrigatórios" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(patientData.email)) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      );
    }

    // Validate duration
    if (durationMinutes < 15 || durationMinutes > 240) {
      return NextResponse.json(
        { error: "Duração inválida. Deve estar entre 15 e 240 minutos" },
        { status: 400 }
      );
    }

    // Verify nutritionist exists and is active
    const nutriInfo = await getPublicNutriInfo(nutriId);
    if (!nutriInfo) {
      return NextResponse.json(
        { error: "Nutricionista não encontrado" },
        { status: 404 }
      );
    }

    // Parse and validate scheduled time
    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { error: "Data e hora inválidas" },
        { status: 400 }
      );
    }

    const slotEnd = new Date(
      scheduledDate.getTime() + durationMinutes * 60 * 1000
    );

    // Check slot availability using conflict checker
    const conflictResult = await checkTimeSlotAvailability(nutriId, {
      start: scheduledDate,
      end: slotEnd,
    });

    if (conflictResult.hasConflict) {
      return NextResponse.json(
        { error: conflictResult.message || "Horário não disponível" },
        { status: 409 }
      );
    }

    // Create or find patient
    const patientResult = await createPublicPatient(nutriId, {
      full_name: patientData.full_name,
      email: patientData.email,
      phone: patientData.phone,
      notes: patientData.notes,
    });

    if (patientResult.error || !patientResult.data) {
      return NextResponse.json(
        { error: patientResult.error || "Erro ao criar paciente" },
        { status: 500 }
      );
    }

    const patient = patientResult.data;

    // Create appointment
    const appointmentResult = await createPublicAppointment({
      nutriId,
      patientId: patient.id,
      scheduledAt: scheduledDate.toISOString(),
      durationMinutes,
      notes,
      organizationId,
    });

    if (appointmentResult.error || !appointmentResult.data) {
      return NextResponse.json(
        { error: appointmentResult.error || "Erro ao criar agendamento" },
        { status: 500 }
      );
    }

    const appointment = appointmentResult.data;

    return NextResponse.json(
      {
        success: true,
        appointmentId: appointment.id,
        patientId: patient.id,
        scheduledAt: appointment.scheduled_at,
        durationMinutes: appointment.duration_minutes,
        nutriName: nutriInfo.full_name,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Booking creation error:", error);
    return NextResponse.json(
      { error: "Erro ao processar agendamento" },
      { status: 500 }
    );
  }
}
