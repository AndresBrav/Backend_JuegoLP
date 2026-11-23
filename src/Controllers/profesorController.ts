import { Response } from "express";
import { RequestAutenticado } from "../Middlewares/cargarUsuarioActual";
import {
    crearGrupo,
    listarGruposProfesor,
    obtenerGrupoProfesor,
    eliminarGrupo,
} from "../Services/grupoServices";
import {
    listarTemariosProfesor,
    crearTemario,
    editarTemario,
    eliminarTemario,
    reordenarTemarios,
    esErrorNegocio,
} from "../Services/temariosGrupoServices";
import {
    crearEjercicioGrupo,
    listarEjerciciosProfesor,
    editarEjercicioGrupo,
    eliminarEjercicioGrupo,
    listarSolucionesEjercicio,
    calificarEntrega,
    guardarComentarioEntrega,
    obtenerRankingGrupo,
} from "../Services/ejerciciosGrupoServices";

/**
 * Respuesta de error estándar: 400 si el mensaje es de negocio
 * (validación, fecha límite, permiso del grupo) y 500 en otros casos.
 */
export const responderError = (res: Response, err: unknown): void => {
    if (esErrorNegocio(err)) {
        res.status(400).json({
            message: err instanceof Error ? err.message : "Solicitud inválida",
        });
        return;
    }
    console.log("ERROR PROFESOR:", err);
    res.status(500).json({
        message: err instanceof Error ? err.message : "Error interno",
    });
};

const idNumerico = (valor: any): number => Number(valor);

// ===================== GRUPOS =====================

/**
 * @swagger
 * /profesor/grupos:
 *   post:
 *     tags: [Profesor]
 *     summary: Crear un grupo (devuelve el código de unión)
 *     security:
 *       - BearerAuth: []
 */
export const crearGrupoController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    try {
        const { nombre } = req.body ?? {};
        const grupo = await crearGrupo(req.usuarioActual.id, nombre);
        res.status(201).json({
            id: grupo.id,
            nombre: grupo.nombre,
            codigo: grupo.codigo,
        });
    } catch (err) {
        responderError(res, err);
    }
};

/**
 * @swagger
 * /profesor/grupos:
 *   get:
 *     tags: [Profesor]
 *     summary: Listar los grupos del profesor
 *     security:
 *       - BearerAuth: []
 */
export const listarGruposController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    try {
        const grupos = await listarGruposProfesor(req.usuarioActual.id);
        res.json(grupos);
    } catch (err) {
        responderError(res, err);
    }
};

/**
 * @swagger
 * /profesor/grupos/{id}:
 *   get:
 *     tags: [Profesor]
 *     summary: Detalle del grupo con sus estudiantes inscritos
 *     security:
 *       - BearerAuth: []
 */
export const obtenerGrupoController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    try {
        const grupo = await obtenerGrupoProfesor(
            idNumerico(req.params.id),
            req.usuarioActual.id,
        );
        if (!grupo) {
            res.status(404).json({ message: "El grupo no existe" });
            return;
        }
        res.json(grupo);
    } catch (err) {
        responderError(res, err);
    }
};

/**
 * @swagger
 * /profesor/grupos/{id}:
 *   delete:
 *     tags: [Profesor]
 *     summary: Eliminar el grupo y su contenido
 *     security:
 *       - BearerAuth: []
 */
export const eliminarGrupoController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    try {
        await eliminarGrupo(idNumerico(req.params.id), req.usuarioActual.id);
        res.json({ msg: "grupo eliminado" });
    } catch (err) {
        responderError(res, err);
    }
};

// ===================== TEMARIOS =====================

/**
 * @swagger
 * /profesor/grupos/{id}/temarios:
 *   get:
 *     tags: [Profesor]
 *     summary: Temarios del grupo (ordenados, con conteo de ejercicios)
 *     security:
 *       - BearerAuth: []
 */
export const listarTemariosController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    try {
        const temarios = await listarTemariosProfesor(
            idNumerico(req.params.id),
        );
        res.json(temarios);
    } catch (err) {
        responderError(res, err);
    }
};

/**
 * @swagger
 * /profesor/grupos/{id}/temarios:
 *   post:
 *     tags: [Profesor]
 *     summary: Crear un temario en el grupo (nombre único por grupo)
 *     security:
 *       - BearerAuth: []
 */
export const crearTemarioController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    try {
        const { nombre } = req.body ?? {};
        const temario = await crearTemario(
            idNumerico(req.params.id),
            req.usuarioActual.id,
            nombre,
        );
        res.status(201).json(temario);
    } catch (err) {
        responderError(res, err);
    }
};

/**
 * @swagger
 * /profesor/grupos/{id}/temarios/reordenar:
 *   put:
 *     tags: [Profesor]
 *     summary: "Reordenar temarios (body: { ids: number[] } en el orden final)"
 *     security:
 *       - BearerAuth: []
 */
export const reordenarTemariosController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    try {
        const { ids } = req.body ?? {};
        await reordenarTemarios(
            idNumerico(req.params.id),
            req.usuarioActual.id,
            ids,
        );
        res.json({ msg: "orden actualizado" });
    } catch (err) {
        responderError(res, err);
    }
};

/**
 * @swagger
 * /profesor/temarios/{id}:
 *   put:
 *     tags: [Profesor]
 *     summary: Renombrar un temario
 *     security:
 *       - BearerAuth: []
 */
export const editarTemarioController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    try {
        const { nombre } = req.body ?? {};
        await editarTemario(
            idNumerico(req.params.id),
            req.usuarioActual.id,
            nombre,
        );
        res.json({ msg: "temario actualizado" });
    } catch (err) {
        responderError(res, err);
    }
};

