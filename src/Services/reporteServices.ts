import { Op } from "sequelize";
import Grupo from "../Models/grupoModel";
import GrupoEstudiantes from "../Models/grupoEstudianteModel";
import EjerciciosGrupo from "../Models/ejerciciosGrupoModel";
import EjercicioGrupoEstudiante from "../Models/ejercicioGrupoEstudianteModel";
import TemariosGrupo from "../Models/temariosGrupoModel";
import UsuarioEjerciciosGrupo from "../Models/usuario_ejerciciosGrupoModel";
import Juegos from "../Models/juegoModel";
import UsuarioJuegos from "../Models/usuario_juegosModel";
import JuegosIA from "../Models/juegos_iaModel";
import UsuarioJuegosIA from "../Models/usuario_juegosIAModel";
import Usuarios from "../Models/usuarioModel";
import { Rol } from "../interfaces/Usuario";

interface EjercicioReporte {
    id: number;
    titulo: string;
    temario_id: number;
    puntos: number;
    fecha_limite: string | null;
    tipo: "diagrama" | "pseudocodigo";
    asignacion: "todos" | "seleccionados";
    createdAt: Date | string;
}

interface EntregaReporte {
    ejercicio_grupo_id: number;
    usuario_id: number;
    estado_tablero: string | null;
    completado: boolean;
    calificado: boolean;
    puntos: number;
    puntos_profesor: number | null;
    comentario_profesor: string | null;
    fecha_completado: Date | string | null;
    ultima_actividad: Date | string | null;
}

interface MetricasReporte {
    ejerciciosTotales: number;
    completados: number;
    enProgreso: number;
    sinIniciar: number;
    calificados: number;
    pendientesCalificar: number;
    puntosCalificados: number;
    puntosMaximosCalificados: number;
    avancePorcentaje: number;
    ultimaActividad: string | null;
}

const esVerdadero = (valor: unknown): boolean =>
    valor === true || valor === 1 || valor === "1";

const fechaIso = (valor: Date | string | null): string | null => {
    if (!valor) return null;
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString();
};

const resumirEntregas = (
    ejercicios: EjercicioReporte[],
    usuarioId: number,
    entregas: Map<string, EntregaReporte>,
): MetricasReporte => {
    let completados = 0;
    let enProgreso = 0;
    let sinIniciar = 0;
    let calificados = 0;
    let pendientesCalificar = 0;
    let puntosCalificados = 0;
    let puntosMaximosCalificados = 0;
    let ultimaActividad: string | null = null;

    for (const ejercicio of ejercicios) {
        const entrega = entregas.get(`${usuarioId}:${ejercicio.id}`);
        if (!entrega) {
            sinIniciar += 1;
            continue;
        }

        const completado = esVerdadero(entrega.completado);
        const calificado = esVerdadero(entrega.calificado);
        const actividad = fechaIso(entrega.ultima_actividad);
        const iniciada =
            completado ||
            Boolean(entrega.estado_tablero?.trim()) ||
            actividad !== null;

        if (completado) {
            completados += 1;
        } else if (iniciada) {
            enProgreso += 1;
        } else {
            sinIniciar += 1;
        }

        if (calificado) {
            calificados += 1;
            puntosCalificados += Number(entrega.puntos_profesor ?? 0);
            puntosMaximosCalificados += Number(ejercicio.puntos);
        } else if (completado) {
            pendientesCalificar += 1;
        }

        if (
            actividad &&
            (!ultimaActividad ||
                new Date(actividad).getTime() >
                    new Date(ultimaActividad).getTime())
        ) {
            ultimaActividad = actividad;
        }
    }

    return {
        ejerciciosTotales: ejercicios.length,
        completados,
        enProgreso,
        sinIniciar,
        calificados,
        pendientesCalificar,
        puntosCalificados,
        puntosMaximosCalificados,
        avancePorcentaje: ejercicios.length
            ? Math.round((completados / ejercicios.length) * 100)
            : 0,
        ultimaActividad,
    };
};

