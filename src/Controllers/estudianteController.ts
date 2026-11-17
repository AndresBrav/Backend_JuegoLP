import { Response } from "express";
import { RequestAutenticado } from "../Middlewares/cargarUsuarioActual";
import {
    listarGruposEstudiante,
    unirseAGrupo,
    salirDeGrupo,
} from "../Services/grupoServices";
import { listarTemariosEstudiante } from "../Services/temariosGrupoServices";
import {
    listarEjerciciosEstudiante,
    obtenerEjercicioEstudiante,
    guardarEstadoEjercicio,
    completarEjercicioEstudiante,
    obtenerRankingGrupo,
    esErrorNegocio,
} from "../Services/ejerciciosGrupoServices";
import { responderError } from "./profesorController";

const idNumerico = (valor: any): number => Number(valor);

// ===================== GRUPOS =====================

/**
 * @swagger
 * /estudiante/grupos/unirse:
 *   post:
 *     tags: [Estudiante]
 *     summary: Unirse a un grupo con el código de 6 caracteres
 *     security:
 *       - BearerAuth: []
 */
export const unirseAGrupoController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    try {
        const { codigo } = req.body ?? {};
        const grupo = await unirseAGrupo(req.usuarioActual.id, codigo);
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
 * /estudiante/grupos:
 *   get:
 *     tags: [Estudiante]
 *     summary: Los grupos a los que pertenece el estudiante
 *     security:
 *       - BearerAuth: []
 */
export const misGruposController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    try {
        const grupos = await listarGruposEstudiante(req.usuarioActual.id);
        res.json(grupos);
    } catch (err) {
        responderError(res, err);
    }
};

/**
 * @swagger
 * /estudiante/grupos/{id}:
 *   delete:
 *     tags: [Estudiante]
 *     summary: Salir de un grupo
 *     security:
 *       - BearerAuth: []
 */
export const salirDeGrupoController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    try {
        await salirDeGrupo(idNumerico(req.params.id), req.usuarioActual.id);
        res.json({ msg: "saliste del grupo" });
    } catch (err) {
        responderError(res, err);
    }
};

// ===================== TEMARIOS =====================

/**
 * @swagger
 * /estudiante/grupos/{id}/temarios:
 *   get:
 *     tags: [Estudiante]
 *     summary: Temarios del grupo con su avance (completados/total)
 *     security:
 *       - BearerAuth: []
 */
export const listarTemariosController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    try {
        const temarios = await listarTemariosEstudiante(
            idNumerico(req.params.id),
            req.usuarioActual.id,
        );
        res.json(temarios);
    } catch (err) {
        responderError(res, err);
    }
};

// ===================== EJERCICIOS =====================

/**
 * @swagger
 * /estudiante/grupos/{id}/ejercicios:
 *   get:
 *     tags: [Estudiante]
 *     summary: Ejercicios del grupo con SU estado de entrega
 *     security:
 *       - BearerAuth: []
 */
export const listarEjerciciosController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    try {
        const ejercicios = await listarEjerciciosEstudiante(
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
 * /estudiante/grupos/{id}/ejercicios/{ejercicioId}:
 *   get:
 *     tags: [Estudiante]
 *     summary: Abrir un ejercicio (crea su fila de entrega vacía)
 *     security:
 *       - BearerAuth: []
 */
export const obtenerEjercicioController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    try {
        const datos = await obtenerEjercicioEstudiante(
            idNumerico(req.params.id),
            idNumerico(req.params.ejercicioId),
            req.usuarioActual.id,
        );
        res.json(datos);
    } catch (err) {
        responderError(res, err);
    }
};

/**
 * @swagger
 * /estudiante/grupos/{id}/ejercicios/{ejercicioId}/estado:
 *   put:
 *     tags: [Estudiante]
 *     summary: Autoguardar el estado del tablero (bloqueado si venció)
 *     security:
 *       - BearerAuth: []
 */
export const guardarEstadoController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    try {
        const { estado_tablero } = req.body ?? {};
        const r = await guardarEstadoEjercicio(
            idNumerico(req.params.id),
            idNumerico(req.params.ejercicioId),
            req.usuarioActual.id,
            estado_tablero,
        );
        res.json(r);
    } catch (err) {
        responderError(res, err);
    }
};

/**
 * @swagger
 * /estudiante/grupos/{id}/ejercicios/{ejercicioId}/completar:
 *   post:
 *     tags: [Estudiante]
 *     summary: Entregar el ejercicio con resultados reportados de casos
 *       de prueba (NO otorga puntos; bloqueado si venció)
 *     security:
 *       - BearerAuth: []
 */
export const completarEjercicioController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    try {
        const { estado_tablero, resultado_casos_prueba } = req.body ?? {};
        const r = await completarEjercicioEstudiante(
            idNumerico(req.params.id),
            idNumerico(req.params.ejercicioId),
            req.usuarioActual.id,
            estado_tablero,
            resultado_casos_prueba,
        );
        res.json(r);
    } catch (err) {
        responderError(res, err);
    }
};

/**
 * @swagger
 * /estudiante/grupos/{id}/ranking:
 *   get:
 *     tags: [Estudiante]
 *     summary: Ranking del grupo al que pertenece
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
