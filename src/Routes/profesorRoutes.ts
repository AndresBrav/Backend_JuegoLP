import express, { Router } from "express";
import verifyToken from "../Middlewares/verifyToken";
import cargarUsuarioActual from "../Middlewares/cargarUsuarioActual";
import requireRole from "../Middlewares/requireRole";
import {
    crearGrupoController,
    listarGruposController,
    obtenerGrupoController,
    eliminarGrupoController,
    reporteGrupoController,
    reporteEstudianteController,
    crearEjercicioGrupoController,
    listarEjerciciosGrupoController,
    editarEjercicioGrupoController,
    eliminarEjercicioGrupoController,
    listarSolucionesEjercicioController,
    calificarEntregaController,
    obtenerRankingGrupoProfesorController,
    listarTemariosGrupoController,
    crearTemarioGrupoController,
    editarTemarioController,
    eliminarTemarioController,
    reordenarTemariosController,
} from "../Controllers/profesorController";

const router: Router = express.Router();

router.use(verifyToken, cargarUsuarioActual, requireRole("profesor"));

router.post("/grupos", crearGrupoController);
router.get("/grupos", listarGruposController);
router.get("/grupos/:id", obtenerGrupoController);
router.delete("/grupos/:id", eliminarGrupoController);
router.get("/grupos/:id/reporte", reporteGrupoController);
router.get("/grupos/:id/ranking", obtenerRankingGrupoProfesorController);
router.get("/estudiantes/:id/reporte", reporteEstudianteController);

// Ejercicios dentro del grupo
router.get("/grupos/:id/ejercicios", listarEjerciciosGrupoController);
router.post("/grupos/:id/ejercicios", crearEjercicioGrupoController);
router.put("/ejercicios/:id", editarEjercicioGrupoController);
router.delete("/ejercicios/:id", eliminarEjercicioGrupoController);
router.get("/ejercicios/:id/soluciones", listarSolucionesEjercicioController);
router.put("/ejercicios/:id/calificar/:estudianteId", calificarEntregaController);

// Temarios del grupo
router.get("/grupos/:id/temarios", listarTemariosGrupoController);
router.post("/grupos/:id/temarios", crearTemarioGrupoController);
router.put("/grupos/:id/temarios/reordenar", reordenarTemariosController);
router.put("/temarios/:id", editarTemarioController);
router.delete("/temarios/:id", eliminarTemarioController);

export default router;
