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

📦 *Código barras:*
${convenio.codigo_barras}

✍️ *Manual:*
${convenio.manual}`;

        case "BBVA":
            return `🏦 *BBVA*

📋 *Convenio:*
${convenio.nombre_convenio}

🆔 *NIT:*
${convenio.nit}`;

        case "AVAL":
            return `🏦 *BANCO DE OCCIDENTE*

🏢 *Empresa:*
${convenio.empresa}

📋 *Convenio:*
${convenio.nombre_convenio}

🆔 *NIT:*
${convenio.nit}`;

        default:
            return "❌ Convenio no encontrado.";
    }
}