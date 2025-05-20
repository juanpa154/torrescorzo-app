import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const exportVencimientosToExcel = async (data) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Vencimientos");

  // Encabezados
  sheet.columns = [
    { header: "Serie", key: "serie", width: 25 },
    { header: "Cuenta", key: "cuent", width: 15 },
    { header: "Documento", key: "doct", width: 15 },
    { header: "Importe", key: "importe", width: 15 },
    { header: "Fecha Vencimiento", key: "fec_venc", width: 20 },
  ];

  // Contenido
  data.forEach((row) => {
    sheet.addRow({
      serie: row.serie,
      cuent: row.cuent,
      doct: row.doct,
      importe: parseFloat(row.importe),
      fec_venc: new Date(row.fec_venc),
    });
  });

  // Formato para importe y fecha
  sheet.getColumn("importe").numFmt = '"$"#,##0.00';
  sheet.getColumn("fec_venc").numFmt = "dd/mm/yyyy";

  // Estilos para encabezado
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).alignment = { horizontal: "center" };

  // Exportar
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, "vencimientos.xlsx");
};
