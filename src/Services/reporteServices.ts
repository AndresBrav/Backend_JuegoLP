import { Op } from "sequelize";
import UsuarioJuegos from "../Models/usuario_juegosModel";
import JuegosIA from "../Models/juegos_iaModel";
import UsuarioJuegosIA from "../Models/usuario_juegosIAModel";
import EjerciciosGrupo from "../Models/ejerciciosGrupoModel";
import UsuarioEjerciciosGrupo from "../Models/usuario_ejerciciosGrupoModel";
import Juegos from "../Models/juegoModel";
import Usuarios from "../Models/usuarioModel";
import GrupoEstudiante from "../Models/grupoEstudianteModel";
import Grupo from "../Models/grupoModel";
import { GrupoInstance } from "../Models/grupoModel";
import { esFechaValida } from "../Validations/validaciones";
import { listarEstudiantesDeGrupo } from "./grupoServices";

interface EstudianteBasico {
    id: number;
    codigo: string;
    username: string;
    edad?: number;
}

const sumar = (valores: any[]): number =>
    valores.reduce((total, valor) => total + Number(valor ?? 0), 0);

const estaCompletado = (valor: any): boolean =>
    valor === true || valor === 1 || valor === "1";

const aDia = (valor: any): string | null => {
    if (!valor) return null;
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return null;
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
};

const rangoFechas = (desde?: string, hasta?: string) => {
    const hoy = new Date();

    const fin =
        hasta && esFechaValida(hasta)
            ? new Date(`${hasta}T23:59:59`)
            : new Date(
                  hoy.getFullYear(),
                  hoy.getMonth(),
                  hoy.getDate(),
                  23,
                  59,
                  59,
              );

    const inicio =
        desde && esFechaValida(desde)
            ? new Date(`${desde}T00:00:00`)
            : new Date(fin.getTime() - 29 * 24 * 60 * 60 * 1000);

    const dias: string[] = [];
    const cursor = new Date(
        inicio.getFullYear(),
        inicio.getMonth(),
        inicio.getDate(),
    );
    const limite = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate());

    while (cursor <= limite && dias.length < 92) {
        const dia = aDia(cursor);
        if (dia) dias.push(dia);
        cursor.setDate(cursor.getDate() + 1);
    }

    return { inicio, fin, dias };
};

const resumirEstudiantes = (
    estudiantes: EstudianteBasico[],
    progresos: any[],
    juegosIA: any[],
    totalFijos: number,
) => {
    return estudiantes.map((estudiante) => {
        const propios = progresos.filter(
            (p) => Number(p.usuario_id) === Number(estudiante.id),
        );
        const propiosIA = juegosIA.filter(
            (j) => Number(j.usuario_id) === Number(estudiante.id),
        );

        const fijosCompletados = propios.filter((p) =>
            estaCompletado(p.completado),
        ).length;
        const iaCompletados = propiosIA.filter((j) =>
            estaCompletado(j.completado),
        ).length;

        const puntos =
            sumar(propios.map((p) => p.puntos)) +
            sumar(propiosIA.map((j) => j.puntos));

        const fechas = [
            ...propios
                .filter((p) => estaCompletado(p.completado))
                .map((p) => p.ultima_actividad ?? p.fecha_completado),
            ...propiosIA
                .filter((j) => estaCompletado(j.completado))
                .map((j) => j.ultima_actividad ?? j.fecha_completado),
        ]
            .filter(Boolean)
            .map((f) => new Date(f as any).getTime())
            .filter((t) => !Number.isNaN(t));

        const ultimaActividad = fechas.length
            ? new Date(Math.max(...fechas)).toISOString()
            : null;

        const iaGenerados = propiosIA.length;
        const denominador = totalFijos + iaGenerados;
        const progreso =
            denominador > 0
                ? Number(
                      (
                          (fijosCompletados + iaCompletados) /
                          denominador
                      ).toFixed(2),
                  )
                : 0;

        return {
            id: Number(estudiante.id),
            codigo: estudiante.codigo,
            username: estudiante.username,
            puntos,
            fijosCompletados,
            iaCompletados,
            fijosTotales: totalFijos,
            iaGenerados,
            progreso,
            ultimaActividad,
        };
    });
};

