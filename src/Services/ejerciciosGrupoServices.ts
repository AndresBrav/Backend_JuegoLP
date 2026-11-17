import EjerciciosGrupo from "../Models/ejerciciosGrupoModel";
import UsuarioEjerciciosGrupo from "../Models/usuario_ejerciciosGrupoModel";
import Grupo from "../Models/grupoModel";
import GrupoEstudiantes from "../Models/grupoEstudianteModel";
import Usuarios from "../Models/usuarioModel";
import Notificaciones from "../Models/NotificacionesModel";
import {
    esMiembroDeGrupo,
} from "./grupoServices";
import { temarioDelProfesor, esErrorNegocio } from "./temariosGrupoServices";

export type TipoEjercicioGrupo = "diagrama" | "pseudocodigo";

export { esErrorNegocio };

/** ¿El ejercicio ya pasó su fecha límite? (NULL = sin límite). */
export const estaVencido = (ejercicio: {
    fecha_limite?: string | null;
}): boolean => {
    if (!ejercicio.fecha_limite) return false;
    const hoy = new Date().toISOString().slice(0, 10);
    return ejercicio.fecha_limite < hoy;
};

/** Valida tipo de ejercicio. */
export const esTipoEjercicioValido = (
    tipo: any,
): tipo is TipoEjercicioGrupo => tipo === "diagrama" || tipo === "pseudocodigo";

/** Fecha DATEONLY válida YYYY-MM-DD (o null para "sin límite"). */
const validarFechaLimite = (fecha: any): string | null => {
    if (fecha === null || fecha === undefined || fecha === "") return null;
    if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        throw new Error("La fecha límite debe tener formato YYYY-MM-DD");
    }
    return fecha;
};

/** Grupo del ejercicio validando que pertenezca al profesor. */
const grupoDelProfesor = async (grupoId: number, profesorId: number) => {
    const grupo = (await Grupo.findOne({
        where: { id: grupoId, profesor_id: profesorId },
        raw: true,
    })) as unknown as { id: number; codigo: string; nombre: string } | null;

    if (!grupo) {
        throw new Error("El grupo no existe o no te pertenece");
    }
    return grupo;
};

/**
 * CADENA COMPLETA de pertenencia: ejercicio → grupo → dueño.
 * Devuelve el ejercicio (raw) o lanza. Es el sello anti-entregas
 * cruzadas: todo acceso pasa por aquí o por su variante de estudiante.
 */
export const ejercicioDelProfesor = async (
    ejercicioId: number,
    profesorId: number,
) => {
    const ejercicio = (await EjerciciosGrupo.findByPk(ejercicioId, {
        raw: true,
    })) as unknown as EjerciciosGrupoAttributesRaw | null;

    if (!ejercicio) {
        throw new Error("El ejercicio no existe");
    }

    await grupoDelProfesor(ejercicio.grupo_id, profesorId);
    return ejercicio;
};

interface EjerciciosGrupoAttributesRaw {
    id: number;
    grupo_id: number;
    temario_id: number;
    titulo: string;
    enunciado: string;
    tipo: TipoEjercicioGrupo;
    puntos: number;
    fecha_limite: string | null;
    createdAt: Date;
    updatedAt: Date;
}

/** Profesor: crea un ejercicio dentro de un temario de su grupo y
 * notifica a los estudiantes inscritos. */
