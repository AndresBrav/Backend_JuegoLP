import EjerciciosGrupo from "../Models/ejerciciosGrupoModel";
import UsuarioEjerciciosGrupo from "../Models/usuario_ejerciciosGrupoModel";
import Grupo from "../Models/grupoModel";
import GrupoEstudiantes from "../Models/grupoEstudianteModel";
import Usuarios from "../Models/usuarioModel";
import Notificaciones from "../Models/NotificacionesModel";
import EjercicioGrupoEstudiante from "../Models/ejercicioGrupoEstudianteModel";
import db from "../db/conexion";
import { Op } from "sequelize";
import { esMiembroDeGrupo } from "./grupoServices";
import { Rol } from "../interfaces/Usuario";
import { temarioDelProfesor, esErrorNegocio } from "./temariosGrupoServices";

export type TipoEjercicioGrupo = "diagrama" | "pseudocodigo";

export interface CasoPruebaGrupo {
    entradas: string[];
    salidas_esperadas: string[];
}

export interface ResultadoCasoPruebaGrupo {
    indice: number;
    aprobado: boolean;
    salida_obtenida: string[];
    error: string | null;
}

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
    asignacion: "todos" | "seleccionados";
    puntos: number;
    fecha_limite: string | null;
    casos_prueba: CasoPruebaGrupo[] | null;
    createdAt: Date;
    updatedAt: Date;
}

const MAX_CASOS_PRUEBA = 20;
const MAX_LINEAS_CASO = 20;
const MAX_LONGITUD_LINEA_CASO = 500;

const validarLineasCaso = (valor: any, campo: string): string[] => {
    if (!Array.isArray(valor) || valor.length > MAX_LINEAS_CASO) {
        throw new Error(
            `${campo} debe ser una lista de hasta ${MAX_LINEAS_CASO} líneas`,
        );
    }

    return valor.map((linea, indice) => {
        if (
            typeof linea !== "string" ||
            linea.length > MAX_LONGITUD_LINEA_CASO
        ) {
            throw new Error(
                `${campo}, línea ${indice + 1}: debe ser texto de hasta ${MAX_LONGITUD_LINEA_CASO} caracteres`,
            );
        }
        return linea;
    });
};

const validarCasosPrueba = (valor: any): CasoPruebaGrupo[] => {
    if (valor === undefined || valor === null) return [];
    if (!Array.isArray(valor) || valor.length > MAX_CASOS_PRUEBA) {
        throw new Error(
            `Los casos de prueba deben ser una lista de hasta ${MAX_CASOS_PRUEBA} casos`,
        );
    }

    const casos = valor.map((caso, indice) => {
        if (!caso || typeof caso !== "object" || Array.isArray(caso)) {
            throw new Error(`El caso de prueba ${indice + 1} es inválido`);
        }
        const entradas = validarLineasCaso(
            caso.entradas,
            `Entradas del caso ${indice + 1}`,
        );
        const salidasEsperadas = validarLineasCaso(
            caso.salidas_esperadas,
            `Salidas del caso ${indice + 1}`,
        );
        if (salidasEsperadas.length === 0) {
            throw new Error(
                `El caso de prueba ${indice + 1} debe tener al menos una salida esperada`,
            );
        }
        return {
            entradas,
            salidas_esperadas: salidasEsperadas,
        };
    });

    if (JSON.stringify(casos).length > 50000) {
        throw new Error("Los casos de prueba exceden el tamaño permitido");
    }
    return casos;
};

