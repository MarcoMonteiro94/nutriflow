"use client";

import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Measurement, CustomMeasurementType, CustomMeasurementValue } from "@/types/database";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ExportMenuProps {
  measurements: Measurement[];
  patientName: string;
  customTypes: CustomMeasurementType[];
  customValues: CustomMeasurementValue[];
}

export function ExportMenu({ measurements, patientName, customTypes, customValues }: ExportMenuProps) {
  const handleExportCSV = () => {
    if (measurements.length === 0) return;

    // Build CSV header
    const headers = [
      "Data",
      "Peso (kg)",
      "Altura (cm)",
      "% Gordura",
      "Massa Muscular (kg)",
      "Cintura (cm)",
      "Quadril (cm)",
    ];

    // Add custom type headers
    customTypes.forEach((type) => {
      headers.push(`${type.name} (${type.unit})`);
    });
    headers.push("Observações");

    // Build CSV rows
    const rows = measurements.map((measurement) => {
      const row = [
        format(new Date(measurement.measured_at), "dd/MM/yyyy", { locale: ptBR }),
        measurement.weight ?? "",
        measurement.height ?? "",
        measurement.body_fat_percentage ?? "",
        measurement.muscle_mass ?? "",
        measurement.waist_circumference ?? "",
        measurement.hip_circumference ?? "",
      ];

      // Add custom values for this measurement
      const measurementCustomValues = customValues.filter(
        (v) => v.measured_at === measurement.measured_at
      );

      customTypes.forEach((type) => {
        const customValue = measurementCustomValues.find((v) => v.type_id === type.id);
        row.push(customValue?.value ?? "");
      });

      row.push(measurement.notes ?? "");

      return row;
    });

    // Generate CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `medidas-${patientName.replace(/\s+/g, "-").toLowerCase()}-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
    if (measurements.length === 0) return;

    try {
      const { generateMeasurementPDF } = await import("@/lib/measurements/export-pdf");

      const blob = await generateMeasurementPDF(
        { full_name: patientName } as Parameters<typeof generateMeasurementPDF>[0],
        measurements
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `medidas-${patientName.replace(/\s+/g, "-").toLowerCase()}-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      link.click();
      // Delay revocation to ensure download starts
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Exportar CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileText className="mr-2 h-4 w-4" />
          Exportar PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