export const crearEjercicioGrupo = async (
    profesorId: number,
    datos: {
        grupo_id: number;
        temario_id: number;
        titulo: any;
        enunciado: any;
        tipo: any;
        puntos: any;
        fecha_limite: any;
    },
) => {
    const { grupo_id, temario_id, titulo, enunciado, tipo, puntos } = datos;

    if (!isNumeroEntero(grupo_id) || !isNumeroEntero(temario_id)) {
        throw new Error("Faltan el grupo o el temario del ejercicio");
    }

    // temarioDelProfesor ya valida la cadena temario → grupo → dueño.
    const temario = await temarioDelProfesor(temario_id, profesorId);

    if (temario.grupo_id !== Number(grupo_id)) {
        throw new Error("El temario no pertenece a ese grupo");
    }

    if (!titulo || typeof titulo !== "string" || titulo.trim().length < 3) {
        throw new Error("El título debe tener al menos 3 caracteres");
    }

    if (
        !enunciado ||
        typeof enunciado !== "string" ||
        enunciado.trim().length < 3
    ) {
        throw new Error("El enunciado es obligatorio");
    }

    if (!esTipoEjercicioValido(tipo)) {
        throw new Error("El tipo debe ser 'diagrama' o 'pseudocodigo'");
    }

    const puntosFinal = puntos === undefined ? 5 : Number(puntos);
    if (!Number.isInteger(puntosFinal) || puntosFinal < 0 || puntosFinal > 100) {
        throw new Error("Los puntos deben ser un entero entre 0 y 100");
    }

    const fechaLimite = validarFechaLimite(datos.fecha_limite);

    const ejercicio = await EjerciciosGrupo.create({
        grupo_id,
        temario_id,
        titulo: titulo.trim(),
        enunciado: enunciado.trim(),
        tipo,
        puntos: puntosFinal,
        fecha_limite: fechaLimite,
    });

    // Notificación a los estudiantes inscritos en el grupo.
    const inscripciones = (await GrupoEstudiantes.findAll({
        where: { grupo_id },
        attributes: ["usuario_id"],
        raw: true,
    })) as unknown as Array<{ usuario_id: number }>;

    await Promise.all(
        inscripciones.map((i) =>
            Notificaciones.create({
                descripcion: `Nuevo ejercicio de ${tipo}: "${titulo.trim()}"${
                    fechaLimite ? ` (hasta el ${fechaLimite})` : ""
                }`,
                usuario_id: i.usuario_id,
            }),
        ),
    );

    return ejercicio;
};

const isNumeroEntero = (v: any): boolean =>
    Number.isInteger(Number(v)) && v !== "" && v !== null;

/** Profesor: ejercicios de su grupo con cuántos estudiantes los
 * completaron (cuenta por fila de entrega del PAR exacto). */
export const listarEjerciciosProfesor = async (grupoId: number) => {
    const ejercicios = (await EjerciciosGrupo.findAll({
        where: { grupo_id: grupoId },
        order: [["createdAt", "ASC"]],
        raw: true,
    })) as unknown as EjerciciosGrupoAttributesRaw[];

    return Promise.all(
        ejercicios.map(async (e) => ({
            ...e,
            completados: await UsuarioEjerciciosGrupo.count({
                where: { ejercicio_grupo_id: e.id, completado: true },
            }),
            entregas: await UsuarioEjerciciosGrupo.count({
                where: { ejercicio_grupo_id: e.id },
            }),
        })),
    );
};

/** Profesor: edita título/enunciado/tipo/puntos/fecha límite. */
export const editarEjercicioGrupo = async (
    ejercicioId: number,
    profesorId: number,
    datos: {
        titulo?: any;
        enunciado?: any;
        tipo?: any;
        puntos?: any;
        fecha_limite?: any;
        temario_id?: any;
    },
) => {
    const ejercicio = await ejercicioDelProfesor(ejercicioId, profesorId);
    const cambios: Record<string, unknown> = {};

    if (datos.titulo !== undefined) {
        if (
            !datos.titulo ||
            typeof datos.titulo !== "string" ||
            datos.titulo.trim().length < 3
        ) {
            throw new Error("El título debe tener al menos 3 caracteres");
        }
        cambios.titulo = datos.titulo.trim();
    }

    if (datos.enunciado !== undefined) {
        if (
            !datos.enunciado ||
            typeof datos.enunciado !== "string" ||
            datos.enunciado.trim().length < 3
        ) {
            throw new Error("El enunciado es obligatorio");
        }
        cambios.enunciado = datos.enunciado.trim();
    }

    if (datos.tipo !== undefined) {
        if (!esTipoEjercicioValido(datos.tipo)) {
            throw new Error("El tipo debe ser 'diagrama' o 'pseudocodigo'");
        }
        cambios.tipo = datos.tipo;
    }

    if (datos.puntos !== undefined) {
        const p = Number(datos.puntos);
        if (!Number.isInteger(p) || p < 0 || p > 100) {
            throw new Error("Los puntos deben ser un entero entre 0 y 100");
        }
        cambios.puntos = p;
    }

    if (datos.fecha_limite !== undefined) {
        cambios.fecha_limite = validarFechaLimite(datos.fecha_limite);
    }

    if (datos.temario_id !== undefined) {
        const temario = await temarioDelProfesor(datos.temario_id, profesorId);
        if (temario.grupo_id !== ejercicio.grupo_id) {
            throw new Error("El temario no pertenece a ese grupo");
        }
        cambios.temario_id = Number(datos.temario_id);
    }

    if (Object.keys(cambios).length === 0) {
        throw new Error("No se proporcionaron campos para actualizar");
    }

    await EjerciciosGrupo.update(cambios, { where: { id: ejercicioId } });
};

