import { Router } from "express";
import verifyToken from "../Middlewares/verifyToken";
import cargarUsuarioActual from "../Middlewares/cargarUsuarioActual";
import requireRole from "../Middlewares/requireRole";
import {
    estadisticasController,
    listarEstudiantesController,
    listarGruposAdminController,
} from "../Controllers/adminController";
import { reporteGrupoController } from "../Controllers/reporteGrupoController";

const router = Router();

// Todo el módulo admin exige sesión y rol admin
router.use(verifyToken, cargarUsuarioActual, requireRole("admin"));

/**
 * @swagger
 * /admin/estadisticas:
 *   get:
 *     tags: [Admin]
 *     summary: Estadísticas globales de la plataforma
 *     security:
 *       - BearerAuth: []
 */
router.get("/estadisticas", estadisticasController);

/**
 * @swagger
 * /admin/estudiantes:
 *   get:
 *     tags: [Admin]
 *     summary: Listar todos los estudiantes con sus puntos y completados
 *     security:
 *       - BearerAuth: []
 */
router.get("/estudiantes", listarEstudiantesController);

/**
 * @swagger
 * /admin/grupos:
 *   get:
 *     tags: [Admin]
 *     summary: Listar grupos para acceder a sus reportes
 *     security:
 *       - BearerAuth: []
 */
router.get("/grupos", listarGruposAdminController);

/**
 * @swagger
 * /admin/grupos/{id}/reporte:
 *   get:
 *     tags: [Admin]
 *     summary: Reporte de avance de un grupo
 *     security:
 *       - BearerAuth: []
 */
router.get("/grupos/:id/reporte", reporteGrupoController);

export default router;
