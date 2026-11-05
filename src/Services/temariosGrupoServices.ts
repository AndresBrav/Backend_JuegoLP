import { Op } from "sequelize";
import TemariosGrupo from "../Models/temariosGrupoModel";
import EjerciciosGrupo from "../Models/ejerciciosGrupoModel";
import UsuarioEjerciciosGrupo from "../Models/usuario_ejerciciosGrupoModel";

const estaCompletado = (valor: any): boolean =>
    valor === true || valor === 1 || valor === "1";

/** Formatea un temario para las respuestas HTTP. */
const serializarTemario = (temario: any) => ({
    id: Number(temario.id),
    grupo_id: Number(temario.grupo_id),
    nombre: temario.nombre,
    descripcion: temario.descripcion ?? null,
    orden: Number(temario.orden ?? 0),
});

/**
 * Lista los temarios de un grupo, con la cantidad de ejercicios
 * de cada uno (y, si se da estudianteId, cuántos de ellos completó).
 */
export const listarTemariosDeGrupo = async (
    grupoId: number,
    estudianteId: number | null = null,
) => {
    const temarios = await TemariosGrupo.findAll({
        where: { grupo_id: grupoId },
        order: [
            ["orden", "ASC"],
            ["id", "ASC"],
        ],
        raw: true,
    });

    const idsTemarios = temarios.map((t: any) => Number(t.id));

    const ejerciciosPorTemario = new Map<number, number[]>();
    const filasEjercicios = idsTemarios.length
        ? await EjerciciosGrupo.findAll({
              where: { temario_id: { [Op.in]: idsTemarios } },
              attributes: ["id", "temario_id"],
              raw: true,
          })
        : [];

    filasEjercicios.forEach((e: any) => {
        const lista = ejerciciosPorTemario.get(Number(e.temario_id)) ?? [];
        lista.push(Number(e.id));
        ejerciciosPorTemario.set(Number(e.temario_id), lista);
    });

    // Completados por el estudiante (si aplica)
    const completadosPorTemario = new Map<number, number>();
    if (estudianteId !== null && filasEjercicios.length > 0) {
        const respuestas = await UsuarioEjerciciosGrupo.findAll({
            where: {
                ejercicio_grupo_id: { [Op.in]: filasEjercicios.map((e: any) => Number(e.id)) },
                usuario_id: estudianteId,
                completado: true,
            },
            attributes: ["ejercicio_grupo_id"],
            raw: true,
        });

        const idsCompletados = new Set(
            respuestas.map((r: any) => Number(r.ejercicio_grupo_id)),
        );

        ejerciciosPorTemario.forEach((ids, temarioId) => {
            completadosPorTemario.set(
                temarioId,
                ids.filter((id) => idsCompletados.has(id)).length,
            );
        });
    }

    return temarios.map((temario: any) => {
        const idTemario = Number(temario.id);
        const totalEjercicios = ejerciciosPorTemario.get(idTemario)?.length ?? 0;

        return {
            ...serializarTemario(temario),
            totalEjercicios,
            completadosEstudiante: estudianteId !== null
                ? completadosPorTemario.get(idTemario) ?? 0
                : null,
        };
    });
};

const errorNombreRepetido = (error: any): boolean =>
    error?.name === "SequelizeUniqueConstraintError";

/** Calcula el siguiente valor de orden para los temarios de un grupo. */
const siguienteOrden = async (grupoId: number): Promise<number> => {
    const maxOrden = await TemariosGrupo.max("orden", {
        where: { grupo_id: grupoId },
    });
    const actual = maxOrden === null || maxOrden === undefined ? -1 : Number(maxOrden);
    return actual + 1;
};

/** Crea un temario en el grupo (el dueño se valida en el controlador). */
export const crearTemarioDeGrupo = async (
    grupoId: number,
    datos: { nombre: string; descripcion?: string | null },
) => {
    try {
        const temario = await TemariosGrupo.create({
            grupo_id: grupoId,
            nombre: datos.nombre.trim(),
            descripcion: datos.descripcion?.trim() || null,
            orden: await siguienteOrden(grupoId),
        });
        return temario;
    } catch (error) {
        if (errorNombreRepetido(error)) {
            throw new Error("NOMBRE_REPETIDO");
        }
        throw error;
    }
};

/** Busca un temario por id con el grupo al que pertenece. */
export const obtenerTemarioPorId = async (temarioId: number) => {
    return TemariosGrupo.findByPk(temarioId, { raw: true });
};

export const editarTemarioDeGrupo = async (
    temarioId: number,
    cambios: { nombre?: string; descripcion?: string | null; orden?: number },
) => {
    const temario = await TemariosGrupo.findByPk(temarioId);

    if (!temario) {
        return null;
    }

    try {
        if (cambios.nombre !== undefined) temario.nombre = cambios.nombre.trim();
        if (cambios.descripcion !== undefined)
            temario.descripcion = cambios.descripcion?.trim() || null;
        if (cambios.orden !== undefined) temario.orden = Number(cambios.orden);

        await temario.save();
        return temario;
    } catch (error) {
        if (errorNombreRepetido(error)) {
            throw new Error("NOMBRE_REPETIDO");
        }
        throw error;
    }
};

/**
 * Elimina un temario SOLO si no tiene ejercicios asociados.
 * Si tiene, lanza TEMARIO_CON_EJERCICIOS para que el profesor
 * mueva o elimine los ejercicios primero.
 */
export const eliminarTemarioDeGrupo = async (temarioId: number) => {
    const totalEjercicios = await EjerciciosGrupo.count({
        where: { temario_id: temarioId },
    });

    if (totalEjercicios > 0) {
        throw new Error("TEMARIO_CON_EJERCICIOS");
    }

    const eliminados = await TemariosGrupo.destroy({
        where: { id: temarioId },
    });

    return eliminados > 0;
};

/** Reordena los temarios del grupo según la lista de ids recibida. */
export const reordenarTemariosDeGrupo = async (orden: number[]) => {
    for (let i = 0; i < orden.length; i++) {
        await TemariosGrupo.update({ orden: i }, { where: { id: orden[i] } });
    }
};