/** Profesor: elimina el ejercicio (en cascada sus entregas). */
export const eliminarEjercicioGrupo = async (
    ejercicioId: number,
    profesorId: number,
) => {
    await ejercicioDelProfesor(ejercicioId, profesorId);
    await EjerciciosGrupo.destroy({ where: { id: ejercicioId } });
};

/** Profesor: TODAS las entregas de un ejercicio (una fila por
 * estudiante: el índice único garantiza la fila única por par). */
export const listarSolucionesEjercicio = async (
    ejercicioId: number,
    profesorId: number,
) => {
    await ejercicioDelProfesor(ejercicioId, profesorId);

    const entregas = (await UsuarioEjerciciosGrupo.findAll({
        where: { ejercicio_grupo_id: ejercicioId },
        order: [["ultima_actividad", "DESC"]],
        raw: true,
    })) as unknown as Array<{
        id: number;
        usuario_id: number;
        estado_tablero: string | null;
        completado: boolean;
        puntos: number;
        calificado: boolean;
        puntos_profesor: number | null;
        comentario_profesor: string | null;
        fecha_completado: Date | null;
        ultima_actividad: Date | null;
    }>;

    return Promise.all(
        entregas.map(async (e) => {
            const u = (await Usuarios.findByPk(e.usuario_id, {
                attributes: ["id", "codigo", "username"],
                raw: true,
            })) as unknown as {
                id: number;
                codigo: string;
                username: string;
            } | null;

            return {
                ...e,
                estudiante: u ?? {
                    id: e.usuario_id,
                    codigo: "",
                    username: "desconocido",
                },
            };
        }),
    );
};

/** Profesor: califica la entrega de UN estudiante en UN ejercicio.
 * El par (ejercicio, estudiante) es explícito: los puntos y la
 * calificación caen SOLO en esa fila, nunca en otro ejercicio. */
export const calificarEntrega = async (
    ejercicioId: number,
    profesorId: number,
    estudianteId: number,
    puntosProfesor: any,
    comentario: any,
) => {
    const ejercicio = await ejercicioDelProfesor(ejercicioId, profesorId);

    if (!isNumeroEntero(estudianteId)) {
        throw new Error("Falta el estudiante");
    }

    const inscrito = await esMiembroDeGrupo(
        ejercicio.grupo_id,
        Number(estudianteId),
    );

    if (!inscrito) {
        throw new Error("Ese estudiante no está inscrito en el grupo");
    }

    const puntos = Number(puntosProfesor ?? 0);
    if (!Number.isInteger(puntos) || puntos < 0 || puntos > 100) {
        throw new Error("Los puntos de calificación deben ser 0 a 100");
    }

    if (comentario !== undefined && comentario !== null && typeof comentario !== "string") {
        throw new Error("El comentario debe ser texto");
    }

    // findOrCreate sobre el PAR: si el estudiante nunca abrió el
    // ejercicio, la calificación crea SU fila (solo la de este par).
    const [entrega, creada] = await UsuarioEjerciciosGrupo.findOrCreate({
        where: {
            ejercicio_grupo_id: ejercicioId,
            usuario_id: Number(estudianteId),
        },
        defaults: {
            estado_tablero: null,
            completado: false,
            puntos: 0,
            calificado: false,
        },
    });

    await entrega.update({
        calificado: true,
        puntos_profesor: puntos,
        comentario_profesor:
            comentario === undefined ? entrega.comentario_profesor : comentario,
    });

    if (!creada) {
        // noop: la fila ya existía, solo se calificó.
    }

    await Notificaciones.create({
        descripcion: `Tu entrega de "${ejercicio.titulo}" fue calificada: ${puntos} pts${
            comentario ? " — con comentario del profesor" : ""
        }`,
        usuario_id: Number(estudianteId),
    });

    return entrega;
};

