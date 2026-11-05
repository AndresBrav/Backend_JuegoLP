import express, { Router } from "express";
import verifyToken from "../Middlewares/verifyToken";
import cargarUsuarioActual from "../Middlewares/cargarUsuarioActual";
import requireRole from "../Middlewares/requireRole";
import {
    unirseAGrupoController,
    misGruposController,
    salirDeGrupoController,
    miProgresoController,
    listarEjerciciosGrupoEstudianteController,
    obtenerEjercicioEstudianteController,
    guardarEstadoEjercicioEstudianteController,
    completarEjercicioEstudianteController,
    obtenerRankingGrupoEstudianteController,
    listarTemariosGrupoEstudianteController,
} from "../Controllers/estudianteController";

const router: Router = express.Router();

router.use(verifyToken, cargarUsuarioActual, requireRole("estudiante"));

router.post("/grupos/unirse", unirseAGrupoController);
router.get("/grupos", misGruposController);
router.delete("/grupos/:id", salirDeGrupoController);
router.get("/progreso", miProgresoController);

// Ejercicios de grupos para estudiantes
router.get("/grupos/:id/ejercicios", listarEjerciciosGrupoEstudianteController);
router.get("/grupos/:id/temarios", listarTemariosGrupoEstudianteController);
router.get("/grupos/:id/ranking", obtenerRankingGrupoEstudianteController);
router.get("/grupos/:id/ejercicios/:ejercicioId", obtenerEjercicioEstudianteController);
router.put("/grupos/:id/ejercicios/:ejercicioId/estado", guardarEstadoEjercicioEstudianteController);
router.post("/grupos/:id/ejercicios/:ejercicioId/completar", completarEjercicioEstudianteController);

export default router;
