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

  const handleExportPDF = () => {
    if (measurements.length === 0) return;

    // For now, create a simple HTML report that can be printed as PDF
    const reportContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Relatório de Medidas - ${patientName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 1200px;
              margin: 0 auto;
            }
            h1 {
              color: #333;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f4f4f4;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .header-info {
              margin-bottom: 20px;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <h1>Relatório de Medidas</h1>
          <div class="header-info">
            <p><strong>Paciente:</strong> ${patientName}</p>
            <p><strong>Data do Relatório:</strong> ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
            <p><strong>Total de Medidas:</strong> ${measurements.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Peso (kg)</th>
                <th>Altura (cm)</th>
                <th>% Gordura</th>
                <th>Massa Muscular (kg)</th>
                <th>Cintura (cm)</th>
                <th>Quadril (cm)</th>
                ${customTypes.map((type) => `<th>${type.name} (${type.unit})</th>`).join("")}
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              ${measurements.map((measurement) => {
                const measurementCustomValues = customValues.filter(
                  (v) => v.measured_at === measurement.measured_at
                );
                return `
                  <tr>
                    <td>${format(new Date(measurement.measured_at), "dd/MM/yyyy", { locale: ptBR })}</td>
                    <td>${measurement.weight ?? "-"}</td>
                    <td>${measurement.height ?? "-"}</td>
                    <td>${measurement.body_fat_percentage ?? "-"}</td>
                    <td>${measurement.muscle_mass ?? "-"}</td>
                    <td>${measurement.waist_circumference ?? "-"}</td>
                    <td>${measurement.hip_circumference ?? "-"}</td>
                    ${customTypes.map((type) => {
                      const customValue = measurementCustomValues.find((v) => v.type_id === type.id);
                      return `<td>${customValue?.value ?? "-"}</td>`;
                    }).join("")}
                    <td>${measurement.notes ?? "-"}</td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Open in new window for printing
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(reportContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
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
