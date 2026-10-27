import { config } from "./config";
import { getBot } from "./bot";
import { pool } from "./provider/database";

const keepDatabaseAlive = () => {
  setInterval(
    async () => {
      try {
        await pool.query("SELECT 1");
        console.log(
          "Ping a Supabase OK:",
          new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" }),
        );
      } catch (error) {
        console.error("❌ Ping a Supabase falló:", error);
      }
    },
    1000 * 60 * 5,
  ); // 5 min para que Render no se duerma
};

const main = async () => {
  keepDatabaseAlive();
  const { httpServer } = await getBot();

  // ESTE ES EL FIX para Render
  const port = Number(process.env.PORT || config.PORT || 3001);
  httpServer(port);

  console.log(`✅ Bot corriendo en puerto ${port}`);
};

main().catch(console.error);