/**
 * @swagger
 * /profesor/temarios/{id}:
 *   delete:
 *     tags: [Profesor]
 *     summary: Eliminar un temario (solo si está vacío)
 *     security:
 *       - BearerAuth: []
 */
export const eliminarTemarioController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    try {
        await eliminarTemario(idNumerico(req.params.id), req.usuarioActual.id);
        res.json({ msg: "temario eliminado" });
    } catch (err) {
        responderError(res, err);
    }
};

// ===================== EJERCICIOS =====================

/**
 * @swagger
 * /profesor/grupos/{id}/ejercicios:
 *   get:
 *     tags: [Profesor]
 *     summary: Ejercicios del grupo (con completados/entregas)
 *     security:
 *       - BearerAuth: []
 */
export const listarEjerciciosController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    try {
        const ejercicios = await listarEjerciciosProfesor(
            idNumerico(req.params.id),
            req.usuarioActual.id,
        );
        res.json(ejercicios);
    } catch (err) {
        responderError(res, err);
    }
};

/**
 * @swagger
 * /profesor/grupos/{id}/ejercicios:
 *   post:
 *     tags: [Profesor]
 *     summary: Crear ejercicio (título, enunciado, tipo, puntos,
 *       casos_prueba opcionales, fecha_limite opcional YYYY-MM-DD,
 *       temario_id)
 *     security:
 *       - BearerAuth: []
 */
export const crearEjercicioController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    try {
        const datos = { ...(req.body ?? {}), grupo_id: req.params.id };
        const ejercicio = await crearEjercicioGrupo(
            req.usuarioActual.id,
            datos,
        );
        res.status(201).json(ejercicio);
    } catch (err) {
        responderError(res, err);
    }
};

/**
 * @swagger
 * /profesor/ejercicios/{id}:
 *   put:
 *     tags: [Profesor]
 *     summary: Editar ejercicio del profesor
 *     security:
 *       - BearerAuth: []
 */
export const editarEjercicioController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    try {
        await editarEjercicioGrupo(
            idNumerico(req.params.id),
            req.usuarioActual.id,
            req.body ?? {},
        );
        res.json({ msg: "ejercicio actualizado" });
    } catch (err) {
        responderError(res, err);
    }
};

/**
 * @swagger
 * /profesor/ejercicios/{id}:
 *   delete:
 *     tags: [Profesor]
 *     summary: Eliminar ejercicio del profesor
 *     security:
 *       - BearerAuth: []
 */
export const eliminarEjercicioController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    try {
        await eliminarEjercicioGrupo(
            idNumerico(req.params.id),
            req.usuarioActual.id,
        );
        res.json({ msg: "ejercicio eliminado" });
    } catch (err) {
        responderError(res, err);
    }
};

/**
 * @swagger
 * /profesor/ejercicios/{id}/soluciones:
 *   get:
 *     tags: [Profesor]
 *     summary: Entregas de los estudiantes para ese ejercicio
 *     security:
 *       - BearerAuth: []
 */
export const listarSolucionesController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    try {
        const entregas = await listarSolucionesEjercicio(
            idNumerico(req.params.id),
            req.usuarioActual.id,
        );
        res.json(entregas);
    } catch (err) {
        responderError(res, err);
    }
};

/**
 * @swagger
 * /profesor/ejercicios/{id}/calificar/{estudianteId}:
 *   put:
 *     tags: [Profesor]
 *     summary: Calificar una entrega hasta el puntaje máximo del ejercicio
 *     description: La calificación afecta SOLO al par ejercicio+estudiante. El comentario es opcional.
 *     security:
 *       - BearerAuth: []
 */
export const calificarEntregaController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    if (req.usuarioActual.rol !== "profesor") {
        res.status(403).json({
            message: "Los administradores solo pueden consultar las entregas",
        });
        return;
    }

    try {
        const { puntos_profesor, comentario } = req.body ?? {};
        const entrega = await calificarEntrega(
            idNumerico(req.params.id),
            req.usuarioActual.id,
            idNumerico(req.params.estudianteId),
            puntos_profesor,
            comentario,
        );
        res.json(entrega);
    } catch (err) {
        responderError(res, err);
    }
};

/**
 * @swagger
 * /profesor/ejercicios/{id}/comentario/{estudianteId}:
 *   put:
 *     tags: [Profesor]
 *     summary: Guardar solo el comentario sobre la entrega
 *     security:
 *       - BearerAuth: []
 */
export const guardarComentarioController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    if (req.usuarioActual.rol !== "profesor") {
        res.status(403).json({
            message: "Los administradores solo pueden consultar las entregas",
        });
        return;
    }

    try {
        const { comentario } = req.body ?? {};
        const entrega = await guardarComentarioEntrega(
            idNumerico(req.params.id),
            req.usuarioActual.id,
            idNumerico(req.params.estudianteId),
            comentario,
        );
        res.json(entrega);
    } catch (err) {
        responderError(res, err);
    }
};

/**
 * @swagger
 * /profesor/grupos/{id}/ranking:
 *   get:
 *     tags: [Profesor]
 *     summary: Ranking del grupo (puntos y completados por estudiante)
 *     security:
 *       - BearerAuth: []
 */
export const rankingGrupoController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    try {
        const ranking = await obtenerRankingGrupo(
            idNumerico(req.params.id),
            req.usuarioActual.id,
        );
        res.json(ranking);
    } catch (err) {
        responderError(res, err);
    }
};
