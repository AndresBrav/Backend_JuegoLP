import { Response } from "express";
import { RequestAutenticado } from "../Middlewares/cargarUsuarioActual";
import {
    listarGruposEstudiante,
    salirDeGrupo,
    unirEstudiantePorCodigo,
} from "../Services/grupoServices";
import { reporteEstudiante } from "../Services/reporteServices";
import {
    listarEjerciciosEstudianteGrupo,
    obtenerEjercicioEstudiante,
    guardarEstadoEjercicioEstudiante,
    completarEjercicioEstudiante,
    estudiantePerteneceAGrupo,
} from "../Services/ejerciciosGrupoServices";

/**
 * @swagger
 * /estudiante/grupos/unirse:
 *   post:
 *     tags: [Estudiante]
 *     summary: Unirse a un grupo con el cÃ³digo del profesor
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [codigo]
 *             properties:
 *               codigo:
 *                 type: string
 *                 example: "A7K2P9"
 *     responses:
 *       201:
 *         description: Matriculado en el grupo
 *       404:
 *         description: CÃ³digo invÃ¡lido
 *       409:
 *         description: Ya perteneces a ese grupo
 */
export const unirseAGrupoController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const codigo = req.body?.codigo;

        if (typeof codigo !== "string" || codigo.trim().length === 0) {
            res.status(400).json({ message: "El cÃ³digo del grupo es obligatorio" });
            return;
        }

        const grupo = await unirEstudiantePorCodigo(
            codigo,
            req.usuarioActual!.id,
        );

        res.status(201).json({
            id: grupo.id,
            nombre: grupo.nombre,
            codigo: grupo.codigo,
        });
    } catch (error: any) {
        if (error.message === "CODIGO_INVALIDO") {
            res.status(404).json({ message: "CÃ³digo de grupo invÃ¡lido" });
            return;
        }

        if (error.message === "YA_ES_MIEMBRO") {
            res.status(409).json({ message: "Ya perteneces a ese grupo" });
            return;
        }

        console.error("ERROR unirseAGrupoController:", error);
        res.status(500).json({ message: "No se pudo unir al grupo" });
    }
};

/**
 * @swagger
 * /estudiante/grupos:
 *   get:
 *     tags: [Estudiante]
 *     summary: Listar los grupos a los que pertenece el estudiante
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de grupos
 */
export const misGruposController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const grupos = await listarGruposEstudiante(req.usuarioActual!.id);
        res.json(grupos);
    } catch (error: any) {
        console.error("ERROR misGruposController:", error);
        res.status(500).json({ message: "No se pudieron listar tus grupos" });
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Saliste del grupo
 *       404:
 *         description: No perteneces a ese grupo
 */
export const salirDeGrupoController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const grupoId = Number(req.params.id);

        if (!Number.isInteger(grupoId)) {
            res.status(400).json({ message: "Id de grupo invÃ¡lido" });
            return;
        }

        const salio = await salirDeGrupo(grupoId, req.usuarioActual!.id);

        if (!salio) {
            res.status(404).json({ message: "No perteneces a ese grupo" });
            return;
        }

        res.status(204).send();
    } catch (error: any) {
        console.error("ERROR salirDeGrupoController:", error);
        res.status(500).json({ message: "No se pudo salir del grupo" });
    }
};

/**
 * @swagger
 * /estudiante/progreso:
 *   get:
 *     tags: [Estudiante]
 *     summary: Ver el progreso propio por ejercicio y por dÃ­a
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Progreso del estudiante autenticado
 */
export const miProgresoController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const reporte = await reporteEstudiante(req.usuarioActual!.id);

        if (!reporte) {
            res.status(404).json({ message: "Usuario no encontrado" });
            return;
        }

        res.json(reporte);
    } catch (error: any) {
        console.error("ERROR miProgresoController:", error);
        res.status(500).json({ message: "No se pudo obtener tu progreso" });
    }
};

