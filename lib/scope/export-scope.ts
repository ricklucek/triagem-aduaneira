export type ScopeExportField = {
  label: string;
  value: string;
};

export type ScopeExportSection = {
  title: string;
  fields: ScopeExportField[];
};

export type ScopeExportTab = {
  title: string;
  sections: ScopeExportSection[];
};

export type ScopeExportDocument = {
  title: string;
  subtitle: string;
  generatedAt: string;
  tabs: ScopeExportTab[];
};

const normalizeText = (value: string | null | undefined) =>
  String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .trim();

function safeFileName(value: string) {
  return (
    normalizeText(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "escopo"
  );
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function collectScopeExportDocument(
  root: HTMLElement,
  title: string,
  subtitle: string,
): ScopeExportDocument {
  const tabs = Array.from(
    root.querySelectorAll<HTMLElement>("[data-export-tab]"),
  ).map((tab) => {
    const sections = Array.from(
      tab.querySelectorAll<HTMLElement>("[data-export-section]"),
    ).map((section) => {
      const fields = Array.from(
        section.querySelectorAll<HTMLElement>("[data-export-field]"),
      )
        .filter((field) => field.closest("[data-export-section]") === section)
        .map((field) => ({
          label: normalizeText(field.dataset.exportLabel) || "Informação",
          value:
            normalizeText(field.dataset.exportValue) ||
            normalizeText(field.textContent) ||
            "Não informado",
        }));

      return {
        title: normalizeText(section.dataset.exportSection) || "Informações",
        fields,
      };
    });

    return {
      title: normalizeText(tab.dataset.exportTab) || "Escopo",
      sections: sections.filter((section) => section.fields.length > 0),
    };
  });

  return {
    title: normalizeText(title) || "Escopo",
    subtitle: normalizeText(subtitle),
    generatedAt: new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date()),
    tabs: tabs.filter((tab) => tab.sections.length > 0),
  };
}

export async function createScopeExcelBuffer(
  documentData: ScopeExportDocument,
) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CASCO";
  workbook.created = new Date();
  workbook.subject = "Visualização formatada do escopo";

  for (const tab of documentData.tabs) {
    const worksheet = workbook.addWorksheet(tab.title.slice(0, 31), {
      views: [{ state: "frozen", ySplit: 4, showGridLines: false }],
      pageSetup: {
        orientation: "portrait",
        paperSize: 9,
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.35,
          right: 0.35,
          top: 0.5,
          bottom: 0.5,
          header: 0.2,
          footer: 0.2,
        },
      },
    });

    worksheet.columns = [
      { key: "label", width: 32 },
      { key: "value", width: 72 },
    ];

    worksheet.mergeCells("A1:B1");
    worksheet.getCell("A1").value = documentData.title;
    worksheet.getCell("A1").font = {
      bold: true,
      size: 14,
      color: { argb: "FF172033" },
    };
    worksheet.getCell("A1").alignment = { vertical: "middle" };
    worksheet.getCell("A1").border = {
      bottom: { style: "medium", color: { argb: "FFDC2626" } },
    };
    worksheet.getRow(1).height = 28;

    worksheet.mergeCells("A2:B2");
    worksheet.getCell("A2").value = documentData.subtitle;
    worksheet.getCell("A2").font = { size: 10, color: { argb: "FF475569" } };

    worksheet.mergeCells("A3:B3");
    worksheet.getCell("A3").value = `Gerado em ${documentData.generatedAt}`;
    worksheet.getCell("A3").font = { italic: true, size: 9 };

    let rowNumber = 5;
    for (const section of tab.sections) {
      worksheet.mergeCells(rowNumber, 1, rowNumber, 2);
      const sectionCell = worksheet.getCell(rowNumber, 1);
      sectionCell.value = section.title;
      sectionCell.font = { bold: true, color: { argb: "FF7F1D1D" } };
      sectionCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFEE2E2" },
      };
      sectionCell.alignment = { vertical: "middle" };
      worksheet.getRow(rowNumber).height = 22;
      rowNumber += 1;

      for (const field of section.fields) {
        const row = worksheet.getRow(rowNumber);
        row.getCell(1).value = field.label;
        row.getCell(1).font = { bold: true, color: { argb: "FF334155" } };
        row.getCell(2).value = field.value;
        row.alignment = { vertical: "top", wrapText: true };
        row.getCell(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8FAFC" },
        };
        row.eachCell((cell) => {
          cell.border = {
            bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          };
        });
        const approximateLines = field.value
          .split("\n")
          .reduce(
            (total, line) => total + Math.max(1, Math.ceil(line.length / 85)),
            0,
          );
        row.height = Math.max(20, Math.min(180, 15 * approximateLines));
        rowNumber += 1;
      }

      rowNumber += 1;
    }

    worksheet.getCell("A4").value = "Campo";
    worksheet.getCell("B4").value = "Informação";
    worksheet.getRow(4).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(4).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFDC2626" },
    };
  }

  return workbook.xlsx.writeBuffer();
}

