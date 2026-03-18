import React from "react";
import { Document, Page, Text, View, pdf } from "@react-pdf/renderer";
import { commonStyles as s } from "./styles";
import type { Measurement, AnthropometryAssessment, Patient } from "@/types/database";

interface EvolutionReportProps {
  patient: Patient;
  measurements: Measurement[];
  assessments: AnthropometryAssessment[];
  clinicName?: string;
}

const EvolutionReportDocument: React.FC<EvolutionReportProps> = ({
  patient,
  measurements,
  assessments,
  clinicName,
}) => {
  const latestM = measurements[measurements.length - 1];
  const firstM = measurements[0];
  const latestA = assessments[assessments.length - 1];

  const weightDelta =
    latestM?.weight && firstM?.weight ? latestM.weight - firstM.weight : null;
  const fatDelta =
    latestM?.body_fat_percentage && firstM?.body_fat_percentage
      ? latestM.body_fat_percentage - firstM.body_fat_percentage
      : null;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          {clinicName && <Text style={s.clinicName}>{clinicName}</Text>}
          {clinicName && (
            <Text style={s.clinicSubtitle}>Relatório de Evolução Corporal</Text>
          )}
          {!clinicName && (
            <Text style={s.title}>Relatório de Evolução Corporal</Text>
          )}
          <Text style={s.subtitle}>Paciente: {patient.full_name}</Text>
          {patient.birth_date && (
            <Text style={s.subtitle}>
              Nascimento: {new Date(patient.birth_date).toLocaleDateString("pt-BR")}
            </Text>
          )}
          <Text style={s.subtitle}>
            Gerado em: {new Date().toLocaleDateString("pt-BR")} às{" "}
            {new Date().toLocaleTimeString("pt-BR")}
          </Text>
        </View>

        {/* Current Stats */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Resumo Atual</Text>
          <View style={s.statsGrid}>
            <View style={s.statBox}>
              <Text style={s.statLabel}>Peso Atual</Text>
              <Text style={s.statValue}>
                {latestM?.weight ?? latestA?.weight ?? "--"} kg
              </Text>
              {weightDelta !== null && (
                <Text style={s.statDelta}>
                  {weightDelta > 0 ? "+" : ""}
                  {weightDelta.toFixed(1)} kg desde o início
                </Text>
              )}
            </View>
            <View style={s.statBox}>
              <Text style={s.statLabel}>% Gordura</Text>
              <Text style={s.statValue}>
                {latestA?.body_fat_percentage ?? latestM?.body_fat_percentage ?? "--"}%
              </Text>
              {fatDelta !== null && (
                <Text style={s.statDelta}>
                  {fatDelta > 0 ? "+" : ""}
                  {fatDelta.toFixed(1)}pp desde o início
                </Text>
              )}
            </View>
            <View style={s.statBox}>
              <Text style={s.statLabel}>IMC</Text>
              <Text style={s.statValue}>
                {latestA?.bmi?.toFixed(1) ?? "--"}
              </Text>
            </View>
          </View>
        </View>

        {/* Measurements Table */}
        {measurements.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              Medidas de Acompanhamento ({measurements.length})
            </Text>
            <View style={s.table}>
              <View style={s.tableHeader}>
                <Text style={s.tableCellHeader}>Data</Text>
                <Text style={s.tableCellHeader}>Peso</Text>
                <Text style={s.tableCellHeader}>Gordura %</Text>
                <Text style={s.tableCellHeader}>Massa Musc.</Text>
                <Text style={s.tableCellHeader}>Cintura</Text>
                <Text style={s.tableCellHeader}>Quadril</Text>
              </View>
              {measurements.map((m, i) => (
                <View key={m.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                  <Text style={s.tableCell}>
                    {new Date(m.measured_at).toLocaleDateString("pt-BR")}
                  </Text>
                  <Text style={s.tableCell}>{m.weight ?? "--"}</Text>
                  <Text style={s.tableCell}>{m.body_fat_percentage ?? "--"}</Text>
                  <Text style={s.tableCell}>{m.muscle_mass ?? "--"}</Text>
                  <Text style={s.tableCell}>{m.waist_circumference ?? "--"}</Text>
                  <Text style={s.tableCell}>{m.hip_circumference ?? "--"}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Anthropometry Table */}
        {assessments.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              Avaliações Antropométricas ({assessments.length})
            </Text>
            <View style={s.table}>
              <View style={s.tableHeader}>
                <Text style={s.tableCellHeader}>Data</Text>
                <Text style={s.tableCellHeader}>Peso</Text>
                <Text style={s.tableCellHeader}>IMC</Text>
                <Text style={s.tableCellHeader}>Gordura %</Text>
                <Text style={s.tableCellHeader}>RCQ</Text>
                <Text style={s.tableCellHeader}>Cintura</Text>
              </View>
              {assessments.map((a, i) => (
                <View key={a.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                  <Text style={s.tableCell}>
                    {new Date(a.assessed_at).toLocaleDateString("pt-BR")}
                  </Text>
                  <Text style={s.tableCell}>{a.weight ?? "--"}</Text>
                  <Text style={s.tableCell}>{a.bmi?.toFixed(1) ?? "--"}</Text>
                  <Text style={s.tableCell}>
                    {a.body_fat_percentage?.toFixed(1) ?? "--"}
                  </Text>
                  <Text style={s.tableCell}>
                    {a.waist_hip_ratio?.toFixed(3) ?? "--"}
                  </Text>
                  <Text style={s.tableCell}>{a.waist_circumference ?? "--"}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <Text style={s.footer}>
          {clinicName ?? "NutriFlow"} | Relatório de Evolução Corporal |{" "}
          {measurements.length + assessments.length} registros
        </Text>
      </Page>
    </Document>
  );
};

export async function generateEvolutionPDF(
  patient: Patient,
  measurements: Measurement[],
  assessments: AnthropometryAssessment[],
  clinicName?: string
): Promise<Blob> {
  const doc = (
    <EvolutionReportDocument
      patient={patient}
      measurements={measurements}
      assessments={assessments}
      clinicName={clinicName}
    />
  );
  return pdf(doc).toBlob();
}