/** Reporte de avance de un grupo; profesores solo consultan sus propios grupos. */
export const reporteGrupo = async (
    grupoId: number,
    usuarioId: number,
    rol: Rol,
) => {
    const grupo = (await Grupo.findByPk(grupoId, {
        raw: true,
    })) as unknown as {
        id: number;
        nombre: string;
        profesor_id: number;
        createdAt: Date;
    } | null;

    if (
        !grupo ||
        (rol === "profesor" &&
            Number(grupo.profesor_id) !== Number(usuarioId))
    ) {
        return null;
    }

    const [profesor, temariosRaw, ejerciciosRaw, inscripcionesRaw] =
        await Promise.all([
            Usuarios.findByPk(grupo.profesor_id, {
                attributes: ["id", "username"],
                raw: true,
            }) as Promise<{ id: number; username: string } | null>,
            TemariosGrupo.findAll({
                where: { grupo_id: grupoId },
                attributes: ["id", "nombre", "orden"],
                order: [["orden", "ASC"]],
                raw: true,
            }) as Promise<Array<{ id: number; nombre: string; orden: number }>>,
            EjerciciosGrupo.findAll({
                where: { grupo_id: grupoId },
                attributes: [
                    "id",
                    "titulo",
                    "temario_id",
                    "puntos",
                    "fecha_limite",
                    "tipo",
                    "asignacion",
                    "createdAt",
                ],
                order: [["createdAt", "ASC"]],
                raw: true,
            }) as Promise<EjercicioReporte[]>,
            GrupoEstudiantes.findAll({
                where: { grupo_id: grupoId },
                attributes: ["usuario_id", "fecha_union"],
                raw: true,
            }) as Promise<Array<{ usuario_id: number; fecha_union: string }>>,
        ]);

    const estudianteIds = inscripcionesRaw.map((i) => Number(i.usuario_id));
    const ejercicioIds = ejerciciosRaw.map((e) => Number(e.id));

    const [estudiantesRaw, entregasRaw, asignacionesRaw] = await Promise.all([
        estudianteIds.length
            ? (Usuarios.findAll({
                  where: { id: { [Op.in]: estudianteIds } },
                  attributes: ["id", "codigo", "username", "correo"],
                  order: [["username", "ASC"]],
                  raw: true,
              }) as Promise<
                  Array<{ id: number; codigo: string; username: string; correo: string | null }>
              >)
            : Promise.resolve([]),
        estudianteIds.length && ejercicioIds.length
            ? (UsuarioEjerciciosGrupo.findAll({
                  where: {
                      usuario_id: { [Op.in]: estudianteIds },
                      ejercicio_grupo_id: { [Op.in]: ejercicioIds },
                  },
                  attributes: [
                      "ejercicio_grupo_id",
                      "usuario_id",
                      "estado_tablero",
                      "completado",
                      "calificado",
                      "puntos",
                      "puntos_profesor",
                      "comentario_profesor",
                      "fecha_completado",
                      "ultima_actividad",
                  ],
                  raw: true,
              }) as Promise<EntregaReporte[]>)
            : Promise.resolve([]),
        ejercicioIds.length
            ? (EjercicioGrupoEstudiante.findAll({
                  where: { ejercicio_grupo_id: { [Op.in]: ejercicioIds } },
                  attributes: ["ejercicio_grupo_id", "usuario_id"],
                  raw: true,
              }) as Promise<
                  Array<{ ejercicio_grupo_id: number; usuario_id: number }>
              >)
            : Promise.resolve([]),
    ]);

    const temarioPorId = new Map(
        temariosRaw.map((temario) => [Number(temario.id), temario]),
    );
    const inscripcionPorId = new Map(
        inscripcionesRaw.map((inscripcion) => [
            Number(inscripcion.usuario_id),
            inscripcion.fecha_union,
        ]),
    );
    const entregasPorEstudianteEjercicio = new Map<string, EntregaReporte>(
        entregasRaw.map((entrega) => [
            `${Number(entrega.usuario_id)}:${Number(entrega.ejercicio_grupo_id)}`,
            entrega,
        ]),
    );
    const estudiantesPorEjercicio = new Map<number, Set<number>>();
    for (const asignacion of asignacionesRaw) {
        const ejercicioId = Number(asignacion.ejercicio_grupo_id);
        const estudiantes = estudiantesPorEjercicio.get(ejercicioId) ?? new Set();
        estudiantes.add(Number(asignacion.usuario_id));
        estudiantesPorEjercicio.set(ejercicioId, estudiantes);
    }
    const estudianteTieneAcceso = (
        ejercicio: EjercicioReporte,
        estudianteId: number,
    ): boolean =>
        ejercicio.asignacion !== "seleccionados" ||
        estudiantesPorEjercicio
            .get(Number(ejercicio.id))
            ?.has(estudianteId) === true;
    const ejercicioPorId = new Map(
        ejerciciosRaw.map((ejercicio) => [Number(ejercicio.id), ejercicio]),
    );
    const entregasAsignadasRaw = entregasRaw.filter((entrega) => {
        const ejercicio = ejercicioPorId.get(
            Number(entrega.ejercicio_grupo_id),
        );
        return (
            ejercicio !== undefined &&
            estudianteTieneAcceso(ejercicio, Number(entrega.usuario_id))
        );
    });

    const estadisticasPorEjercicio = new Map(
        ejerciciosRaw.map((ejercicio) => [
            Number(ejercicio.id),
            {
                iniciados: 0,
                completados: 0,
                enProgreso: 0,
                sinIniciar: 0,
                calificados: 0,
                pendientesCalificar: 0,
                estudiantesAsignados: 0,
            },
        ]),
    );

    const estudiantes = estudiantesRaw.map((estudiante) => {
        const id = Number(estudiante.id);
        const ejerciciosAsignados = ejerciciosRaw.filter((ejercicio) =>
            estudianteTieneAcceso(ejercicio, id),
        );
        const metricas = resumirEntregas(
            ejerciciosAsignados,
            id,
            entregasPorEstudianteEjercicio,
        );
        const porTemario = temariosRaw.map((temario) => ({
            temario_id: Number(temario.id),
            ...resumirEntregas(
                ejerciciosAsignados.filter(
                    (ejercicio) =>
                        Number(ejercicio.temario_id) === Number(temario.id),
                ),
                id,
                entregasPorEstudianteEjercicio,
            ),
        }));

        for (const ejercicio of ejerciciosRaw) {
            if (!estudianteTieneAcceso(ejercicio, id)) continue;
            const estadisticas = estadisticasPorEjercicio.get(
                Number(ejercicio.id),
            );
            if (!estadisticas) continue;
            estadisticas.estudiantesAsignados += 1;

            const entrega = entregasPorEstudianteEjercicio.get(
                `${id}:${Number(ejercicio.id)}`,
            );
            if (!entrega) {
                estadisticas.sinIniciar += 1;
                continue;
            }

            const completado = esVerdadero(entrega.completado);
            const calificado = esVerdadero(entrega.calificado);
            const actividad = fechaIso(entrega.ultima_actividad);
            const iniciada =
                completado ||
                Boolean(entrega.estado_tablero?.trim()) ||
                actividad !== null;
            if (completado) {
                estadisticas.iniciados += 1;
                estadisticas.completados += 1;
            } else if (iniciada) {
                estadisticas.iniciados += 1;
                estadisticas.enProgreso += 1;
            } else {
                estadisticas.sinIniciar += 1;
            }
            if (calificado) {
                estadisticas.calificados += 1;
            } else if (completado) {
                estadisticas.pendientesCalificar += 1;
            }
        }

        return {
            id,
            codigo: estudiante.codigo,
            username: estudiante.username,
            correo: estudiante.correo ?? null,
            fecha_union: inscripcionPorId.get(id) ?? null,
            ...metricas,
            porTemario,
        };
    });

    const tareasPosibles = estudiantes.reduce(
        (total, estudiante) => total + estudiante.ejerciciosTotales,
        0,
    );
    const completados = estudiantes.reduce(
        (total, estudiante) => total + estudiante.completados,
        0,
    );
    const enProgreso = estudiantes.reduce(
        (total, estudiante) => total + estudiante.enProgreso,
        0,
    );
    const pendientesCalificar = estudiantes.reduce(
        (total, estudiante) => total + estudiante.pendientesCalificar,
        0,
    );
    const calificados = estudiantes.reduce(
        (total, estudiante) => total + estudiante.calificados,
        0,
    );

    return {
        grupo: {
            id: Number(grupo.id),
            nombre: grupo.nombre,
            createdAt: grupo.createdAt,
            profesor: {
                id: Number(profesor?.id ?? grupo.profesor_id),
                username: profesor?.username ?? "desconocido",
            },
        },
        resumen: {
            estudiantes: estudiantes.length,
            ejercicios: ejerciciosRaw.length,
            tareasPosibles,
            completados,
            enProgreso,
            sinIniciar: tareasPosibles - completados - enProgreso,
            calificados,
            pendientesCalificar,
            avancePorcentaje: tareasPosibles
                ? Math.round((completados / tareasPosibles) * 100)
                : 0,
        },
        temarios: temariosRaw,
        ejercicios: ejerciciosRaw.map((ejercicio) => ({
            ...ejercicio,
            temario:
                temarioPorId.get(Number(ejercicio.temario_id))?.nombre ?? "",
            estudiantes_asignados_ids:
                ejercicio.asignacion === "seleccionados"
                    ? Array.from(
                          estudiantesPorEjercicio.get(Number(ejercicio.id)) ??
                              new Set<number>(),
                      )
                    : estudianteIds,
            ...estadisticasPorEjercicio.get(Number(ejercicio.id)),
        })),
        estudiantes,
        entregas: entregasAsignadasRaw.map((entrega) => ({
            ejercicio_id: Number(entrega.ejercicio_grupo_id),
            usuario_id: Number(entrega.usuario_id),
            estado_tablero: entrega.estado_tablero,
            completado: esVerdadero(entrega.completado),
            calificado: esVerdadero(entrega.calificado),
            puntos: Number(entrega.puntos ?? 0),
            puntos_profesor:
                entrega.puntos_profesor === null
                    ? null
                    : Number(entrega.puntos_profesor),
            comentario_profesor: entrega.comentario_profesor ?? null,
            fecha_completado: fechaIso(entrega.fecha_completado),
            ultima_actividad: fechaIso(entrega.ultima_actividad),
        })),
    };
};

