import { Op } from "sequelize";
import EjerciciosGrupo from "../Models/ejerciciosGrupoModel";
import UsuarioEjerciciosGrupo from "../Models/usuario_ejerciciosGrupoModel";
import GrupoEstudiante from "../Models/grupoEstudianteModel";
import Grupo from "../Models/grupoModel";
import Usuarios from "../Models/usuarioModel";
import Notificaciones from "../Models/NotificacionesModel";
import TemariosGrupo from "../Models/temariosGrupoModel";

export type TipoEjercicioGrupo = "diagrama" | "pseudocodigo";

export const esTipoEjercicioValido = (
    tipo: any,
): tipo is TipoEjercicioGrupo =>
    tipo === "diagrama" || tipo === "pseudocodigo";

/** Verifica que el grupo exista y pertenezca al profesor indicado. */
export const profesorEsDuenioDeGrupo = async (
    grupoId: number,
    profesorId: number,
): Promise<ReturnType<typeof Grupo.findOne> | null> => {
    return Grupo.findOne({
        where: { id: grupoId, profesor_id: profesorId },
    });
};

/** Verifica que el grupo exista. */
export const obtenerGrupoEjercicios = async (grupoId: number) => {
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

/** Verifica que el estudiante esté matriculado en el grupo. */
export const estudiantePerteneceAGrupo = async (
    grupoId: number,
    estudianteId: number,
): Promise<boolean> => {
    const matricula = await GrupoEstudiante.findOne({
        where: { grupo_id: grupoId, estudiante_id: estudianteId },
    });
    return Boolean(matricula);
};

/** Lista los ejercicios de un grupo con la cantidad de estudiantes que los completaron. */
export const listarEjerciciosDeGrupo = async (grupoId: number) => {
    const ejercicios = await EjerciciosGrupo.findAll({
        where: { grupo_id: grupoId },
        include: [
            {
                model: UsuarioEjerciciosGrupo,
                as: "respuestas",
                attributes: ["completado"],
                required: false,
            },
            {
                model: TemariosGrupo,
                as: "temario",
                attributes: ["id", "nombre", "orden"],
                required: true,
            },
        ],
        order: [["id", "ASC"]],
    });

    const totalEstudiantes = await GrupoEstudiante.count({
        where: { grupo_id: grupoId },
    });

    return ejercicios.map((ejercicio) => {
        const respuestas =
            (ejercicio as any).respuestas ?? [];
        const temario = (ejercicio as any).temario ?? null;

        return {
            id: Number(ejercicio.id),
            grupo_id: Number(ejercicio.grupo_id),
            temario_id: Number(ejercicio.temario_id),
            temario: temario
                ? {
                      id: Number(temario.id),
                      nombre: temario.nombre,
                      orden: Number(temario.orden ?? 0),
                  }
                : null,
            titulo: ejercicio.titulo,
            enunciado: ejercicio.enunciado,
            tipo: ejercicio.tipo,
            puntos: Number(ejercicio.puntos ?? 10),
            createdAt: ejercicio.createdAt,
            updatedAt: ejercicio.updatedAt,
            completados: respuestas.filter((r: any) => r.completado).length,
            totalEstudiantes,
        };
    });
};

const notificarEstudiantesDeGrupo = async (
    grupoId: number,
    descripcion: string,
) => {
    try {
        const matriculas = await GrupoEstudiante.findAll({
            where: { grupo_id: grupoId },
            attributes: ["estudiante_id"],
            raw: true,
        });

        const ahora = new Date();

        for (const matricula of matriculas) {
            await Notificaciones.create({
                usuario_id: Number(matricula.estudiante_id),
                descripcion,
                leido: false,
                fecha: ahora,
            });
        }
    } catch (error) {
        console.error("ERROR notificarEstudiantesDeGrupo:", error);
    }
};

export const crearEjercicioDeGrupo = async (
    grupoId: number,
    nombreGrupo: string,
    datos: {
        titulo: string;
        enunciado: string;
        tipo: TipoEjercicioGrupo;
        puntos: number;
        temario_id: number;
    },
) => {
    const ejercicio = await EjerciciosGrupo.create({
        grupo_id: grupoId,
        temario_id: datos.temario_id,
        titulo: datos.titulo,
        enunciado: datos.enunciado,
        tipo: datos.tipo,
        puntos: datos.puntos,
    });

    await notificarEstudiantesDeGrupo(
        grupoId,
        `Nuevo ejercicio "${datos.titulo}" disponible en el grupo ${nombreGrupo}`,
    );

    return ejercicio;
};

export const editarEjercicioDeGrupo = async (
    ejercicioId: number,
    cambios: {
        titulo?: string;
        enunciado?: string;
        tipo?: TipoEjercicioGrupo;
        puntos?: number;
        temario_id?: number;
    },
) => {
    const ejercicio = await EjerciciosGrupo.findByPk(ejercicioId);

    if (!ejercicio) {
        return null;
    }

    if (cambios.titulo !== undefined) ejercicio.titulo = cambios.titulo;
    if (cambios.enunciado !== undefined)
        ejercicio.enunciado = cambios.enunciado;
    if (cambios.tipo !== undefined) ejercicio.tipo = cambios.tipo;
    if (cambios.puntos !== undefined) ejercicio.puntos = cambios.puntos;
    if (cambios.temario_id !== undefined)
        ejercicio.temario_id = cambios.temario_id;

    await ejercicio.save();
    return ejercicio;
};

export const eliminarEjercicioDeGrupo = async (
    ejercicioId: number,
    grupoId: number,
): Promise<boolean> => {
    const eliminados = await EjerciciosGrupo.destroy({
        where: { id: ejercicioId, grupo_id: grupoId },
    });
    return eliminados > 0;
};

/** Busca un ejercicio por id (para validar existencia y ownership). */
export const obtenerEjercicioPorId = async (ejercicioId: number) => {
    return EjerciciosGrupo.findByPk(ejercicioId, {
        attributes: ["id", "grupo_id"],
        raw: true,
    });
};

/** Lista con el estado propio de cada estudiante sobre los ejercicios del grupo. */
export const listarEjerciciosEstudianteGrupo = async (
    grupoId: number,
    estudianteId: number,
) => {
    const ejercicios = await EjerciciosGrupo.findAll({
        where: { grupo_id: grupoId },
        include: [
            {
                model: UsuarioEjerciciosGrupo,
                as: "respuestas",
                where: { usuario_id: estudianteId },
                required: false,
                attributes: [
                    "completado",
                    "puntos",
                    "fecha_completado",
                    "ultima_actividad",
                ],
            },
            {
                model: TemariosGrupo,
                as: "temario",
                attributes: ["id", "nombre", "orden"],
                required: true,
            },
        ],
        order: [["id", "ASC"]],
    });

    return ejercicios.map((ejercicio) => {
        const respuestas =
            (ejercicio as any).respuestas ?? [];
        const propio = respuestas[0] ?? null;
        const temario = (ejercicio as any).temario ?? null;

        return {
            id: Number(ejercicio.id),
            grupo_id: Number(ejercicio.grupo_id),
            temario_id: Number(ejercicio.temario_id),
            temario: temario
                ? {
                      id: Number(temario.id),
                      nombre: temario.nombre,
                      orden: Number(temario.orden ?? 0),
                  }
                : null,
            titulo: ejercicio.titulo,
            enunciado: ejercicio.enunciado,
            tipo: ejercicio.tipo,
            puntos: Number(ejercicio.puntos ?? 10),
            completado: Boolean(propio?.completado),
            puntosObtenidos: Number(propio?.puntos ?? 0),
            fecha_completado: propio?.fecha_completado ?? null,
            ultima_actividad: propio?.ultima_actividad ?? null,
        };
    });
};

/** Detalle de un ejercicio del grupo con el estado propio del estudiante. */
export const obtenerEjercicioEstudiante = async (
    grupoId: number,
    ejercicioId: number,
    estudianteId: number,
) => {
    const ejercicio = await EjerciciosGrupo.findOne({
        where: { id: ejercicioId, grupo_id: grupoId },
        include: [
            {
                model: UsuarioEjerciciosGrupo,
                as: "respuestas",
                where: { usuario_id: estudianteId },
                required: false,
            },
        ],
    });

    if (!ejercicio) {
        return null;
    }

    const respuestas =
        (ejercicio as any).respuestas ?? [];
    const propio = respuestas[0] ?? null;

    return {
        id: Number(ejercicio.id),
        grupo_id: Number(ejercicio.grupo_id),
        titulo: ejercicio.titulo,
        enunciado: ejercicio.enunciado,
        tipo: ejercicio.tipo,
        puntos: Number(ejercicio.puntos ?? 10),
        completado: Boolean(propio?.completado),
        puntosObtenidos: Number(propio?.puntos ?? 0),
        fecha_completado: propio?.fecha_completado ?? null,
        ultima_actividad: propio?.ultima_actividad ?? null,
        estado_tablero: propio?.estado_tablero ?? null,
    };
};

const upsertRespuesta = async (
    ejercicioId: number,
    estudianteId: number,
) => {
    let respuesta = await UsuarioEjerciciosGrupo.findOne({
        where: {
            ejercicio_grupo_id: ejercicioId,
            usuario_id: estudianteId,
        },
    });

    if (!respuesta) {
        respuesta = await UsuarioEjerciciosGrupo.create({
            usuario_id: estudianteId,
            ejercicio_grupo_id: ejercicioId,
            completado: false,
            puntos: 0,
        });
    }

    return respuesta;
};

/** Autoguardado del estado del tablero (sin marcar completado). */
export const guardarEstadoEjercicioEstudiante = async (
    grupoId: number,
    ejercicioId: number,
    estudianteId: number,
    estado_tablero: string | null,
) => {
    const ejercicio = await EjerciciosGrupo.findOne({
        where: { id: ejercicioId, grupo_id: grupoId },
    });

    if (!ejercicio) {
        throw new Error("EJERCICIO_NO_ENCONTRADO");
    }

    const respuesta = await upsertRespuesta(ejercicioId, estudianteId);

    respuesta.estado_tablero = estado_tablero;
    respuesta.ultima_actividad = new Date();
    await respuesta.save();

    return respuesta;
};

/**
 * Marca el ejercicio como completado sin asignar puntos automáticos
 * (el profesor califica después).
 */
export const completarEjercicioEstudiante = async (
    grupoId: number,
    ejercicioId: number,
    estudianteId: number,
    estado_tablero: string | null,
) => {
    const ejercicio = await EjerciciosGrupo.findOne({
        where: { id: ejercicioId, grupo_id: grupoId },
    });

    if (!ejercicio) {
        throw new Error("EJERCICIO_NO_ENCONTRADO");
    }

    const respuesta = await upsertRespuesta(ejercicioId, estudianteId);
    const yaEstabaCompletado = Boolean(respuesta.completado);

    respuesta.estado_tablero = estado_tablero;
    respuesta.completado = true;
    respuesta.ultima_actividad = new Date();
    respuesta.fecha_completado = new Date();

    if (!yaEstabaCompletado) {
        // No asignar puntos al entregar; el profesor califica después.
    }

    await respuesta.save();

    return {
        yaEstabaCompletado,
        puntosOtorgados: 0,
        respuesta,
    };
};

/**
 * Soluciones de los estudiantes del grupo sobre un ejercicio.
 * Si se indica usuarioId y es un estudiante del grupo, se incluye
 * además su estado_tablero (solución) para que el profesor la revise.
 */
export const listarSolucionesEjercicio = async (
    ejercicioId: number,
    usuarioFiltrado: number | null,
) => {
    const ejercicio = await EjerciciosGrupo.findByPk(ejercicioId, {
        attributes: [
            "id",
            "grupo_id",
            "titulo",
            "enunciado",
            "tipo",
            "puntos",
        ],
        raw: true,
    });

    if (!ejercicio) {
        return null;
    }

    const whereUsuario: any = {};
    if (usuarioFiltrado !== null) {
        whereUsuario.id = usuarioFiltrado;
    }
    whereUsuario.rol = "estudiante";

    const matriculas = await GrupoEstudiante.findAll({
        where: { grupo_id: Number(ejercicio.grupo_id) },
        attributes: ["estudiante_id"],
        raw: true,
    });

    const idsEstudiantes = matriculas.map((m) => Number(m.estudiante_id));

    if (idsEstudiantes.length === 0) {
        return {
            ejercicio,
            soluciones: [],
        };
    }

    const estudiantes = await Usuarios.findAll({
        where: { id: { [Op.in]: idsEstudiantes }, ...whereUsuario },
        attributes: ["id", "codigo", "username"],
        order: [["username", "ASC"]],
        raw: true,
    });

    if (estudiantes.length === 0) {
        return {
            ejercicio,
            soluciones: [],
        };
    }

    const idsFiltrados = estudiantes.map((e) => Number(e.id));

    const whereRespuestas: any = { usuario_id: { [Op.in]: idsFiltrados } };
    if (usuarioFiltrado !== null) {
        whereRespuestas.usuario_id = usuarioFiltrado;
    }

    const respuestasRaw = await UsuarioEjerciciosGrupo.findAll({
        where: whereRespuestas,
        attributes: [
            "usuario_id",
            "completado",
            "puntos",
            "estado_tablero",
            "fecha_completado",
            "ultima_actividad",
        ],
        raw: true,
    });

    const mapaRespuestas = new Map<number, any>();
    for (const respuesta of respuestasRaw) {
        mapaRespuestas.set(Number(respuesta.usuario_id), respuesta);
    }

    const soluciones = estudiantes.map((estudiante) => {
        const respuesta = mapaRespuestas.get(Number(estudiante.id)) ?? null;

        return {
            usuario: {
                id: Number(estudiante.id),
                codigo: estudiante.codigo,
                username: estudiante.username,
            },
            completado: Boolean(respuesta?.completado),
            puntos: Number(respuesta?.puntos ?? 0),
            fecha_completado: respuesta?.fecha_completado ?? null,
            ultima_actividad: respuesta?.ultima_actividad ?? null,
            tieneSolucion: Boolean(respuesta?.estado_tablero),
            estado_tablero: respuesta?.estado_tablero ?? null,
        };
    });

    return {
        ejercicio,
        soluciones,
    };
};

/** Total de puntos obtenidos por el usuario en ejercicios de grupos. */
export const obtenerPuntuacionGrupos = async (
    idUser: number,
): Promise<number> => {
    const puntosRaw = await UsuarioEjerciciosGrupo.findAll({
        attributes: ["puntos"],
        where: { usuario_id: idUser },
        raw: true,
    });

    const puntos = puntosRaw as unknown as { puntos: number }[];

    return puntos.reduce((acc, x) => acc + Number(x.puntos ?? 0), 0);
};

/** Permite al profesor asignar/modificar la nota (puntos) de la entrega de un estudiante. */
export const calificarEntregaEstudiante = async (
    ejercicioId: number,
    estudianteId: number,
    puntos: number,
) => {
    let respuesta = await UsuarioEjerciciosGrupo.findOne({
        where: {
            ejercicio_grupo_id: ejercicioId,
            usuario_id: estudianteId,
        },
    });

    if (!respuesta) {
        respuesta = await UsuarioEjerciciosGrupo.create({
            usuario_id: estudianteId,
            ejercicio_grupo_id: ejercicioId,
            completado: true,
            puntos,
            fecha_completado: new Date(),
            ultima_actividad: new Date(),
        });
    } else {
        respuesta.puntos = puntos;
        respuesta.completado = true;
        if (!respuesta.fecha_completado) {
            respuesta.fecha_completado = new Date();
        }
        await respuesta.save();
    }

    return respuesta;
};

/** Obtiene el ranking de mejores notas de los estudiantes pertenecientes a un grupo. */
export const obtenerRankingGrupo = async (grupoId: number) => {
    const matriculas = await GrupoEstudiante.findAll({
        where: { grupo_id: grupoId },
        attributes: ["estudiante_id"],
        raw: true,
    });

    const idsEstudiantes = matriculas.map((m) => Number(m.estudiante_id));
    if (idsEstudiantes.length === 0) {
        return [];
    }

    const estudiantes = await Usuarios.findAll({
        where: { id: { [Op.in]: idsEstudiantes }, rol: "estudiante" },
        attributes: ["id", "codigo", "username"],
        raw: true,
    });

    if (estudiantes.length === 0) {
        return [];
    }

    const ejercicios = await EjerciciosGrupo.findAll({
        where: { grupo_id: grupoId },
        attributes: ["id"],
        raw: true,
    });

    const idsEjercicios = ejercicios.map((e) => Number(e.id));

    const respuestas = idsEjercicios.length
        ? await UsuarioEjerciciosGrupo.findAll({
              where: {
                  ejercicio_grupo_id: { [Op.in]: idsEjercicios },
                  usuario_id: { [Op.in]: idsEstudiantes },
              },
              raw: true,
          })
        : [];

    const ranking = estudiantes.map((est) => {
        const misRespuestas = respuestas.filter(
            (r) => Number(r.usuario_id) === Number(est.id),
        );
        const puntosTotales = misRespuestas.reduce(
            (acc, r) => acc + Number(r.puntos ?? 0),
            0,
        );
        const completados = misRespuestas.filter((r) => r.completado).length;

        return {
            id: Number(est.id),
            codigo: est.codigo,
            username: est.username,
            puntosTotales,
            completados,
            totalEjercicios: idsEjercicios.length,
        };
    });

    ranking.sort((a, b) => b.puntosTotales - a.puntosTotales || b.completados - a.completados);

    return ranking;
};
