import { Op } from "sequelize";
import Usuarios from "../Models/usuarioModel";
import UsuarioJuegos from "../Models/usuario_juegosModel";
import UsuarioJuegosIA from "../Models/usuario_juegosIAModel";
import Grupo from "../Models/grupoModel";
import GrupoEstudiantes from "../Models/grupoEstudianteModel";
import EjerciciosGrupo from "../Models/ejerciciosGrupoModel";

/** Lista grupos para que administración pueda acceder a sus reportes. */
export const listarGruposAdmin = async () => {
    const grupos = (await Grupo.findAll({
        attributes: ["id", "nombre", "createdAt", "profesor_id"],
        order: [["nombre", "ASC"]],
        raw: true,
    })) as unknown as Array<{
        id: number;
        nombre: string;
        createdAt: Date;
        profesor_id: number;
    }>;

    const grupoIds = grupos.map((grupo) => Number(grupo.id));
    const profesorIds = [
        ...new Set(grupos.map((grupo) => Number(grupo.profesor_id))),
    ];

    const [profesores, inscripciones, ejercicios] = await Promise.all([
        profesorIds.length
            ? Usuarios.findAll({
                  where: { id: { [Op.in]: profesorIds } },
                  attributes: ["id", "username"],
                  raw: true,
              })
            : Promise.resolve([]),
        grupoIds.length
            ? GrupoEstudiantes.findAll({
                  where: { grupo_id: { [Op.in]: grupoIds } },
                  attributes: ["grupo_id"],
                  raw: true,
              })
            : Promise.resolve([]),
        grupoIds.length
            ? EjerciciosGrupo.findAll({
                  where: { grupo_id: { [Op.in]: grupoIds } },
                  attributes: ["grupo_id"],
                  raw: true,
              })
            : Promise.resolve([]),
    ]);

    const profesorPorId = new Map(
        profesores.map((profesor) => [
            Number(profesor.id),
            String(profesor.username),
        ]),
    );
    const contarPorGrupo = (filas: Array<{ grupo_id: number }>) => {
        const conteos = new Map<number, number>();
        for (const fila of filas) {
            const grupoId = Number(fila.grupo_id);
            conteos.set(grupoId, (conteos.get(grupoId) ?? 0) + 1);
        }
        return conteos;
    };
    const estudiantesPorGrupo = contarPorGrupo(inscripciones);
    const ejerciciosPorGrupo = contarPorGrupo(ejercicios);

    return grupos.map((grupo) => ({
        id: Number(grupo.id),
        nombre: grupo.nombre,
        createdAt: grupo.createdAt,
        profesor: profesorPorId.get(Number(grupo.profesor_id)) ?? "desconocido",
        estudiantes: estudiantesPorGrupo.get(Number(grupo.id)) ?? 0,
        ejercicios: ejerciciosPorGrupo.get(Number(grupo.id)) ?? 0,
    }));
};

/** Lista global de estudiantes con sus puntos y ejercicios completados. */
export const listarEstudiantes = async () => {
    const estudiantes = await Usuarios.findAll({
        where: { rol: "estudiante" },
        attributes: ["id", "codigo", "username", "edad", "createdAt"],
        order: [["username", "ASC"]],
        raw: true,
    });

    const [progresos, juegosIA] = await Promise.all([
        UsuarioJuegos.findAll({
            attributes: ["usuario_id", "puntos", "completado"],
            raw: true,
        }),
        UsuarioJuegosIA.findAll({
            attributes: ["usuario_id", "puntos", "completado"],
            raw: true,
        }),
    ]);

    return estudiantes.map((estudiante) => {
        const id = Number(estudiante.id);
        const propios = progresos.filter((p) => Number(p.usuario_id) === id);
        const propiosIA = juegosIA.filter((j) => Number(j.usuario_id) === id);

        const puntos =
            propios.reduce((total, p) => total + Number(p.puntos ?? 0), 0) +
            propiosIA.reduce((total, j) => total + Number(j.puntos ?? 0), 0);

        const completados =
            propios.filter((p) => Boolean(p.completado)).length +
            propiosIA.filter((j) => Boolean(j.completado)).length;

        return {
            ...estudiante,
            puntos,
            completados,
        };
    });
};