/** Profesor: guarda/actualiza SOLO el comentario de la entrega. */
export const guardarComentarioEntrega = async (
    ejercicioId: number,
    profesorId: number,
    estudianteId: number,
    comentario: any,
) => {
    if (comentario === undefined || comentario === null || typeof comentario !== "string") {
        throw new Error("El comentario debe ser texto");
    }

    const ejercicio = await ejercicioDelProfesor(ejercicioId, profesorId);

    const entrega = await UsuarioEjerciciosGrupo.findOne({
        where: {
            ejercicio_grupo_id: ejercicioId,
            usuario_id: Number(estudianteId),
        },
    });

    if (!entrega) {
        throw new Error("Ese estudiante no ha abierto aún este ejercicio");
    }

    await entrega.update({ comentario_profesor: comentario });

    return entrega;
};

/** Estudiante: lista los ejercicios de SU grupo con SU estado
 * (la fila del par ejercicio+estudiante; los demás no intervienen). */
export const listarEjerciciosEstudiante = async (
    grupoId: number,
    estudianteId: number,
) => {
    const inscrito = await esMiembroDeGrupo(grupoId, estudianteId);

    if (!inscrito) {
        throw new Error("No estás inscrito en ese grupo");
    }

    const ejercicios = (await EjerciciosGrupo.findAll({
        where: { grupo_id: grupoId },
        order: [["createdAt", "ASC"]],
        raw: true,
    })) as unknown as EjerciciosGrupoAttributesRaw[];

    const misEntregas = (await UsuarioEjerciciosGrupo.findAll({
        where: { usuario_id: estudianteId },
        attributes: [
            "ejercicio_grupo_id",
            "completado",
            "calificado",
            "puntos",
            "puntos_profesor",
        ],
        raw: true,
    })) as unknown as Array<{
        ejercicio_grupo_id: number;
        completado: boolean;
        calificado: boolean;
        puntos: number;
        puntos_profesor: number | null;
    }>;

    return ejercicios.map((e) => {
        const mia = misEntregas.find(
            (m) => m.ejercicio_grupo_id === e.id,
        );
        return {
            ...e,
            vencido: estaVencido(e),
            mi_entrega: mia
                ? {
                      completado: mia.completado,
                      calificado: mia.calificado,
                      puntos: mia.puntos,
                      puntos_profesor: mia.puntos_profesor,
                  }
                : {
                      completado: false,
                      calificado: false,
                      puntos: 0,
                      puntos_profesor: null,
                  },
        };
    });
};

/** Estudiante: abre un ejercicio de su grupo (crea SU fila de entrega
 * si no existía; la fila es única por el índice de la migración). */
