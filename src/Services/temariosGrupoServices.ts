import TemariosGrupo from "../Models/temariosGrupoModel";
import EjerciciosGrupo from "../Models/ejerciciosGrupoModel";
import UsuarioEjerciciosGrupo from "../Models/usuario_ejerciciosGrupoModel";
import Grupo from "../Models/grupoModel";
import {
    esMiembroDeGrupo,
} from "./grupoServices";

/** Errores de negocio reconocidos por los controladores (→ 400). */
export const esErrorNegocio = (err: unknown): boolean => {
    const msg = err instanceof Error ? err.message : "";
    return [
        "NOMBRE_REPETIDO",
        "TEMARIO_CON_EJERCICIOS",
        "FECHA_LIMITE_VENCIDA",
        "No existe",
        "no te pertenece",
        "Ya estás",
        "debe tener",
        "obligatorio",
        "inválido",
        "No estás inscrito",
    ].some((f) => msg.includes(f));
};

/** Valida que el temario exista y pertenezca al grupo del profesor. */
export const temarioDelProfesor = async (
    temarioId: number,
    profesorId: number,
) => {
    const temario = (await TemariosGrupo.findByPk(temarioId, {
        raw: true,
    })) as unknown as { id: number; grupo_id: number; nombre: string } | null;

    if (!temario) {
        throw new Error("El temario no existe");
    }

    const grupo = await Grupo.findOne({
        where: { id: temario.grupo_id, profesor_id: profesorId },
    });

    if (!grupo) {
        throw new Error("El temario no existe o no te pertenece");
    }

    return temario;
};

/** Profesor: temarios del grupo ordenados, con cantidad de ejercicios. */
export const listarTemariosProfesor = async (grupoId: number) => {
    const temarios = (await TemariosGrupo.findAll({
        where: { grupo_id: grupoId },
        order: [["orden", "ASC"]],
        raw: true,
    })) as unknown as Array<{
        id: number;
        nombre: string;
        orden: number;
    }>;

    return Promise.all(
        temarios.map(async (t) => ({
            ...t,
            ejercicios: await EjerciciosGrupo.count({
                where: { temario_id: t.id },
            }),
        })),
    );
};

/** Profesor: crea un temario en su grupo (nombre único por grupo). */
export const crearTemario = async (
    grupoId: number,
    profesorId: number,
    nombre: string,
) => {
    if (!nombre || typeof nombre !== "string" || nombre.trim().length < 2) {
        throw new Error("El nombre del temario es obligatorio (mínimo 2)");
    }

    const grupo = await Grupo.findOne({
        where: { id: grupoId, profesor_id: profesorId },
    });

    if (!grupo) {
        throw new Error("El grupo no existe o no te pertenece");
    }

    const repetido = await TemariosGrupo.findOne({
        where: { grupo_id: grupoId, nombre: nombre.trim() },
    });

    if (repetido) {
        throw new Error(
            "NOMBRE_REPETIDO: ya existe un temario con ese nombre en el grupo",
        );
    }

    const ultimo = (await TemariosGrupo.findOne({
        where: { grupo_id: grupoId },
        order: [["orden", "DESC"]],
        raw: true,
    })) as unknown as { orden: number } | null;

    return TemariosGrupo.create({
        grupo_id: grupoId,
        nombre: nombre.trim(),
        orden: ultimo ? ultimo.orden + 1 : 0,
    });
};

/** Profesor: renombra un temario (nombre único dentro de su grupo). */
export const editarTemario = async (
    temarioId: number,
    profesorId: number,
    nombre: string,
) => {
    const temario = await temarioDelProfesor(temarioId, profesorId);

    if (!nombre || typeof nombre !== "string" || nombre.trim().length < 2) {
        throw new Error("El nombre del temario es obligatorio (mínimo 2)");
    }

    const repetido = (await TemariosGrupo.findOne({
        where: { grupo_id: temario.grupo_id, nombre: nombre.trim() },
        raw: true,
    })) as unknown as { id: number } | null;

    if (repetido && repetido.id !== temario.id) {
        throw new Error(
            "NOMBRE_REPETIDO: ya existe un temario con ese nombre en el grupo",
        );
    }

    await TemariosGrupo.update(
        { nombre: nombre.trim() },
        { where: { id: temarioId } },
    );
};

/** Profesor: elimina un temario SOLO si no tiene ejercicios. */
export const eliminarTemario = async (
    temarioId: number,
    profesorId: number,
) => {
    const temario = await temarioDelProfesor(temarioId, profesorId);

    const conEjercicios = await EjerciciosGrupo.count({
        where: { temario_id: temario.id },
    });

    if (conEjercicios > 0) {
        throw new Error(
            "TEMARIO_CON_EJERCICIOS: no puedes borrar un temario con ejercicios",
        );
    }

    await TemariosGrupo.destroy({ where: { id: temarioId } });
};

/** Profesor: reordena los temarios del grupo. Recibe los ids en orden. */
export const reordenarTemarios = async (
    grupoId: number,
    profesorId: number,
    idsOrdenados: number[],
) => {
    const grupo = await Grupo.findOne({
        where: { id: grupoId, profesor_id: profesorId },
    });

    if (!grupo) {
        throw new Error("El grupo no existe o no te pertenece");
    }

    if (!Array.isArray(idsOrdenados)) {
        throw new Error("El orden debe ser una lista de ids");
    }

    for (let i = 0; i < idsOrdenados.length; i++) {
        await TemariosGrupo.update(
            { orden: i },
            { where: { id: idsOrdenados[i], grupo_id: grupoId } },
        );
    }
};

/** Estudiante: temarios del grupo con su avance (completados/total). */
export const listarTemariosEstudiante = async (
    grupoId: number,
    estudianteId: number,
) => {
    const inscrito = await esMiembroDeGrupo(grupoId, estudianteId);

    if (!inscrito) {
        throw new Error("No estás inscrito en ese grupo");
    }

    const temarios = (await TemariosGrupo.findAll({
        where: { grupo_id: grupoId },
        order: [["orden", "ASC"]],
        raw: true,
    })) as unknown as Array<{ id: number; nombre: string; orden: number }>;

    return Promise.all(
        temarios.map(async (t) => {
            const ejercicios = (await EjerciciosGrupo.findAll({
                where: { temario_id: t.id },
                attributes: ["id"],
                raw: true,
            })) as unknown as Array<{ id: number }>;

            const ids = ejercicios.map((e) => e.id);
            const entregas = (await UsuarioEjerciciosGrupo.findAll({
                where: { usuario_id: estudianteId },
                attributes: ["ejercicio_grupo_id", "completado"],
                raw: true,
            })) as unknown as Array<{
                ejercicio_grupo_id: number;
                completado: boolean;
            }>;

            const completadas = ids.filter((id) =>
                entregas.some(
                    (e) => e.ejercicio_grupo_id === id && e.completado,
                ),
            ).length;

            return {
                ...t,
                total: ids.length,
                completados: completadas,
            };
        }),
    );
};
