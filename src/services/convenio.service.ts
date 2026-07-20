import { pool } from "../provider/database";

export class ConvenioService {

    static async buscar(texto: string) {

        const termino = `%${texto.toLowerCase()}%`;

        const [bbva, agrario, aval] = await Promise.all([

            pool.query(
                `
                SELECT
                    'BBVA' AS banco,
                    codigo_convenio,
                    nombre_convenio,
                    nit
                FROM bbva
                WHERE
                    LOWER(nombre_convenio) LIKE $1
                    OR LOWER(nit) LIKE $1
                `,
                [termino]
            ),

            pool.query(
                `
                SELECT
                    'AGRARIO' AS banco,
                    codigo_convenio,
                    nombre_convenio,
                    nit_convenio AS nit
                FROM agrario
                WHERE
                    LOWER(nombre_convenio) LIKE $1
                    OR LOWER(nit_convenio) LIKE $1
                `,
                [termino]
            ),

            pool.query(
                `
                SELECT
                    'AVAL' AS banco,
                    convenio AS nombre_convenio,
                    nit,
                    empresa,
                    sigla
                FROM aval
                WHERE
                    LOWER(convenio) LIKE $1
                    OR LOWER(empresa) LIKE $1
                    OR LOWER(sigla) LIKE $1
                    OR LOWER(nit) LIKE $1
                `,
                [termino]
            )

        ]);

        return {
            bbva: bbva.rows,
            agrario: agrario.rows,
            aval: aval.rows
        };
    }

}