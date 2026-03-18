import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeAnamnesis } from "@/lib/ai/analyze-anamnesis";
import type { AnamnesisReport } from "@/types/anamnesis";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reportId } = await request.json();

    if (!reportId) {
      return NextResponse.json(
        { error: "reportId is required" },
        { status: 400 }
      );
    }

    // Fetch the report (RLS ensures only the owner nutri can access)
    const { data: report, error: fetchError } = await supabase
      .from("anamnesis_reports")
      .select(
        "chief_complaint, history_present_illness, past_medical_history, family_history, social_history, dietary_history, current_medications, supplements, goals, observations"
      )
      .eq("id", reportId)
      .eq("nutri_id", user.id)
      .single();

    if (fetchError || !report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // Cast the Supabase Json types to the expected format
    const reportData = report as unknown as Pick<
      AnamnesisReport,
      | "chief_complaint"
      | "history_present_illness"
      | "past_medical_history"
      | "family_history"
      | "social_history"
      | "dietary_history"
      | "current_medications"
      | "supplements"
      | "goals"
      | "observations"
    >;

    // Generate AI insights
    const insights = await analyzeAnamnesis(reportData);

    // Save insights to the report
    const { error: updateError } = await supabase
      .from("anamnesis_reports")
      .update({ ai_insights: JSON.parse(JSON.stringify(insights)) })
      .eq("id", reportId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      insights,
    });
  } catch (error) {
    console.error("Error analyzing anamnesis:", error);
    return NextResponse.json(
      { error: "Failed to analyze anamnesis" },
      { status: 500 }
    );
  }
}
