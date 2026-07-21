export function formatearConvenio(convenio: any): string {

    switch (convenio.banco) {

        case "AGRARIO":
            return `🏦 *BANCO AGRARIO*

📋 *Convenio:*
${convenio.nombre_convenio}

🔢 *Código:*
${convenio.codigo_convenio}

🆔 *NIT:*
${convenio.nit}

📄 *Referencia:*
${convenio.referencia}

🔠 *Tipo referencia:*
${convenio.tipo_referencia}

📏 *Longitud:*
${convenio.longitud_referencia}

📦 *Código de barras:*
${convenio.codigo_barras}

✍️ *Manual:*
${convenio.manual}`;

        case "BBVA":
            return `🏦 *BBVA*

📋 *Convenio:*
${convenio.nombre_convenio}

🔢 *Código:*
${convenio.codigo_convenio}

🆔 *NIT:*
${convenio.nit}

📂 *Categoría:*
${convenio.categoria}

🛰️ *Tipo captura:*
${convenio.tipo_captura}

📄 *Referencias:*
${convenio.referencias}`;

        case "AVAL":
            return `🏦 *BANCO DE OCCIDENTE*

🏢 *Empresa:*
${convenio.empresa}

📋 *Convenio:*
${convenio.nombre_convenio}

🆔 *NIT:*
${convenio.nit}

🏷️ *Sigla:*
${convenio.sigla}

🖥️ *Modalidad:*
${convenio.modalidad}

⌨️ *Dato captura:*
${convenio.dato_captura}

📝 *Descripción recaudo:*
${convenio.descripcion_recaudo}`;

        default:
            return "❌ Convenio no encontrado.";
    }

}