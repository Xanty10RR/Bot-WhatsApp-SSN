import { pool } from "../provider/database";

export default class ConvenioService {
  static async obtenerPorId(
    banco: string,
    id: string
) {

  switch (banco) {

    case "BBVA": {

      const { rows } = await pool.query(
        `
        SELECT
          'BBVA' AS banco,
          codigo_convenio,
          nombre_convenio,
          nit,
          categoria,
          tipo_captura,
          referencias
        FROM bbva
        WHERE codigo_convenio = $1
        LIMIT 1
        `,
        [id]
      );

      return rows[0] ?? null;
    }

    case "AGRARIO": {

      const { rows } = await pool.query(
        `
        SELECT
          'AGRARIO' AS banco,
          codigo_convenio,
          nombre_convenio,
          nit_convenio AS nit,
          referencia,
          tipo_referencia,
          longitud_referencia,
          codigo_barras,
          manual
        FROM agrario
        WHERE codigo_convenio = $1
        LIMIT 1
        `,
        [id]
      );

      return rows[0] ?? null;
    }

    case "AVAL": {

      const { rows } = await pool.query(
        `
        SELECT
          'AVAL' AS banco,
          nit AS codigo_convenio,
          convenio AS nombre_convenio,
          nit,
          empresa,
          sigla,
          modalidad,
          dato_captura,
          descripcion_recaudo
        FROM aval
        WHERE nit = $1
        LIMIT 1
        `,
        [id]
      );

      return rows[0] ?? null;
    }

    default:
      return null;
  }
}

  static async sugerir(texto: string) {

  const [bbva, agrario, aval] = await Promise.all([

    pool.query(
      `
      SELECT
        nombre_convenio,
        similarity(lower(nombre_convenio), lower($1)) AS score
      FROM bbva
      ORDER BY score DESC
      LIMIT 1
      `,
      [texto]
    ),

    pool.query(
      `
      SELECT
        nombre_convenio,
        similarity(lower(nombre_convenio), lower($1)) AS score
      FROM agrario
      ORDER BY score DESC
      LIMIT 1
      `,
      [texto]
    ),

    pool.query(
      `
      SELECT
        convenio AS nombre_convenio,
        similarity(lower(convenio), lower($1)) AS score
      FROM aval
      ORDER BY score DESC
      LIMIT 1
      `,
      [texto]
    ),

  ]);

  const candidatos = [
    bbva.rows[0],
    agrario.rows[0],
    aval.rows[0],
  ].filter(Boolean);

  candidatos.sort((a: any, b: any) => b.score - a.score);

  return candidatos.length
    ? candidatos[0]
    : null;
  }
}
