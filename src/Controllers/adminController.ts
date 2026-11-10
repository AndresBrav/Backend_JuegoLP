import { Response } from "express";
import { RequestAutenticado } from "../Middlewares/cargarUsuarioActual";
import { listarEstudiantes } from "../Services/adminServices";
import { estadisticasGlobales } from "../Services/reporteServices";

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
