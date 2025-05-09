import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const exportEmployeesToExcel = async (employees) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Directorio");

  // Define las columnas
  worksheet.columns = [
    { header: "Nombre", key: "name", width: 30 },
    { header: "Correo", key: "email", width: 30 },
    { header: "Teléfono", key: "phone", width: 20 },
    { header: "Puesto", key: "position", width: 25 },
    { header: "Ubicación", key: "location", width: 20 },
    { header: "Agencia", key: "agency", width: 20 },
    { header: "Fecha Creación", key: "createdAt", width: 20 },
  ];

  // Agrega filas
  employees.forEach((emp) => {
    worksheet.addRow({
      name: emp.name,
      email: emp.email,
      phone: emp.phone || "",
      position: emp.position,
      location: emp.location || "",
      agency: emp.agency,
      createdAt: new Date(emp.createdAt).toLocaleDateString(),
    });
  });

  // Estilo de encabezados
  worksheet.getRow(1).font = { bold: true };

  // Genera el archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, "directorio-empleados.xlsx");
};