export const obtenerEjercicioEstudiante = async (
    grupoId: number,
    ejercicioId: number,
    estudianteId: number,
) => {
    const inscrito = await esMiembroDeGrupo(grupoId, estudianteId);

    if (!inscrito) {
        throw new Error("No estás inscrito en ese grupo");
    }

    const ejercicio = (await EjerciciosGrupo.findOne({
        where: { id: ejercicioId, grupo_id: grupoId },
        raw: true,
    })) as unknown as EjerciciosGrupoAttributesRaw | null;

    if (!ejercicio) {
        throw new Error("El ejercicio no existe en ese grupo");
    }

    const [entrega] = await UsuarioEjerciciosGrupo.findOrCreate({
        where: { ejercicio_grupo_id: ejercicioId, usuario_id: estudianteId },
        defaults: {
            estado_tablero: null,
            completado: false,
            puntos: 0,
            calificado: false,
        },
    });

    return {
        ejercicio,
        vencido: estaVencido(ejercicio),
        entrega: {
            estado_tablero: entrega.estado_tablero,
            completado: entrega.completado,
            calificado: entrega.calificado,
            puntos: entrega.puntos,
            puntos_profesor: entrega.puntos_profesor,
            comentario_profesor: entrega.comentario_profesor,
        },
    };
};

/** Estudiante: autoguarda el estado del tablero de SU ejercicio.
 * Rechaza si el ejercicio está vencido (ver pero no enviar). */
export const guardarEstadoEjercicio = async (
    grupoId: number,
    ejercicioId: number,
    estudianteId: number,
    estadoTablero: any,
) => {
    if (typeof estadoTablero !== "string") {
        throw new Error("El estado del tablero es obligatorio");
    }

    const ejercicio = (await EjerciciosGrupo.findOne({
        where: { id: ejercicioId, grupo_id: grupoId },
        raw: true,
    })) as unknown as EjerciciosGrupoAttributesRaw | null;

    if (!ejercicio) {
        throw new Error("El ejercicio no existe en ese grupo");
    }

    const inscrito = await esMiembroDeGrupo(grupoId, estudianteId);
    if (!inscrito) {
        throw new Error("No estás inscrito en ese grupo");
    }

    if (estaVencido(ejercicio)) {
        throw new Error(
            `FECHA_LIMITE_VENCIDA: el ejercicio venció el ${ejercicio.fecha_limite}, ya no puedes guardarlo`,
        );
    }

    const [entrega] = await UsuarioEjerciciosGrupo.findOrCreate({
        where: { ejercicio_grupo_id: ejercicioId, usuario_id: estudianteId },
        defaults: {
            estado_tablero: estadoTablero,
            completado: false,
            puntos: 0,
            ultima_actividad: new Date(),
        },
    });

    if (!entrega.completado) {
        await entrega.update({
            estado_tablero: estadoTablero,
            ultima_actividad: new Date(),
        });
    } else {
        // Ya completado: se conserva la entrega; solo marca actividad.
        await entrega.update({ ultima_actividad: new Date() });
    }

    return { guardado: true };
};

/** Estudiante: entrega SU ejercicio. La entrega NO otorga puntos:
 * solo marca `completado` (el profesor califica con puntos_profesor).
 * Vencido → rechazo. */
export const completarEjercicioEstudiante = async (
    grupoId: number,
    ejercicioId: number,
    estudianteId: number,
    estadoTablero: any,
) => {
    const ejercicio = (await EjerciciosGrupo.findOne({
        where: { id: ejercicioId, grupo_id: grupoId },
        raw: true,
    })) as unknown as EjerciciosGrupoAttributesRaw | null;

    if (!ejercicio) {
        throw new Error("El ejercicio no existe en ese grupo");
    }

    const inscrito = await esMiembroDeGrupo(grupoId, estudianteId);
    if (!inscrito) {
        throw new Error("No estás inscrito en ese grupo");
    }

    if (estaVencido(ejercicio)) {
        throw new Error(
            `FECHA_LIMITE_VENCIDA: el ejercicio venció el ${ejercicio.fecha_limite}, ya no puedes entregarlo`,
        );
    }

    if (estadoTablero !== undefined && estadoTablero !== null) {
        if (typeof estadoTablero !== "string") {
            throw new Error("El estado del tablero es inválido");
        }
    }

    const [entrega] = await UsuarioEjerciciosGrupo.findOrCreate({
        where: { ejercicio_grupo_id: ejercicioId, usuario_id: estudianteId },
        defaults: {
            estado_tablero: null,
            completado: false,
            puntos: 0,
        },
    });

    if (entrega.completado) {
        // Reentrega: solo se actualiza el estado; sin puntos.
        await entrega.update({
            estado_tablero:
                typeof estadoTablero === "string"
                    ? estadoTablero
                    : entrega.estado_tablero,
            ultima_actividad: new Date(),
        });
        return {
            completado: true,
            puntosGanados: 0,
            puntos: entrega.puntos,
        };
    }

    // La entrega no otorga puntos: los puntos los pone el profesor
    // al calificar (puntos_profesor). La columna `puntos` queda en 0.
    await entrega.update({
        estado_tablero:
            typeof estadoTablero === "string"
                ? estadoTablero
                : entrega.estado_tablero,
        completado: true,
        fecha_completado: new Date(),
        ultima_actividad: new Date(),
    });

    return {
        completado: true,
        puntosGanados: 0,
        puntos: entrega.puntos,
    };
};

