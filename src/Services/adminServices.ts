import Usuarios from "../Models/usuarioModel";
import Grupo from "../Models/grupoModel";
import GrupoEstudiante from "../Models/grupoEstudianteModel";
import UsuarioJuegos from "../Models/usuario_juegosModel";
import UsuarioJuegosIA from "../Models/usuario_juegosIAModel";
import { Rol } from "../interfaces/Usuario";
import {
    crearUsuario,
    existeCodigo,
    existeUsername,
} from "./usuarioServices";

export const crearProfesor = async (datos: {
    codigo: string;
    username: string;
    edad: number;
    password: string;
}) => {
    if (await existeCodigo(datos.codigo)) {
        throw new Error("CODIGO_DUPLICADO");
    }

    if (await existeUsername(datos.username)) {
        throw new Error("USERNAME_DUPLICADO");
    }

    return crearUsuario({
        ...datos,
        rol: "profesor" as Rol,
    });
};

export const listarProfesores = async () => {
    const profesores = await Usuarios.findAll({
        where: { rol: "profesor" },
        attributes: ["id", "codigo", "username", "edad", "createdAt"],
        order: [["username", "ASC"]],
        raw: true,
    });

    const grupos = await Grupo.findAll({
        attributes: ["id", "profesor_id"],
        raw: true,
    });

    const matriculas = await GrupoEstudiante.findAll({
        attributes: ["grupo_id"],
        raw: true,
    });

    const estudiantesPorGrupo = new Map<number, number>();

    matriculas.forEach((matricula) => {
        const grupoId = Number(matricula.grupo_id);
        estudiantesPorGrupo.set(
            grupoId,
            (estudiantesPorGrupo.get(grupoId) ?? 0) + 1,
        );
    });

    return profesores.map((profesor) => {
        const propios = grupos.filter(
            (grupo) => Number(grupo.profesor_id) === Number(profesor.id),
        );

        const estudiantes = propios.reduce(
            (total, grupo) =>
                total + (estudiantesPorGrupo.get(Number(grupo.id)) ?? 0),
            0,
        );

        return {
            ...profesor,
            grupos: propios.length,
            estudiantes,
        };
    });
};

export const listarTodosLosGrupos = async () => {
    const grupos = await Grupo.findAll({
        include: [
            {
                model: Usuarios,
                as: "profesor",
                attributes: ["id", "codigo", "username"],
            },
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
            profesor: (grupo as any).profesor,
            estudiantes: estudiantes.length,
            createdAt: grupo.createdAt,
        };
    });
};

/** Lista global de estudiantes con grupos, puntos y ejercicios completados. */
export const listarEstudiantes = async () => {
    const estudiantes = await Usuarios.findAll({
        where: { rol: "estudiante" },
        attributes: ["id", "codigo", "username", "edad"],
        order: [["username", "ASC"]],
        raw: true,
    });

    const [matriculas, progresos, juegosIA] = await Promise.all([
        GrupoEstudiante.findAll({
            attributes: ["grupo_id", "estudiante_id"],
            raw: true,
        }),
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
        const propios = progresos.filter(
            (p) => Number(p.usuario_id) === id,
        );
        const propiosIA = juegosIA.filter(
            (j) => Number(j.usuario_id) === id,
        );

        const puntos =
            propios.reduce((total, p) => total + Number(p.puntos ?? 0), 0) +
            propiosIA.reduce((total, j) => total + Number(j.puntos ?? 0), 0);

        const completados =
            propios.filter((p) => Boolean(p.completado)).length +
            propiosIA.filter((j) => Boolean(j.completado)).length;

        return {
            ...estudiante,
            grupos: matriculas.filter(
                (m) => Number(m.estudiante_id) === id,
            ).length,
            puntos,
            completados,
        };
    });
};