export const listarEjerciciosGrupoEstudianteController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const grupoId = Number(req.params.id);
        const estudianteId = req.usuarioActual!.id;

        if (!Number.isInteger(grupoId)) {
            res.status(400).json({ message: "Id de grupo inválido" });
            return;
        }

        const pertenece = await estudiantePerteneceAGrupo(grupoId, estudianteId);
        if (!pertenece) {
            res.status(403).json({ message: "No perteneces a este grupo" });
            return;
        }

        const ejercicios = await listarEjerciciosEstudianteGrupo(
            grupoId,
            estudianteId,
        );
        res.json(ejercicios);
    } catch (error: any) {
        console.error("ERROR listarEjerciciosGrupoEstudianteController:", error);
        res.status(500).json({ message: "No se pudieron obtener los ejercicios" });
    }
};

export const obtenerEjercicioEstudianteController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const grupoId = Number(req.params.id);
        const ejercicioId = Number(req.params.ejercicioId);
        const estudianteId = req.usuarioActual!.id;

        if (!Number.isInteger(grupoId) || !Number.isInteger(ejercicioId)) {
            res.status(400).json({ message: "Parámetros inválidos" });
            return;
        }

        const pertenece = await estudiantePerteneceAGrupo(grupoId, estudianteId);
        if (!pertenece) {
            res.status(403).json({ message: "No perteneces a este grupo" });
            return;
        }

        const ejercicio = await obtenerEjercicioEstudiante(
            grupoId,
            ejercicioId,
            estudianteId,
        );

        if (!ejercicio) {
            res.status(404).json({ message: "Ejercicio no encontrado" });
            return;
        }

        res.json(ejercicio);
    } catch (error: any) {
        console.error("ERROR obtenerEjercicioEstudianteController:", error);
        res.status(500).json({ message: "No se pudo obtener el ejercicio" });
    }
};

export const guardarEstadoEjercicioEstudianteController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const grupoId = Number(req.params.id);
        const ejercicioId = Number(req.params.ejercicioId);
        const estudianteId = req.usuarioActual!.id;
        const { estado_tablero } = req.body;

        if (!Number.isInteger(grupoId) || !Number.isInteger(ejercicioId)) {
            res.status(400).json({ message: "Parámetros inválidos" });
            return;
        }

        const pertenece = await estudiantePerteneceAGrupo(grupoId, estudianteId);
        if (!pertenece) {
            res.status(403).json({ message: "No perteneces a este grupo" });
            return;
        }

        const estadoString =
            estado_tablero === null
                ? null
                : typeof estado_tablero === "object"
                  ? JSON.stringify(estado_tablero)
                  : String(estado_tablero ?? "");

        const respuesta = await guardarEstadoEjercicioEstudiante(
            grupoId,
            ejercicioId,
            estudianteId,
            estadoString,
        );

        res.json({
            message: "Progreso guardado correctamente",
            respuesta,
        });
    } catch (error: any) {
        console.error("ERROR guardarEstadoEjercicioEstudianteController:", error);
        res.status(500).json({ message: "No se pudo guardar el progreso" });
    }
};

export const completarEjercicioEstudianteController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const grupoId = Number(req.params.id);
        const ejercicioId = Number(req.params.ejercicioId);
        const estudianteId = req.usuarioActual!.id;
        const { estado_tablero } = req.body;

        if (!Number.isInteger(grupoId) || !Number.isInteger(ejercicioId)) {
            res.status(400).json({ message: "Parámetros inválidos" });
            return;
        }

        const pertenece = await estudiantePerteneceAGrupo(grupoId, estudianteId);
        if (!pertenece) {
            res.status(403).json({ message: "No perteneces a este grupo" });
            return;
        }

        const estadoString =
            estado_tablero === null
                ? null
                : typeof estado_tablero === "object"
                  ? JSON.stringify(estado_tablero)
                  : String(estado_tablero ?? "");

        const resultado = await completarEjercicioEstudiante(
            grupoId,
            ejercicioId,
            estudianteId,
            estadoString,
        );

        res.json({
            message: "Ejercicio entregado correctamente",
            resultado,
        });
    } catch (error: any) {
        console.error("ERROR completarEjercicioEstudianteController:", error);
        res.status(500).json({ message: "No se pudo entregar el ejercicio" });
    }
};