const validarResultadosCasosPrueba = (
    valor: any,
    casos: CasoPruebaGrupo[],
): ResultadoCasoPruebaGrupo[] | null => {
    if (valor === undefined || valor === null) return null;
    if (!Array.isArray(valor) || valor.length !== casos.length) {
        throw new Error("El resultado de los casos de prueba es inválido");
    }

    const resultados = valor.map((resultado, indice) => {
        if (
            !resultado ||
            typeof resultado !== "object" ||
            resultado.indice !== indice ||
            typeof resultado.aprobado !== "boolean"
        ) {
            throw new Error("El resultado de los casos de prueba es inválido");
        }
        const salidaObtenida = validarLineasCaso(
            resultado.salida_obtenida,
            `Salida obtenida del caso ${indice + 1}`,
        );
        const error =
            resultado.error === undefined || resultado.error === null
                ? null
                : resultado.error;
        if (
            error !== null &&
            (typeof error !== "string" || error.length > 500)
        ) {
            throw new Error("El mensaje de error del caso de prueba es inválido");
        }
        return {
            indice,
            aprobado: resultado.aprobado,
            salida_obtenida: salidaObtenida,
            error,
        };
    });

    if (JSON.stringify(resultados).length > 50000) {
        throw new Error("El reporte de los casos de prueba excede el tamaño permitido");
    }
    return resultados;
};

/** Profesor: crea un ejercicio y notifica a sus destinatarios actuales. */
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
        casos_prueba?: any;
        asignacion?: any;
        estudiantes_ids?: any;
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
    const casosPrueba = validarCasosPrueba(datos.casos_prueba);
    const asignacion =
        datos.asignacion === undefined ? "todos" : datos.asignacion;
    if (asignacion !== "todos" && asignacion !== "seleccionados") {
        throw new Error("La asignación del ejercicio es inválida");
    }

    let estudiantesIds: number[] = [];
    if (asignacion === "seleccionados") {
        if (
            !Array.isArray(datos.estudiantes_ids) ||
            datos.estudiantes_ids.length === 0 ||
            datos.estudiantes_ids.some(
                (id: any) =>
                    typeof id !== "number" ||
                    !Number.isSafeInteger(id) ||
                    id < 1,
            )
        ) {
            throw new Error("Debes seleccionar al menos un estudiante válido");
        }
        estudiantesIds = datos.estudiantes_ids.map(Number);
        if (new Set(estudiantesIds).size !== estudiantesIds.length) {
            throw new Error(
                "La lista de estudiantes seleccionados está repetida",
            );
        }
    }

    return db.transaction(async (transaction) => {
        let destinatariosIds: number[];
        if (asignacion === "seleccionados") {
            const [inscripciones, usuariosEstudiantes] = await Promise.all([
                GrupoEstudiantes.findAll({
                    where: {
                        grupo_id,
                        usuario_id: { [Op.in]: estudiantesIds },
                    },
                    attributes: ["usuario_id"],
                    raw: true,
                    transaction,
                }) as Promise<Array<{ usuario_id: number }>>,
                Usuarios.findAll({
                    where: {
                        id: { [Op.in]: estudiantesIds },
                        rol: "estudiante",
                    },
                    attributes: ["id"],
                    raw: true,
                    transaction,
                }) as Promise<Array<{ id: number }>>,
            ]);
            const inscritos = new Set(
                inscripciones.map((inscripcion) =>
                    Number(inscripcion.usuario_id),
                ),
            );
            const estudiantesValidos = new Set(
                usuariosEstudiantes.map((usuario) => Number(usuario.id)),
            );
            if (
                estudiantesIds.some(
                    (id) => !inscritos.has(id) || !estudiantesValidos.has(id),
                )
            ) {
                throw new Error(
                    "Todos los estudiantes seleccionados deben pertenecer al grupo",
                );
            }
            destinatariosIds = estudiantesIds;
        } else {
            const inscripciones = (await GrupoEstudiantes.findAll({
                where: { grupo_id },
                attributes: ["usuario_id"],
                raw: true,
                transaction,
            })) as unknown as Array<{ usuario_id: number }>;
            destinatariosIds = inscripciones.map((i) =>
                Number(i.usuario_id),
            );
        }

        const ejercicio = await EjerciciosGrupo.create(
            {
                grupo_id,
                temario_id,
                titulo: titulo.trim(),
                enunciado: enunciado.trim(),
                tipo,
                asignacion,
                puntos: puntosFinal,
                fecha_limite: fechaLimite,
                casos_prueba: casosPrueba.length > 0 ? casosPrueba : null,
            },
            { transaction },
        );

        if (asignacion === "seleccionados") {
            await EjercicioGrupoEstudiante.bulkCreate(
                estudiantesIds.map((usuario_id) => ({
                    ejercicio_grupo_id: ejercicio.id,
                    usuario_id,
                })),
                { transaction },
            );
        }

        await Promise.all(
            destinatariosIds.map((usuario_id) =>
                Notificaciones.create(
                    {
                        descripcion: `Nuevo ejercicio de ${tipo}: "${titulo.trim()}"${
                            fechaLimite ? ` (hasta el ${fechaLimite})` : ""
                        }`,
                        usuario_id,
                    },
                    { transaction },
                ),
            ),
        );

        return ejercicio;
    });
};

