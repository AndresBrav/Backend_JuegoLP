import { Response } from "express";
import { RequestAutenticado } from "../Middlewares/cargarUsuarioActual";
import {
    crearGrupo,
    eliminarGrupo,
    listarEstudiantesDeGrupo,
    listarGruposProfesor,
    obtenerGrupoPorId,
    profesorTieneEstudiante,
} from "../Services/grupoServices";
import {
    reporteEstudiante,
    reporteGrupo,
} from "../Services/reporteServices";

const esAdmin = (req: RequestAutenticado): boolean =>
    req.usuarioActual?.rol === "admin";

/**
 * @swagger
 * /profesor/grupos:
 *   post:
 *     tags: [Profesor]
 *     summary: Crear un grupo
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre]
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "10-A"
 *     responses:
 *       201:
 *         description: Grupo creado
 *       400:
 *         description: Nombre inválido
 *       403:
 *         description: Requiere rol profesor
 */
export const crearGrupoController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const nombre = req.body?.nombre;

        if (typeof nombre !== "string" || nombre.trim().length === 0) {
            res.status(400).json({ message: "El nombre del grupo es obligatorio" });
            return;
        }

        const grupo = await crearGrupo(
            req.usuarioActual!.id,
            nombre.trim(),
        );

        res.status(201).json({
            id: grupo.id,
            nombre: grupo.nombre,
            codigo: grupo.codigo,
        });
    } catch (error: any) {
        console.error("ERROR crearGrupoController:", error);
        res.status(500).json({ message: "No se pudo crear el grupo" });
    }
};

/**
 * @swagger
 * /profesor/grupos:
 *   get:
 *     tags: [Profesor]
 *     summary: Listar los grupos del profesor autenticado
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de grupos con número de estudiantes
 */
export const listarGruposController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const grupos = await listarGruposProfesor(req.usuarioActual!.id);
        res.json(grupos);
    } catch (error: any) {
        console.error("ERROR listarGruposController:", error);
        res.status(500).json({ message: "No se pudieron listar los grupos" });
    }
};

/**
 * @swagger
 * /profesor/grupos/{id}:
 *   get:
 *     tags: [Profesor]
 *     summary: Ver un grupo con sus estudiantes
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Grupo con estudiantes
 *       403:
 *         description: El grupo pertenece a otro profesor
 *       404:
 *         description: Grupo no encontrado
 */
export const obtenerGrupoController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const grupoId = Number(req.params.id);

        if (!Number.isInteger(grupoId)) {
            res.status(400).json({ message: "Id de grupo inválido" });
            return;
        }

        const grupo = await obtenerGrupoPorId(grupoId);

        if (!grupo) {
            res.status(404).json({ message: "Grupo no encontrado" });
            return;
        }

        if (!esAdmin(req) && Number(grupo.profesor_id) !== req.usuarioActual!.id) {
            res.status(403).json({ message: "Este grupo no te pertenece" });
            return;
        }

        const estudiantes = await listarEstudiantesDeGrupo(grupoId);

        res.json({
            id: grupo.id,
            nombre: grupo.nombre,
            codigo: grupo.codigo,
            profesor: (grupo as any).profesor,
            estudiantes,
        });
    } catch (error: any) {
        console.error("ERROR obtenerGrupoController:", error);
        res.status(500).json({ message: "No se pudo obtener el grupo" });
    }
};

/**
 * @swagger
 * /profesor/grupos/{id}:
 *   delete:
 *     tags: [Profesor]
 *     summary: Eliminar un grupo propio
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
 *         description: Grupo eliminado
 *       404:
 *         description: Grupo no encontrado
 */
export const eliminarGrupoController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const grupoId = Number(req.params.id);

        if (!Number.isInteger(grupoId)) {
            res.status(400).json({ message: "Id de grupo inválido" });
            return;
        }

        const eliminado = await eliminarGrupo(grupoId, req.usuarioActual!.id);

        if (!eliminado) {
            res.status(404).json({ message: "Grupo no encontrado" });
            return;
        }

        res.status(204).send();
    } catch (error: any) {
        console.error("ERROR eliminarGrupoController:", error);
        res.status(500).json({ message: "No se pudo eliminar el grupo" });
    }
};

const validarRango = (req: RequestAutenticado) => {
    const desde = typeof req.query.desde === "string" ? req.query.desde : undefined;
    const hasta = typeof req.query.hasta === "string" ? req.query.hasta : undefined;
    return { desde, hasta };
};

/**
 * @swagger
 * /profesor/grupos/{id}/reporte:
 *   get:
 *     tags: [Profesor]
 *     summary: Reporte del grupo con evolución diaria
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: desde
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: hasta
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Reporte del grupo
 *       403:
 *         description: Sin permisos sobre el grupo
 *       404:
 *         description: Grupo no encontrado
 */
export const reporteGrupoController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const grupoId = Number(req.params.id);

        if (!Number.isInteger(grupoId)) {
            res.status(400).json({ message: "Id de grupo inválido" });
            return;
        }

        const grupo = await obtenerGrupoPorId(grupoId);

        if (!grupo) {
            res.status(404).json({ message: "Grupo no encontrado" });
            return;
        }

        if (!esAdmin(req) && Number(grupo.profesor_id) !== req.usuarioActual!.id) {
            res.status(403).json({ message: "Este grupo no te pertenece" });
            return;
        }

        const { desde, hasta } = validarRango(req);
        const reporte = await reporteGrupo(grupo, desde, hasta);

        res.json(reporte);
    } catch (error: any) {
        console.error("ERROR reporteGrupoController:", error);
        res.status(500).json({ message: "No se pudo generar el reporte" });
    }
};

/**
 * @swagger
 * /profesor/estudiantes/{id}/reporte:
 *   get:
 *     tags: [Profesor]
 *     summary: Detalle del progreso de un estudiante
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Progreso por ejercicio y por día
 *       403:
 *         description: El estudiante no pertenece a tus grupos
 *       404:
 *         description: Estudiante no encontrado
 */
export const reporteEstudianteController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const estudianteId = Number(req.params.id);

        if (!Number.isInteger(estudianteId)) {
            res.status(400).json({ message: "Id de estudiante inválido" });
            return;
        }

        if (!esAdmin(req)) {
            const permitido = await profesorTieneEstudiante(
                req.usuarioActual!.id,
                estudianteId,
            );

            if (!permitido) {
                res.status(403).json({
                    message: "El estudiante no pertenece a tus grupos",
                });
                return;
            }
        }

        const reporte = await reporteEstudiante(estudianteId);

        if (!reporte) {
            res.status(404).json({ message: "Estudiante no encontrado" });
            return;
        }

        res.json(reporte);
    } catch (error: any) {
        console.error("ERROR reporteEstudianteController:", error);
        res.status(500).json({ message: "No se pudo generar el reporte" });
    }
};
