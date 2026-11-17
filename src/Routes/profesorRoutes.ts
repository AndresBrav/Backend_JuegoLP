import { Router } from "express";
import verifyToken from "../Middlewares/verifyToken";
import cargarUsuarioActual from "../Middlewares/cargarUsuarioActual";
import requireRole from "../Middlewares/requireRole";
import {
    crearGrupoController,
    listarGruposController,
    obtenerGrupoController,
    eliminarGrupoController,
    listarTemariosController,
    crearTemarioController,
    reordenarTemariosController,
    editarTemarioController,
    eliminarTemarioController,
    listarEjerciciosController,
    crearEjercicioController,
    editarEjercicioController,
    eliminarEjercicioController,
    listarSolucionesController,
    calificarEntregaController,
    guardarComentarioController,
    rankingGrupoController,
} from "../Controllers/profesorController";

const router = Router();

// Todo el módulo profesor exige sesión y rol profesor
// (admin siempre pasa por requireRole).
router.use(verifyToken, cargarUsuarioActual, requireRole("profesor"));

router.post("/grupos", crearGrupoController);
router.get("/grupos", listarGruposController);
router.get("/grupos/:id", obtenerGrupoController);
router.delete("/grupos/:id", eliminarGrupoController);

// Temarios dentro del grupo
router.get("/grupos/:id/temarios", listarTemariosController);
router.post("/grupos/:id/temarios", crearTemarioController);
router.put("/grupos/:id/temarios/reordenar", reordenarTemariosController);
router.put("/temarios/:id", editarTemarioController);
router.delete("/temarios/:id", eliminarTemarioController);

// Ejercicios de grupo (creados por el profesor)
router.get("/grupos/:id/ejercicios", listarEjerciciosController);
router.post("/grupos/:id/ejercicios", crearEjercicioController);
router.put("/ejercicios/:id", editarEjercicioController);
router.delete("/ejercicios/:id", eliminarEjercicioController);
router.get("/ejercicios/:id/soluciones", listarSolucionesController);
router.put(
    "/ejercicios/:id/calificar/:estudianteId",
    calificarEntregaController,
);
router.put(
    "/ejercicios/:id/comentario/:estudianteId",
    guardarComentarioController,
);

// Ranking del grupo
router.get("/grupos/:id/ranking", rankingGrupoController);

export default router;
