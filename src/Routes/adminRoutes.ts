import { Router } from "express";
import verifyToken from "../Middlewares/verifyToken";
import cargarUsuarioActual from "../Middlewares/cargarUsuarioActual";
import requireRole from "../Middlewares/requireRole";
import {
    estadisticasController,
    listarEstudiantesController,
} from "../Controllers/adminController";

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

export default router;