export const reporteGrupo = async (
    grupo: GrupoInstance,
    desde?: string,
    hasta?: string,
) => {
    const grupoId = Number(grupo.id);

    const estudiantes = (await listarEstudiantesDeGrupo(
        grupoId,
    )) as unknown as EstudianteBasico[];

    const idsEstudiantes = estudiantes.map((e) => Number(e.id));

    // Obtener los ejercicios propios del grupo
    const ejerciciosDelGrupo = await EjerciciosGrupo.findAll({
        where: { grupo_id: grupoId },
        attributes: ["id", "titulo", "puntos"],
        raw: true,
    });

    const idsEjercicios = ejerciciosDelGrupo.map((ej) => Number(ej.id));
    const totalEjerciciosGrupo = ejerciciosDelGrupo.length;

    // Obtener las respuestas de los estudiantes en los ejercicios de este grupo
    const respuestasGrupo = idsEjercicios.length && idsEstudiantes.length
        ? await UsuarioEjerciciosGrupo.findAll({
              where: {
                  ejercicio_grupo_id: { [Op.in]: idsEjercicios },
                  usuario_id: { [Op.in]: idsEstudiantes },
              },
              raw: true,
          })
        : [];

    const resumenEstudiantes = estudiantes.map((estudiante) => {
        const idEstudiante = Number(estudiante.id);
        const propias = respuestasGrupo.filter(
            (r) => Number(r.usuario_id) === idEstudiante,
        );

        const completados = propias.filter((r) =>
            estaCompletado(r.completado),
        ).length;

        const puntos = sumar(propias.map((r) => r.puntos));

        const fechas = propias
            .filter((r) => estaCompletado(r.completado))
            .map((r) => r.ultima_actividad ?? r.fecha_completado)
            .filter(Boolean)
            .map((f) => new Date(f as any).getTime())
            .filter((t) => !Number.isNaN(t));

        const ultimaActividad = fechas.length
            ? new Date(Math.max(...fechas)).toISOString()
            : null;

        const progreso =
            totalEjerciciosGrupo > 0
                ? Number((completados / totalEjerciciosGrupo).toFixed(2))
                : 0;

        return {
            id: idEstudiante,
            codigo: estudiante.codigo,
            username: estudiante.username,
            puntos,
            fijosCompletados: completados, // Mantenemos la propiedad por compatibilidad de interfaz
            iaCompletados: 0,
            fijosTotales: totalEjerciciosGrupo,
            iaGenerados: 0,
            ejerciciosGrupoCompletados: completados,
            ejerciciosGrupoTotales: totalEjerciciosGrupo,
            progreso,
            ultimaActividad,
        };
    });

    const { inicio, fin, dias } = rangoFechas(desde, hasta);

    const series = estudiantes.map((estudiante) => {
        const idEstudiante = Number(estudiante.id);
        const eventos = respuestasGrupo
            .filter(
                (r) =>
                    Number(r.usuario_id) === idEstudiante &&
                    estaCompletado(r.completado),
            )
            .map((r) => aDia(r.fecha_completado ?? r.ultima_actividad))
            .filter(Boolean) as string[];

        let acumulado = 0;

        const valores = dias.map((dia) => {
            acumulado += eventos.filter((evento) => evento === dia).length;
            return acumulado;
        });

        return {
            estudiante_id: idEstudiante,
            codigo: estudiante.codigo,
            username: estudiante.username,
            acumulado: valores,
        };
    });

    const completadosEnRango = respuestasGrupo.filter(
        (r) =>
            estaCompletado(r.completado) &&
            (r.fecha_completado ?? r.ultima_actividad) &&
            new Date(r.fecha_completado ?? r.ultima_actividad) >= inicio &&
            new Date(r.fecha_completado ?? r.ultima_actividad) <= fin,
    ).length;

    return {
        grupo: {
            id: grupo.id,
            nombre: grupo.nombre,
            codigo: grupo.codigo,
        },
        rango: {
            desde: dias[0] ?? null,
            hasta: dias[dias.length - 1] ?? null,
        },
        resumen: {
            estudiantes: resumenEstudiantes.length,
            promedioPuntos: resumenEstudiantes.length
                ? Math.round(
                      sumar(resumenEstudiantes.map((e) => e.puntos)) /
                          resumenEstudiantes.length,
                  )
                : 0,
            promedioProgreso: resumenEstudiantes.length
                ? Number(
                      (
                          sumar(resumenEstudiantes.map((e) => e.progreso)) /
                          resumenEstudiantes.length
                      ).toFixed(2),
                  )
                : 0,
            completadosEnRango,
        },
        estudiantes: resumenEstudiantes,
        evolucion: {
            fechas: dias,
            series,
        },
    };
};