/** Ranking del grupo: por cada inscrito, puntos SOLO de la calificación
 * del profesor (`puntos_profesor`) y ejercicios completados. Ambos roles
 * pueden consultarlo (profesor dueño o inscrito). */
export const obtenerRankingGrupo = async (
    grupoId: number,
    solicitanteId: number,
) => {
    const grupo = (await Grupo.findByPk(grupoId, {
        raw: true,
    })) as unknown as {
        id: number;
        nombre: string;
        profesor_id: number;
    } | null;

    if (!grupo) {
        throw new Error("El grupo no existe");
    }

    const esProfesor = grupo.profesor_id === solicitanteId;
    const inscrito = await esMiembroDeGrupo(grupoId, solicitanteId);

    if (!esProfesor && !inscrito) {
        throw new Error("No tienes acceso al ranking de este grupo");
    }

    const inscripciones = (await GrupoEstudiantes.findAll({
        where: { grupo_id: grupoId },
        attributes: ["usuario_id"],
        raw: true,
    })) as unknown as Array<{ usuario_id: number }>;

    const filas = await Promise.all(
        inscripciones.map(async (i) => {
            const u = (await Usuarios.findByPk(i.usuario_id, {
                attributes: ["id", "codigo", "username"],
                raw: true,
            })) as unknown as {
                id: number;
                codigo: string;
                username: string;
            } | null;

            const entregas = (await UsuarioEjerciciosGrupo.findAll({
                where: { usuario_id: i.usuario_id },
                attributes: [
                    "ejercicio_grupo_id",
                    "completado",
                    "puntos",
                    "puntos_profesor",
                ],
                raw: true,
            })) as unknown as Array<{
                ejercicio_grupo_id: number;
                completado: boolean;
                puntos: number;
                puntos_profesor: number | null;
            }>;

            // Solo cuentan las entregas de ejercicios DE ESTE grupo.
            const ejerciciosGrupo = (await EjerciciosGrupo.findAll({
                where: { grupo_id: grupoId },
                attributes: ["id"],
                raw: true,
            })) as unknown as Array<{ id: number }>;
            const idsGrupo = new Set(ejerciciosGrupo.map((e) => e.id));

            const delGrupo = entregas.filter((e) =>
                idsGrupo.has(e.ejercicio_grupo_id),
            );

            const completados = delGrupo.filter((e) => e.completado).length;
            // La única fuente de puntos en grupos es la calificación del
            // profesor; la columna `puntos` de la entrega no suma.
            const puntos = delGrupo.reduce(
                (acc, e) => acc + Number(e.puntos_profesor ?? 0),
                0,
            );

            return {
                estudiante: u
                    ? { id: u.id, codigo: u.codigo, username: u.username }
                    : { id: i.usuario_id, codigo: "", username: "desconocido" },
                completados,
                puntos,
            };
        }),
    );

    return {
        grupo: { id: grupo.id, nombre: grupo.nombre },
        ranking: filas.sort(
            (a, b) => b.puntos - a.puntos || a.estudiante.username.localeCompare(b.estudiante.username),
        ),
    };
};
