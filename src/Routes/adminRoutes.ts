import express, { Router } from "express";
import verifyToken from "../Middlewares/verifyToken";
import cargarUsuarioActual from "../Middlewares/cargarUsuarioActual";
import requireRole from "../Middlewares/requireRole";
import {
    crearProfesorController,
    listarProfesoresController,
    listarEstudiantesController,
    listarGruposController,
    reporteGrupoController,
    reporteEstudianteController,
    estadisticasController,
} from "../Controllers/adminController";

const router: Router = express.Router();

router.use(verifyToken, cargarUsuarioActual, requireRole("admin"));

router.get("/profesores", listarProfesoresController);
router.post("/profesores", crearProfesorController);
router.get("/estudiantes", listarEstudiantesController);
router.get("/estudiantes/:id/reporte", reporteEstudianteController);
router.get("/grupos", listarGruposController);
router.get("/grupos/:id/reporte", reporteGrupoController);
router.get("/estadisticas", estadisticasController);

export default router;
