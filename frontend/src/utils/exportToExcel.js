import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export const exportEmployeesToExcel = (employees) => {
  const data = employees.map((emp) => ({
    Nombre: emp.name,
    Correo: emp.email,
    Teléfono: emp.phone,
    Puesto: emp.position,
    Ubicación: emp.location,
    Agencia: emp.agency,
    FechaCreación: new Date(emp.createdAt).toLocaleDateString()
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Directorio");
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

  const fileData = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(fileData, "directorio-empleados.xlsx");
};
