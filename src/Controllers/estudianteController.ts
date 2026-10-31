import { Response } from "express";
import { RequestAutenticado } from "../Middlewares/cargarUsuarioActual";
import {
    listarGruposEstudiante,
    salirDeGrupo,
    unirEstudiantePorCodigo,
} from "../Services/grupoServices";
import { reporteEstudiante } from "../Services/reporteServices";

/**
 * @swagger
 * /estudiante/grupos/unirse:
 *   post:
 *     tags: [Estudiante]
 *     summary: Unirse a un grupo con el código del profesor
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
 *         description: Código inválido
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
            res.status(400).json({ message: "El código del grupo es obligatorio" });
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
            res.status(404).json({ message: "Código de grupo inválido" });
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
            res.status(400).json({ message: "Id de grupo inválido" });
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
 *     summary: Ver el progreso propio por ejercicio y por día
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