/** true para completado en cualquiera de sus variantes (true/1/"1"). */
const estaCompletado = (valor: any): boolean =>
    valor === true || valor === 1 || valor === "1";

// Progreso PROPIO del usuario para el dashboard (/usuarios/me/progreso).
// Suma los ejercicios fijos (tabla Juegos, persistidos en Usuario_Juegos)
// y los generados con IA (juegosia + Usuario_JuegosIA).
export const miProgresoEstudiante = async (usuarioId: number) => {
    const usuario = await Usuarios.findByPk(usuarioId);

    if (!usuario) {
        return null;
    }

    const [juegosFijos, progresosFijos, generadosIA, progresosIA] =
        await Promise.all([
            Juegos.findAll({ attributes: ["id"], raw: true }),
            UsuarioJuegos.findAll({
                where: { usuario_id: usuarioId },
                raw: true,
            }),
            JuegosIA.count({ where: { usuario_id: usuarioId } }),
            UsuarioJuegosIA.findAll({
                where: { usuario_id: usuarioId },
                raw: true,
            }),
        ]);

    const idsFijos = new Set(
        (juegosFijos as any[]).map((j) => Number(j.id)),
    );
    const fijosCompletados = (progresosFijos as any[]).filter(
        (p) => idsFijos.has(Number(p.juego_id)) && estaCompletado(p.completado),
    ).length;
    const iaCompletados = (progresosIA as any[]).filter((p) =>
        estaCompletado(p.completado),
    ).length;

    const fijosTotales: number = idsFijos.size;
    const iaGenerados = Number(generadosIA);

    const denominadorTotal = fijosTotales + iaGenerados;
    const progresoTotal =
        denominadorTotal > 0
            ? Number(
                  ((fijosCompletados + iaCompletados) / denominadorTotal).toFixed(
                      2,
                  ),
              )
            : 0;

    return {
        usuario: {
            id: Number(usuario.id),
            codigo: usuario.codigo,
            username: usuario.username,
            correo: usuario.correo ?? null,
            rol: usuario.rol,
        },
        resumen: {
            fijosCompletados,
            fijosTotales,
            iaCompletados,
            iaGenerados,
            progreso: progresoTotal,
        },
    };
};

