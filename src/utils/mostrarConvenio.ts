/*import { existsSync } from "fs";
import { resolve } from "path";
import { formatearConvenio } from "./formatearConvenio";

export const mostrarConvenio = async (
  convenio: any,
  flowDynamic: any,
  baseDir: string,
) => {
  await flowDynamic(formatearConvenio(convenio));

  const rutaImagen = resolve(
    baseDir,
    "images",
    `${convenio.codigo_convenio}.png`,
  );

  if (existsSync(rutaImagen)) {
    await flowDynamic([
      {
        body: "📷 *Instructivo para realizar el recaudo de este convenio.*",
        media: rutaImagen,
      },
    ]);
  }

  await flowDynamic(`

━━━━━━━━━━━━━━

🔄 Escribe *buscar* para hacer otra consulta.

🏠 Escribe *menu* para volver al inicio.

📞 Escribe *soporte* para hablar con soporte.

━━━━━━━━━━━━━━
`);
};*/