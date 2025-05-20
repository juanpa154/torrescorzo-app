const ADODB = require('node-adodb');

// Ruta a tu archivo .MDB (puede ser red local si el servidor tiene acceso)
const connection = ADODB.open('Provider=Microsoft.ACE.OLEDB.12.0;Data Source=\\gtcazac.webhop.net\\Aplicaciones\\SIIA\\GATLZAC\\BD\\SERV\\Servicio.mdb;');

// Ejemplo de función
const getOrdenes = async () => {
  try {
    const result = await connection.query("SELECT * FROM Ordenes");
    return result;
  } catch (error) {
    console.error("Error al consultar MDB:", error);
    return [];
  }
};

module.exports = { getOrdenes };