const isNumeroEntero = (v: any): boolean =>
    Number.isInteger(Number(v)) && v !== "" && v !== null;

const puedeAccederEjercicio = async (
    ejercicio: EjerciciosGrupoAttributesRaw,
    estudianteId: number,
): Promise<boolean> => {
    if (ejercicio.asignacion !== "seleccionados") return true;
    return Boolean(
        await EjercicioGrupoEstudiante.findOne({
            where: {
                ejercicio_grupo_id: ejercicio.id,
                usuario_id: estudianteId,
            },
        }),
    );
};

const listarEjerciciosGrupo = async (grupoId: number) => {
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

/** Profesor: ejercicios de un grupo propio. */
export const listarEjerciciosProfesor = async (
    grupoId: number,
    profesorId: number,
) => {
    await grupoDelProfesor(grupoId, profesorId);
    return listarEjerciciosGrupo(grupoId);
};

/** Administrador: ejercicios de cualquier grupo existente, solo lectura. */
export const listarEjerciciosAdmin = async (grupoId: number) => {
    const grupo = await Grupo.findByPk(grupoId);
    if (!grupo) {
        throw new Error("El grupo no existe");
    }
    return listarEjerciciosGrupo(grupoId);
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

const listarSoluciones = async (ejercicioId: number) => {
    const entregas = (await UsuarioEjerciciosGrupo.findAll({
        where: { ejercicio_grupo_id: ejercicioId },
        order: [["ultima_actividad", "DESC"]],
        raw: true,
    })) as unknown as Array<{
        id: number;
        usuario_id: number;
        estado_tablero: string | null;
        resultado_casos_prueba: ResultadoCasoPruebaGrupo[] | null;
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

/** Profesor: todas las entregas de un ejercicio de su grupo. */
export const listarSolucionesEjercicio = async (
    ejercicioId: number,
    profesorId: number,
) => {
    await ejercicioDelProfesor(ejercicioId, profesorId);
    return listarSoluciones(ejercicioId);
};

/** Administrador: todas las entregas de un ejercicio, solo lectura. */
export const listarSolucionesEjercicioAdmin = async (
    grupoId: number,
    ejercicioId: number,
) => {
    const ejercicio = await EjerciciosGrupo.findOne({
        where: { id: ejercicioId, grupo_id: grupoId },
    });
    if (!ejercicio) {
        throw new Error("El ejercicio no existe en ese grupo");
    }
    return listarSoluciones(ejercicioId);
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
    if (puntos > ejercicio.puntos) {
        throw new Error(
            `Los puntos de calificación no pueden superar los ${ejercicio.puntos} puntos máximos del ejercicio`,
        );
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
    const idsEjercicios = ejercicios.map((ejercicio) => ejercicio.id);
    const asignaciones = idsEjercicios.length
        ? ((await EjercicioGrupoEstudiante.findAll({
              where: {
                  usuario_id: estudianteId,
                  ejercicio_grupo_id: { [Op.in]: idsEjercicios },
              },
              attributes: ["ejercicio_grupo_id"],
              raw: true,
          })) as unknown as Array<{ ejercicio_grupo_id: number }>)
        : [];
    const idsAsignados = new Set(
        asignaciones.map((asignacion) =>
            Number(asignacion.ejercicio_grupo_id),
        ),
    );
    const ejerciciosVisibles = ejercicios.filter(
        (ejercicio) =>
            ejercicio.asignacion !== "seleccionados" ||
            idsAsignados.has(ejercicio.id),
    );

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

    return ejerciciosVisibles.map((e) => {
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
    if (!(await puedeAccederEjercicio(ejercicio, estudianteId))) {
        throw new Error("No tienes acceso a este ejercicio");
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
    if (!(await puedeAccederEjercicio(ejercicio, estudianteId))) {
        throw new Error("No tienes acceso a este ejercicio");
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
    resultadoCasosPrueba: any,
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
    if (!(await puedeAccederEjercicio(ejercicio, estudianteId))) {
        throw new Error("No tienes acceso a este ejercicio");
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

    const casosPrueba = validarCasosPrueba(ejercicio.casos_prueba);
    const resultadosValidados = validarResultadosCasosPrueba(
        resultadoCasosPrueba,
        casosPrueba,
    );

    const [entrega] = await UsuarioEjerciciosGrupo.findOrCreate({
        where: { ejercicio_grupo_id: ejercicioId, usuario_id: estudianteId },
        defaults: {
            estado_tablero: null,
            completado: false,
            puntos: 0,
            resultado_casos_prueba: null,
        },
    });

    if (entrega.completado) {
        // Reentrega: solo se actualiza el estado; sin puntos.
        await entrega.update({
            estado_tablero:
                typeof estadoTablero === "string"
                    ? estadoTablero
                    : entrega.estado_tablero,
            resultado_casos_prueba: resultadosValidados,
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
        resultado_casos_prueba: resultadosValidados,
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
 * del profesor (`puntos_profesor`) y ejercicios completados. Profesores
 * propietarios y estudiantes inscritos lo consultan; admin mediante su ruta
 * global de solo lectura. */
export const obtenerRankingGrupo = async (
    grupoId: number,
    solicitanteId: number,
    solicitanteRol?: Rol,
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

    if (!esProfesor && !inscrito && solicitanteRol !== "admin") {
        throw new Error("No tienes acceso al ranking de este grupo");
    }

    const inscripciones = (await GrupoEstudiantes.findAll({
        where: { grupo_id: grupoId },
        attributes: ["usuario_id"],
        raw: true,
    })) as unknown as Array<{ usuario_id: number }>;
    const ejerciciosGrupo = (await EjerciciosGrupo.findAll({
        where: { grupo_id: grupoId },
        attributes: ["id", "asignacion"],
        raw: true,
    })) as unknown as Array<{
        id: number;
        asignacion: "todos" | "seleccionados";
    }>;
    const asignaciones = ejerciciosGrupo.length
        ? ((await EjercicioGrupoEstudiante.findAll({
              where: {
                  ejercicio_grupo_id: {
                      [Op.in]: ejerciciosGrupo.map((ejercicio) => ejercicio.id),
                  },
              },
              attributes: ["ejercicio_grupo_id", "usuario_id"],
              raw: true,
          })) as unknown as Array<{
              ejercicio_grupo_id: number;
              usuario_id: number;
          }>)
        : [];
    const estudiantesPorEjercicio = new Map<number, Set<number>>();
    for (const asignacion of asignaciones) {
        const ejercicioId = Number(asignacion.ejercicio_grupo_id);
        const estudiantes =
            estudiantesPorEjercicio.get(ejercicioId) ?? new Set<number>();
        estudiantes.add(Number(asignacion.usuario_id));
        estudiantesPorEjercicio.set(ejercicioId, estudiantes);
    }

    const filas = await Promise.all(
        inscripciones.map(async (i) => {
            const idsGrupo = new Set(
                ejerciciosGrupo
                    .filter(
                        (ejercicio) =>
                            ejercicio.asignacion !== "seleccionados" ||
                            estudiantesPorEjercicio
                                .get(Number(ejercicio.id))
                                ?.has(Number(i.usuario_id)) === true,
                    )
                    .map((ejercicio) => Number(ejercicio.id)),
            );
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

            const delGrupo = entregas.filter((e) =>
                idsGrupo.has(Number(e.ejercicio_grupo_id)),
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
