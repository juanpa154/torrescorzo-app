// src/pages/CfdiRecibidos.jsx
import CfdiViewer from "../pages/CfdiViewer";

export default function CfdiRecibidos() {
  return (
    <CfdiViewer
      tipo="recibidos"
      esquemaInicial = "kia_zacatecas"
      titulo="CFDI Recibidos"
      tipoRfcFiltro="rfc_emisor"
      endpointBase = "/api/cfdi/"
    />
  );
}