export async function downloadScopeExcel(documentData: ScopeExportDocument) {
  const buffer = await createScopeExcelBuffer(documentData);
  downloadBlob(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${safeFileName(documentData.title)}.xlsx`,
  );
}

export async function createScopePdfBuffer(documentData: ScopeExportDocument) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (height: number) => {
    if (y + height <= pageHeight - 18) return;
    pdf.addPage();
    y = margin;
  };

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  const titleLines = pdf.splitTextToSize(
    documentData.title,
    contentWidth,
  ) as string[];
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  const subtitleLines = pdf.splitTextToSize(
    documentData.subtitle,
    contentWidth,
  ) as string[];
  const headerHeight =
    13 + titleLines.length * 6 + subtitleLines.length * 4 + 7;

  pdf.setFillColor(23, 32, 51);
  pdf.rect(0, 0, pageWidth, headerHeight, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.text(titleLines, margin, 13);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  const subtitleY = 13 + titleLines.length * 6 + 1;
  pdf.text(subtitleLines, margin, subtitleY);
  pdf.text(
    `Gerado em ${documentData.generatedAt}`,
    margin,
    subtitleY + subtitleLines.length * 4 + 2,
  );
  y = headerHeight + 8;

  for (const tab of documentData.tabs) {
    ensureSpace(12);
    pdf.setTextColor(127, 29, 29);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text(tab.title, margin, y);
    y += 8;

    for (const section of tab.sections) {
      ensureSpace(12);
      pdf.setFillColor(254, 226, 226);
      pdf.roundedRect(margin, y - 4.5, contentWidth, 8, 1.5, 1.5, "F");
      pdf.setTextColor(127, 29, 29);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text(section.title, margin + 3, y + 0.5);
      y += 8;

      for (const field of section.fields) {
        const labelLines = pdf.splitTextToSize(field.label, 45) as string[];
        const valueLines = pdf.splitTextToSize(
          field.value,
          contentWidth - 53,
        ) as string[];
        const remainingValueLines = [...valueLines];
        let firstBlock = true;

        do {
          ensureSpace(10);
          const availableLines = Math.max(
            1,
            Math.floor((pageHeight - 20 - y) / 4.2),
          );
          const currentLabelLines = firstBlock
            ? labelLines.slice(0, availableLines)
            : ([`${field.label} (continuação)`] as string[]);
          const currentValueLines = remainingValueLines.splice(
            0,
            availableLines,
          );
          const blockHeight =
            Math.max(currentLabelLines.length, currentValueLines.length) * 4.2 +
            4;

          pdf.setTextColor(51, 65, 85);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(8.5);
          pdf.text(currentLabelLines, margin + 2, y);
          pdf.setTextColor(15, 23, 42);
          pdf.setFont("helvetica", "normal");
          pdf.text(currentValueLines, margin + 50, y);
          y += blockHeight;
          pdf.setDrawColor(226, 232, 240);
          pdf.line(margin, y - 2, pageWidth - margin, y - 2);
          firstBlock = false;
        } while (remainingValueLines.length > 0);
      }

      y += 3;
    }

    y += 4;
  }

  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    pdf.setTextColor(100, 116, 139);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(
      `Página ${page} de ${pageCount}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: "right" },
    );
  }

  return pdf.output("arraybuffer");
}

export async function downloadScopePdf(documentData: ScopeExportDocument) {
  const buffer = await createScopePdfBuffer(documentData);
  downloadBlob(
    new Blob([buffer], { type: "application/pdf" }),
    `${safeFileName(documentData.title)}.pdf`,
  );
}
