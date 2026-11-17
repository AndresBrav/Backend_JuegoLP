import { Router } from "express";
import verifyToken from "../Middlewares/verifyToken";
import cargarUsuarioActual from "../Middlewares/cargarUsuarioActual";
import requireRole from "../Middlewares/requireRole";
import {
    unirseAGrupoController,
    misGruposController,
    salirDeGrupoController,
    listarTemariosController,
    listarEjerciciosController,
    obtenerEjercicioController,
    guardarEstadoController,
    completarEjercicioController,
    rankingGrupoController,
} from "../Controllers/estudianteController";

const router = Router();

// Todo el módulo estudiante exige sesión y rol estudiante
// (admin siempre pasa por requireRole).
router.use(verifyToken, cargarUsuarioActual, requireRole("estudiante"));

router.post("/grupos/unirse", unirseAGrupoController);
router.get("/grupos", misGruposController);
router.delete("/grupos/:id", salirDeGrupoController);

router.get("/grupos/:id/temarios", listarTemariosController);
router.get("/grupos/:id/ejercicios", listarEjerciciosController);
router.get("/grupos/:id/ranking", rankingGrupoController);
router.get(
    "/grupos/:id/ejercicios/:ejercicioId",
    obtenerEjercicioController,
);
router.put(
    "/grupos/:id/ejercicios/:ejercicioId/estado",
    guardarEstadoController,
);
router.post(
    "/grupos/:id/ejercicios/:ejercicioId/completar",
    completarEjercicioController,
);

export default router;
