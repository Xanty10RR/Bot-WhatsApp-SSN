type ResultadoBusqueda = {
  total: number;
  bbva: any[];
  agrario: any[];
  aval: any[];
};

export function formatearBusqueda(
  texto: string,
  resultado: ResultadoBusqueda
): string {

  if (resultado.total === 0) {
    return `❌ No encontré convenios para:\n\n${texto}\n\nPuedes buscar por:\n• NIT\n• Empresa\n• Convenio\n• Sigla`;
  }

  let mensaje = `🔎 Búsqueda: ${texto}\n\n`;
  mensaje += `Se encontraron ${resultado.total} coincidencias.\n\n`;

  if (resultado.bbva.length > 0) {

    mensaje += `🏦 BBVA (${resultado.bbva.length})\n\n`;

    resultado.bbva.forEach((item, index) => {

      mensaje += `${index + 1}.\n`;
      mensaje += `Código: ${item.codigo_convenio}\n`;
      mensaje += `Convenio: ${item.nombre_convenio}\n`;
      mensaje += `NIT: ${item.nit}\n\n`;

    });

    mensaje += "────────────────────\n\n";
  }

  if (resultado.agrario.length > 0) {

    mensaje += `🏦 Banco Agrario (${resultado.agrario.length})\n\n`;

    resultado.agrario.forEach((item, index) => {

      mensaje += `${index + 1}.\n`;
      mensaje += `Código: ${item.codigo_convenio}\n`;
      mensaje += `Convenio: ${item.nombre_convenio}\n`;
      mensaje += `NIT: ${item.nit}\n\n`;

    });

    mensaje += "────────────────────\n\n";
  }

  if (resultado.aval.length > 0) {

    mensaje += `🏦 Grupo Aval (${resultado.aval.length})\n\n`;

    resultado.aval.forEach((item, index) => {

      mensaje += `${index + 1}.\n`;
      mensaje += `Empresa: ${item.empresa}\n`;
      mensaje += `Convenio: ${item.nombre_convenio}\n`;
      mensaje += `NIT: ${item.nit}\n`;
      mensaje += `Sigla: ${item.sigla}\n\n`;

    });

  }

  return mensaje;
}