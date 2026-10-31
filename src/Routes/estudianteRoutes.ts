import express, { Router } from "express";
import verifyToken from "../Middlewares/verifyToken";
import cargarUsuarioActual from "../Middlewares/cargarUsuarioActual";
import requireRole from "../Middlewares/requireRole";
import {
    unirseAGrupoController,
    misGruposController,
    salirDeGrupoController,
    miProgresoController,
} from "../Controllers/estudianteController";

const router: Router = express.Router();

router.use(verifyToken, cargarUsuarioActual, requireRole("estudiante"));

router.post("/grupos/unirse", unirseAGrupoController);
router.get("/grupos", misGruposController);
router.delete("/grupos/:id", salirDeGrupoController);
router.get("/progreso", miProgresoController);

export default router;
