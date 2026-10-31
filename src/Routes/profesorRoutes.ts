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
} from "../Controllers/profesorController";

const router: Router = express.Router();

router.use(verifyToken, cargarUsuarioActual, requireRole("profesor"));

router.post("/grupos", crearGrupoController);
router.get("/grupos", listarGruposController);
router.get("/grupos/:id", obtenerGrupoController);
router.delete("/grupos/:id", eliminarGrupoController);
router.get("/grupos/:id/reporte", reporteGrupoController);
router.get("/estudiantes/:id/reporte", reporteEstudianteController);

export default router;
