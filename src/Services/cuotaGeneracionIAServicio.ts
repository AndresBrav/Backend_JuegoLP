import { Transaction } from "sequelize";
import db from "../db/conexion";
import UsoGeneracionIA from "../Models/usoGeneracionIAModel";

export const LIMITE_GENERACIONES_DIARIAS = 5;

export interface CuotaGeneracionIA {
    limite: number;
    usados: number;
    restantes: number;
    fecha: string;
}

const obtenerFechaLocal = (): string => {
    const partes = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/La_Paz",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(new Date());
    const obtenerParte = (tipo: string) =>
        partes.find((parte) => parte.type === tipo)?.value ?? "";

    return `${obtenerParte("year")}-${obtenerParte("month")}-${obtenerParte("day")}`;
};

const crearCuota = (fecha: string, usados: number): CuotaGeneracionIA => ({
    limite: LIMITE_GENERACIONES_DIARIAS,
    usados,
    restantes: Math.max(LIMITE_GENERACIONES_DIARIAS - usados, 0),
    fecha,
});

export const obtenerCuotaGeneracionIA = async (
    usuarioId: number,
): Promise<CuotaGeneracionIA> => {
    const fecha = obtenerFechaLocal();
    const uso = await UsoGeneracionIA.findOne({
        attributes: ["cantidad"],
        where: { usuario_id: usuarioId, fecha_local: fecha },
    });

    return crearCuota(fecha, Number(uso?.cantidad ?? 0));
};

export const consumirGeneracionIA = async (
    usuarioId: number,
): Promise<{ permitida: boolean; cuota: CuotaGeneracionIA }> => {
    const fecha = obtenerFechaLocal();
    const transaccion = await db.transaction({
        isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    try {
        await db.query(
            "INSERT INTO `Uso_Generacion_IA` (`usuario_id`, `fecha_local`, `cantidad`) VALUES (:usuarioId, :fecha, 0) ON DUPLICATE KEY UPDATE `id` = LAST_INSERT_ID(`id`)",
            { replacements: { usuarioId, fecha }, transaction: transaccion },
        );

        const [, metadata] = await db.query(
            "UPDATE `Uso_Generacion_IA` SET `cantidad` = `cantidad` + 1 WHERE `usuario_id` = :usuarioId AND `fecha_local` = :fecha AND `cantidad` < :limite",
            {
                replacements: {
                    usuarioId,
                    fecha,
                    limite: LIMITE_GENERACIONES_DIARIAS,
                },
                transaction: transaccion,
            },
        );
        const affectedRows = (metadata as { affectedRows?: number })
            .affectedRows;
        const permitida = Number(affectedRows ?? 0) > 0;
        const uso = await UsoGeneracionIA.findOne({
            attributes: ["cantidad"],
            where: { usuario_id: usuarioId, fecha_local: fecha },
            transaction: transaccion,
        });

        await transaccion.commit();

        return {
            permitida,
            cuota: crearCuota(fecha, Number(uso?.cantidad ?? 0)),
        };
    } catch (error) {
        await transaccion.rollback();
        throw error;
    }
};