export const reporteEstudiante = async (usuarioId: number) => {
    const usuario = await Usuarios.findByPk(usuarioId);

    if (!usuario) {
        return null;
    }

    const [juegos, progresos, juegosIA, progresosIA] = await Promise.all([
        Juegos.findAll({
            attributes: ["id", "nombre_juego", "nivel_juego"],
            order: [["id", "ASC"]],
            raw: true,
        }),
        UsuarioJuegos.findAll({
            where: { usuario_id: usuarioId },
            raw: true,
        }),
        JuegosIA.findAll({
            where: { usuario_id: usuarioId },
            raw: true,
        }),
        UsuarioJuegosIA.findAll({
            where: { usuario_id: usuarioId },
            raw: true,
        }),
    ]);

    const progresoPorJuego = new Map<number, any>();
    (progresos as any[]).forEach((p) => {
        progresoPorJuego.set(Number(p.juego_id), p);
    });

    const progresoPorJuegoIA = new Map<number, any>();
    (progresosIA as any[]).forEach((p) => {
        progresoPorJuegoIA.set(Number(p.juego_ia_id), p);
    });

    const ejercicios = (juegos as any[]).map((juego) => {
        const progreso = progresoPorJuego.get(Number(juego.id));

        return {
            juego_id: Number(juego.id),
            nombre: juego.nombre_juego,
            nivel: Number(juego.nivel_juego),
            completado: progreso
                ? estaCompletado(progreso.completado)
                : false,
            puntos: progreso ? Number(progreso.puntos ?? 0) : 0,
            intentos: progreso ? Number(progreso.intentos ?? 0) : 0,
            fecha_completado: progreso?.fecha_completado
                ? new Date(progreso.fecha_completado).toISOString()
                : null,
            ultima_actividad: progreso?.ultima_actividad
                ? new Date(progreso.ultima_actividad).toISOString()
                : null,
        };
    });

    const ia = (juegosIA as any[]).map((juego) => {
        const prog = progresoPorJuegoIA.get(Number(juego.id));
        const completado = prog ? estaCompletado(prog.completado) : false;
        return {
            id: Number(juego.id),
            descripcion: juego.descripcion,
            tipo: juego.tipo_juego,
            completado,
            puntos: prog ? Number(prog.puntos ?? 0) : 0,
            fecha_completado:
                completado && (prog?.fecha_completado ?? prog?.ultima_actividad)
                    ? new Date(
                          prog.fecha_completado ?? prog.ultima_actividad,
                      ).toISOString()
                    : null,
        };
    });

    const eventos = [
        ...(progresos as any[])
            .filter((p) => estaCompletado(p.completado) && p.fecha_completado)
            .map((p) => ({
                fecha: aDia(p.fecha_completado),
                puntos: Number(p.puntos ?? 0),
            })),
        ...(progresosIA as any[])
            .filter(
                (j) =>
                    estaCompletado(j.completado) &&
                    (j.fecha_completado ?? j.ultima_actividad),
            )
            .map((j) => ({
                fecha: aDia(j.fecha_completado ?? j.ultima_actividad),
                puntos: Number(j.puntos ?? 0),
            })),
    ].filter((evento) => evento.fecha) as { fecha: string; puntos: number }[];

    const porDia = new Map<string, { completados: number; puntos: number }>();

    eventos.forEach((evento) => {
        const actual = porDia.get(evento.fecha) ?? {
            completados: 0,
            puntos: 0,
        };
        actual.completados += 1;
        actual.puntos += evento.puntos;
        porDia.set(evento.fecha, actual);
    });

    const actividadPorDia = Array.from(porDia.entries())
        .map(([fecha, datos]) => ({ fecha, ...datos }))
        .sort((a, b) => a.fecha.localeCompare(b.fecha));

    const fijosCompletados = ejercicios.filter((e) => e.completado).length;
    const iaCompletados = ia.filter((j) => j.completado).length;
    const puntos =
        sumar(ejercicios.map((e) => e.puntos)) +
        sumar(ia.map((j) => j.puntos));
    const denominador = juegos.length + ia.length;

    return {
        usuario: {
            id: Number(usuario.id),
            codigo: usuario.codigo,
            username: usuario.username,
            edad: usuario.edad,
            rol: usuario.rol,
        },
        resumen: {
            puntos,
            fijosCompletados,
            fijosTotales: juegos.length,
            iaCompletados,
            iaGenerados: ia.length,
            progreso:
                denominador > 0
                    ? Number(
                          (
                              (fijosCompletados + iaCompletados) /
                              denominador
                          ).toFixed(2),
                      )
                    : 0,
        },
        ejercicios,
        ia,
        actividadPorDia,
    };
};

export const estadisticasGlobales = async () => {
    const [
        estudiantes,
        profesores,
        admins,
        grupos,
        matriculas,
        completadosFijos,
        completadosIA,
        puntosFijos,
        puntosIA,
        ultimaFija,
        ultimaIA,
    ] = await Promise.all([
        Usuarios.count({ where: { rol: "estudiante" } }),
        Usuarios.count({ where: { rol: "profesor" } }),
        Usuarios.count({ where: { rol: "admin" } }),
        Grupo.count(),
        GrupoEstudiante.count(),
        UsuarioJuegos.count({ where: { completado: true } }),
        UsuarioJuegosIA.count({ where: { completado: true } }),
        UsuarioJuegos.sum("puntos"),
        UsuarioJuegosIA.sum("puntos"),
        UsuarioJuegos.max("ultima_actividad"),
        UsuarioJuegosIA.max("ultima_actividad"),
    ]);

    const totalGrupos = Number(grupos ?? 0);

    const fechas = [ultimaFija, ultimaIA]
        .filter(Boolean)
        .map((f) => new Date(f as any).getTime())
        .filter((t) => !Number.isNaN(t));

    return {
        usuarios: { estudiantes, profesores, admins },
        grupos: totalGrupos,
        matriculas,
        completados: { fijos: completadosFijos, ia: completadosIA },
        puntos: {
            fijos: Number(puntosFijos ?? 0),
            ia: Number(puntosIA ?? 0),
            total: Number(puntosFijos ?? 0) + Number(puntosIA ?? 0),
        },
        ultimaActividad: fechas.length
            ? new Date(Math.max(...fechas)).toISOString()
            : null,
    };
};
