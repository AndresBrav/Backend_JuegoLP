import { Response } from "express";
import { RequestAutenticado } from "../Middlewares/cargarUsuarioActual";
import { listarEstudiantes, listarGruposAdmin } from "../Services/adminServices";
import { estadisticasGlobales } from "../Services/reporteServices";
import {
    listarEjerciciosAdmin,
    listarSolucionesEjercicioAdmin,
} from "../Services/ejerciciosGrupoServices";

/**
 * @swagger
 * /admin/estudiantes:
 *   get:
 *     tags: [Admin]
 *     summary: Listar todos los estudiantes con sus puntos y completados
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista global de estudiantes
 */
export const listarEstudiantesController = async (
    _req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const estudiantes = await listarEstudiantes();
        res.json(estudiantes);
    } catch (error: any) {
        console.error("ERROR listarEstudiantesController:", error);
        res.status(500).json({
            message: "No se pudieron listar los estudiantes",
        });
    }
};

/**
 * @swagger
 * /admin/estadisticas:
 *   get:
 *     tags: [Admin]
 *     summary: Estadísticas globales de la plataforma
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Totales de usuarios, puntos y actividad
 */
export const estadisticasController = async (
    _req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const estadisticas = await estadisticasGlobales();
        res.json(estadisticas);
    } catch (error: any) {
        console.error("ERROR estadisticasController:", error);
        res.status(500).json({ message: "No se pudieron calcular las estadísticas" });
    }
};

/**
 * @swagger
 * /admin/grupos:
 *   get:
 *     tags: [Admin]
 *     summary: Listar todos los grupos con métricas globales
 *     description: Disponible exclusivamente para administradores.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Grupos registrados con profesor, estudiantes y ejercicios
 */
export const listarGruposAdminController = async (
    _req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const grupos = await listarGruposAdmin();
        res.json(grupos);
    } catch (error) {
        console.error("ERROR listarGruposAdminController:", error);
        res.status(500).json({ message: "No se pudieron listar los grupos" });
    }
};

export const listarEjerciciosGrupoAdminController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    const grupoId = Number(req.params.id);
    if (!Number.isInteger(grupoId) || grupoId <= 0) {
        res.status(400).json({ message: "El identificador del grupo no es válido" });
        return;
    }

    try {
        res.json(await listarEjerciciosAdmin(grupoId));
    } catch (error) {
        if (error instanceof Error && error.message === "El grupo no existe") {
            res.status(404).json({ message: error.message });
            return;
        }
        console.error("ERROR listarEjerciciosGrupoAdminController:", error);
        res.status(500).json({ message: "No se pudieron listar los ejercicios" });
    }
};

export const listarSolucionesAdminController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    const grupoId = Number(req.params.grupoId);
    const ejercicioId = Number(req.params.id);
    if (
        !Number.isInteger(grupoId) ||
        grupoId <= 0 ||
        !Number.isInteger(ejercicioId) ||
        ejercicioId <= 0
    ) {
        res.status(400).json({ message: "Los identificadores no son válidos" });
        return;
    }

    try {
        res.json(await listarSolucionesEjercicioAdmin(grupoId, ejercicioId));
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === "El ejercicio no existe en ese grupo"
        ) {
            res.status(404).json({ message: error.message });
            return;
        }
        console.error("ERROR listarSolucionesAdminController:", error);
        res.status(500).json({ message: "No se pudieron listar las soluciones" });
    }
};
