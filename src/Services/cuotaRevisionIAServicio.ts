import { Transaction } from "sequelize";
import db from "../db/conexion";
import JuegosIA from "../Models/juegos_iaModel";
import UsoRevisionIA from "../Models/usoRevisionIAModel";
import { obtenerFechaLocalBolivia } from "../utils/fechaLocal";

export const LIMITE_REVISIONES_DIARIAS_POR_EJERCICIO = 5;

export interface CuotaRevisionIA {
    limite: number;
    usados: number;
    restantes: number;
    fecha: string;
}

export class EjercicioRevisionNoEncontradoError extends Error {}

export class CuotaRevisionAgotadaError extends Error {
    constructor(public readonly cuota: CuotaRevisionIA) {
        super("Alcanzaste los 5 intentos de revisión de este ejercicio por hoy.");
    }
}

const crearCuota = (fecha: string, usados: number): CuotaRevisionIA => ({
    limite: LIMITE_REVISIONES_DIARIAS_POR_EJERCICIO,
    usados,
    restantes: Math.max(
        LIMITE_REVISIONES_DIARIAS_POR_EJERCICIO - usados,
        0,
    ),
    fecha,
});

const comprobarPropiedadEjercicio = async (
    usuarioId: number,
    juegoId: number,
): Promise<void> => {
    const juego = await JuegosIA.findOne({
        attributes: ["id"],
        where: { id: juegoId, usuario_id: usuarioId },
    });

    if (!juego) {
        throw new EjercicioRevisionNoEncontradoError(
            "No se encontró el ejercicio de IA.",
        );
    }
};

export const obtenerCuotaRevisionIA = async (
    usuarioId: number,
    juegoId: number,
): Promise<CuotaRevisionIA> => {
    await comprobarPropiedadEjercicio(usuarioId, juegoId);

    const fecha = obtenerFechaLocalBolivia();
    const uso = await UsoRevisionIA.findOne({
        attributes: ["cantidad"],
        where: {
            usuario_id: usuarioId,
            juego_ia_id: juegoId,
            fecha_local: fecha,
        },
    });

    return crearCuota(fecha, Number(uso?.cantidad ?? 0));
};

export const consumirRevisionIA = async (
    usuarioId: number,
    juegoId: number,
): Promise<{ permitida: boolean; cuota: CuotaRevisionIA }> => {
    const fecha = obtenerFechaLocalBolivia();
    const transaccion = await db.transaction({
        isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    try {
        await db.query(
            "INSERT INTO `Uso_Revision_IA` (`usuario_id`, `juego_ia_id`, `fecha_local`, `cantidad`) VALUES (:usuarioId, :juegoId, :fecha, 0) ON DUPLICATE KEY UPDATE `id` = LAST_INSERT_ID(`id`)",
            {
                replacements: { usuarioId, juegoId, fecha },
                transaction: transaccion,
            },
        );

        const [, metadata] = await db.query(
            "UPDATE `Uso_Revision_IA` SET `cantidad` = `cantidad` + 1 WHERE `usuario_id` = :usuarioId AND `juego_ia_id` = :juegoId AND `fecha_local` = :fecha AND `cantidad` < :limite",
            {
                replacements: {
                    usuarioId,
                    juegoId,
                    fecha,
                    limite: LIMITE_REVISIONES_DIARIAS_POR_EJERCICIO,
                },
                transaction: transaccion,
            },
        );
        const affectedRows = (metadata as { affectedRows?: number })
            .affectedRows;
        const permitida = Number(affectedRows ?? 0) > 0;
        const uso = await UsoRevisionIA.findOne({
            attributes: ["cantidad"],
            where: {
                usuario_id: usuarioId,
                juego_ia_id: juegoId,
                fecha_local: fecha,
            },
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