export const estadisticasGlobales = async () => {
    const [
        estudiantes,
        profesores,
        admins,
        completadosFijos,
        completadosIA,
        puntosFijos,
        puntosIA,
        ultimaFija,
        ultimaIA,
        completadosGrupos,
        puntosGrupos,
        entregasGrupos,
        totalGrupos,
        totalEjerciciosGrupos,
        gruposConActividad,
    ] = await Promise.all([
        Usuarios.count({ where: { rol: "estudiante" } }),
        Usuarios.count({ where: { rol: "profesor" } }),
        Usuarios.count({ where: { rol: "admin" } }),
        UsuarioJuegos.count({ where: { completado: true } }),
        UsuarioJuegosIA.count({ where: { completado: true } }),
        UsuarioJuegos.sum("puntos"),
        UsuarioJuegosIA.sum("puntos"),
        UsuarioJuegos.max("ultima_actividad"),
        UsuarioJuegosIA.max("ultima_actividad"),
        UsuarioEjerciciosGrupo.count({ where: { completado: true } }),
        UsuarioEjerciciosGrupo.sum("puntos_profesor"),
        UsuarioEjerciciosGrupo.findAll({
            attributes: ["completado", "calificado", "ultima_actividad", "fecha_completado"],
            raw: true,
        }),
        Grupo.count(),
        EjerciciosGrupo.count(),
        UsuarioEjerciciosGrupo.max("ultima_actividad"),
    ]);

    const pendientesGrupos = (entregasGrupos as any[]).filter(
        (entrega) =>
            esVerdadero(entrega.completado) &&
            !esVerdadero(entrega.calificado),
    ).length;
    const fechas = [ultimaFija, ultimaIA, gruposConActividad]
        .filter(Boolean)
        .map((f) => new Date(f as any).getTime())
        .filter((t) => !Number.isNaN(t));
    for (const entrega of entregasGrupos as any[]) {
        for (const valor of [
            entrega.ultima_actividad,
            entrega.fecha_completado,
        ]) {
            if (!valor) continue;
            const tiempo = new Date(valor).getTime();
            if (!Number.isNaN(tiempo)) fechas.push(tiempo);
        }
    }

    return {
        usuarios: { estudiantes, profesores, admins },
        completados: {
            fijos: completadosFijos,
            ia: completadosIA,
            grupos: completadosGrupos,
        },
        puntos: {
            fijos: Number(puntosFijos ?? 0),
            ia: Number(puntosIA ?? 0),
            grupos: Number(puntosGrupos ?? 0),
            total:
                Number(puntosFijos ?? 0) +
                Number(puntosIA ?? 0) +
                Number(puntosGrupos ?? 0),
        },
        grupos: {
            total: totalGrupos,
            ejercicios: totalEjerciciosGrupos,
            pendientes: pendientesGrupos,
        },
        ultimaActividad: fechas.length
            ? new Date(Math.max(...fechas)).toISOString()
            : null,
    };
};
