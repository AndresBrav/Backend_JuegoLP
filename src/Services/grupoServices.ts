import crypto from "crypto";
import { Op } from "sequelize";
import Grupo from "../Models/grupoModel";
import GrupoEstudiante from "../Models/grupoEstudianteModel";
import Usuarios from "../Models/usuarioModel";

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Código corto, sin caracteres ambiguos (sin O/0 ni I/1). */
export const generarCodigoGrupo = (): string => {
    let codigo = "";
    for (let i = 0; i < 6; i++) {
        codigo += ALFABETO[crypto.randomInt(0, ALFABETO.length)];
    }
    return codigo;
};

export const crearGrupo = async (
    profesorId: number,
    nombre: string,
) => {
    for (let intento = 0; intento < 5; intento++) {
        const codigo = generarCodigoGrupo();
        const existente = await Grupo.findOne({ where: { codigo } });

        if (existente) {
            continue;
        }

        return Grupo.create({
            nombre,
            codigo,
            profesor_id: profesorId,
        });
    }

    throw new Error("No se pudo generar un código único para el grupo");
};

export const listarGruposProfesor = async (profesorId: number) => {
    const grupos = await Grupo.findAll({
        where: { profesor_id: profesorId },
        include: [
            {
                model: Usuarios,
                as: "estudiantes",
                attributes: ["id"],
                through: { attributes: [] },
            },
        ],
        order: [["id", "DESC"]],
    });

    return grupos.map((grupo) => {
        const estudiantes = (grupo as any).estudiantes ?? [];
        return {
            id: grupo.id,
            nombre: grupo.nombre,
            codigo: grupo.codigo,
            createdAt: grupo.createdAt,
            estudiantes: estudiantes.length,
        };
    });
};

export const obtenerGrupoPorId = async (grupoId: number) => {
    return Grupo.findByPk(grupoId, {
        include: [
            {
                model: Usuarios,
                as: "profesor",
                attributes: ["id", "codigo", "username"],
            },
        ],
    });
};

export const listarEstudiantesDeGrupo = async (grupoId: number) => {
    const matriculas = await GrupoEstudiante.findAll({
        where: { grupo_id: grupoId },
        attributes: ["estudiante_id"],
        raw: true,
    });

    const ids = matriculas.map((m) => Number(m.estudiante_id));

    if (ids.length === 0) {
        return [];
    }

    return Usuarios.findAll({
        where: { id: { [Op.in]: ids } },
        attributes: ["id", "codigo", "username", "edad"],
        order: [["username", "ASC"]],
        raw: true,
    });
};

export const unirEstudiantePorCodigo = async (
    codigo: string,
    estudianteId: number,
) => {
    const codigoNormalizado = codigo.trim().toUpperCase();

    const grupo = await Grupo.findOne({
        where: { codigo: codigoNormalizado },
    });

    if (!grupo) {
        throw new Error("CODIGO_INVALIDO");
    }

    const yaEsMiembro = await GrupoEstudiante.findOne({
        where: {
            grupo_id: Number(grupo.id),
            estudiante_id: estudianteId,
        },
    });

    if (yaEsMiembro) {
        throw new Error("YA_ES_MIEMBRO");
    }

    await GrupoEstudiante.create({
        grupo_id: Number(grupo.id),
        estudiante_id: estudianteId,
    });

    return grupo;
};

export const listarGruposEstudiante = async (estudianteId: number) => {
    const matriculas = await GrupoEstudiante.findAll({
        where: { estudiante_id: estudianteId },
        attributes: ["grupo_id"],
        raw: true,
    });

    const ids = matriculas.map((m) => Number(m.grupo_id));

    if (ids.length === 0) {
        return [];
    }

    return Grupo.findAll({
        where: { id: { [Op.in]: ids } },
        include: [
            {
                model: Usuarios,
                as: "profesor",
                attributes: ["id", "codigo", "username"],
            },
        ],
        order: [["id", "DESC"]],
    });
};

export const salirDeGrupo = async (
    grupoId: number,
    estudianteId: number,
): Promise<boolean> => {
    const eliminadas = await GrupoEstudiante.destroy({
        where: { grupo_id: grupoId, estudiante_id: estudianteId },
    });
    return eliminadas > 0;
};

export const eliminarGrupo = async (
    grupoId: number,
    profesorId: number,
): Promise<boolean> => {
    const eliminados = await Grupo.destroy({
        where: { id: grupoId, profesor_id: profesorId },
    });
    return eliminados > 0;
};

/** Un profesor solo puede ver a estudiantes matriculados en sus grupos. */
export const profesorTieneEstudiante = async (
    profesorId: number,
    estudianteId: number,
): Promise<boolean> => {
    const grupos = await Grupo.findAll({
        where: { profesor_id: profesorId },
        attributes: ["id"],
        raw: true,
    });

    if (grupos.length === 0) {
        return false;
    }

    const ids = grupos.map((g) => Number(g.id));

    const total = await GrupoEstudiante.count({
        where: {
            grupo_id: { [Op.in]: ids },
            estudiante_id: estudianteId,
        },
    });

    return total > 0;
};
