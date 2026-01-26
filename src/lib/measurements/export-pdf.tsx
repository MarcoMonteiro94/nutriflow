import React from "react";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import type { Measurement, Patient } from "@/types/database";

// Create styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  section: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    paddingBottom: 5,
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 5,
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
  },
  tableCellHeader: {
    flex: 1,
    fontSize: 9,
    fontWeight: "bold",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  statBox: {
    width: "30%",
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
  },
  statLabel: {
    fontSize: 8,
    color: "#666",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#999",
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingTop: 10,
  },
});

interface MeasurementsPDFProps {
  patient: {
    full_name: string;
    email?: string | null;
    birth_date?: string | null;
  };
  measurements: Measurement[];
}

// React PDF Document Component
const MeasurementsPDFDocument: React.FC<MeasurementsPDFProps> = ({ patient, measurements }) => {
  // Calculate statistics
  const latestMeasurement = measurements[measurements.length - 1];
  const firstMeasurement = measurements[0];

  const weightChange = latestMeasurement?.weight && firstMeasurement?.weight
    ? latestMeasurement.weight - firstMeasurement.weight
    : null;

  const bodyFatChange = latestMeasurement?.body_fat_percentage && firstMeasurement?.body_fat_percentage
    ? latestMeasurement.body_fat_percentage - firstMeasurement.body_fat_percentage
    : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Relatório de Medidas</Text>
          <Text style={styles.subtitle}>Paciente: {patient.full_name}</Text>
          {patient.email && <Text style={styles.subtitle}>Email: {patient.email}</Text>}
          {patient.birth_date && (
            <Text style={styles.subtitle}>
              Data de Nascimento: {new Date(patient.birth_date).toLocaleDateString("pt-BR")}
            </Text>
          )}
          <Text style={styles.subtitle}>
            Relatório gerado em: {new Date().toLocaleDateString("pt-BR")} às{" "}
            {new Date().toLocaleTimeString("pt-BR")}
          </Text>
        </View>

        {/* Summary Statistics */}
        {latestMeasurement && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medidas Atuais</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Peso</Text>
                <Text style={styles.statValue}>
                  {latestMeasurement.weight ? `${latestMeasurement.weight} kg` : "--"}
                </Text>
                {weightChange !== null && (
                  <Text style={styles.statLabel}>
                    {weightChange > 0 ? "+" : ""}{weightChange.toFixed(1)} kg
                  </Text>
                )}
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>% Gordura</Text>
                <Text style={styles.statValue}>
                  {latestMeasurement.body_fat_percentage
                    ? `${latestMeasurement.body_fat_percentage}%`
                    : "--"}
                </Text>
                {bodyFatChange !== null && (
                  <Text style={styles.statLabel}>
                    {bodyFatChange > 0 ? "+" : ""}{bodyFatChange.toFixed(1)}%
                  </Text>
                )}
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Massa Muscular</Text>
                <Text style={styles.statValue}>
                  {latestMeasurement.muscle_mass ? `${latestMeasurement.muscle_mass} kg` : "--"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Measurements Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico de Medidas</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={styles.tableCellHeader}>Data</Text>
              <Text style={styles.tableCellHeader}>Peso (kg)</Text>
              <Text style={styles.tableCellHeader}>Altura (cm)</Text>
              <Text style={styles.tableCellHeader}>Gordura (%)</Text>
              <Text style={styles.tableCellHeader}>Massa (kg)</Text>
              <Text style={styles.tableCellHeader}>Cintura (cm)</Text>
            </View>

            {/* Table Rows */}
            {measurements.map((measurement) => (
              <View key={measurement.id} style={styles.tableRow}>
                <Text style={styles.tableCell}>
                  {new Date(measurement.measured_at).toLocaleDateString("pt-BR")}
                </Text>
                <Text style={styles.tableCell}>{measurement.weight ?? "--"}</Text>
                <Text style={styles.tableCell}>{measurement.height ?? "--"}</Text>
                <Text style={styles.tableCell}>{measurement.body_fat_percentage ?? "--"}</Text>
                <Text style={styles.tableCell}>{measurement.muscle_mass ?? "--"}</Text>
                <Text style={styles.tableCell}>{measurement.waist_circumference ?? "--"}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          NutriFlow - Sistema de Gestão Nutricional | Total de medidas: {measurements.length}
        </Text>
      </Page>
    </Document>
  );
};

export async function generateMeasurementPDF(
  patient: Patient,
  measurements: Measurement[]
): Promise<Blob> {
  const doc = <MeasurementsPDFDocument patient={patient} measurements={measurements} />;
  const pdfBlob = await pdf(doc).toBlob();
  return pdfBlob;
}
