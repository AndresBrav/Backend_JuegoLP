import { Response } from "express";
import { RequestAutenticado } from "../Middlewares/cargarUsuarioActual";
import {
    crearGrupo,
    listarGruposProfesor,
    obtenerGrupoProfesor,
    agregarEstudiantesPorCodigo,
    buscarEstudiantesParaGrupo,
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
    actualizarAsignacionEjercicioGrupo,
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
 * /profesor/grupos/{id}/estudiantes:
 *   post:
 *     tags: [Profesor]
 *     summary: Inscribir estudiantes en un grupo mediante códigos SIS
 *     description: Acepta entre 1 y 100 códigos institucionales. Cada resultado indica si fue agregado, ya estaba inscrito, no existe o no corresponde a un estudiante.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [codigos]
 *             properties:
 *               codigos:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 100
 *                 items:
 *                   type: string
 *                   minLength: 4
 *                   maxLength: 20
 *                   pattern: '^[A-Za-z0-9]{4,20}$'
 *     responses:
 *       201:
 *         description: Resultados de inscripción por código
 */
export const agregarEstudiantesController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    try {
        const identificadores = req.body?.identificadores ?? req.body?.codigos;
        const resultados = await agregarEstudiantesPorCodigo(
            idNumerico(req.params.id),
            req.usuarioActual.id,
            identificadores,
        );
        res.status(201).json({ resultados });
    } catch (err) {
        responderError(res, err);
    }
};

/**
 * @swagger
 * /profesor/grupos/{id}/buscar-estudiantes:
 *   get:
 *     tags: [Profesor]
 *     summary: Buscar estudiantes en el sistema por nombre, código o correo
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de estudiantes encontrados con estado de inscripción
 */
export const buscarEstudiantesController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    try {
        const query = String(req.query.q ?? "");
        const estudiantes = await buscarEstudiantesParaGrupo(
            idNumerico(req.params.id),
            req.usuarioActual.id,
            query,
        );
        res.json({ estudiantes });
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
 *     summary: Crear ejercicio de grupo con asignación total o a estudiantes seleccionados
 *     description: asignacion acepta todos (predeterminado) o seleccionados; para seleccionados enviar estudiantes_ids con IDs de estudiantes inscritos en el grupo.
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
 * /profesor/ejercicios/{id}/asignacion:
 *   put:
 *     tags: [Profesor]
 *     summary: Cambiar destinatarios del ejercicio
 *     description: asignacion acepta todos o seleccionados; en modo seleccionados se envían estudiantes_ids. Las entregas de quienes quedan sin asignación se eliminan permanentemente.
 *     security:
 *       - BearerAuth: []
 */
export const actualizarAsignacionEjercicioController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    try {
        const { asignacion, estudiantes_ids } = req.body ?? {};
        const resultado = await actualizarAsignacionEjercicioGrupo(
            idNumerico(req.params.id),
            req.usuarioActual.id,
            asignacion,
            estudiantes_ids,
        );
        res.json(resultado);
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
