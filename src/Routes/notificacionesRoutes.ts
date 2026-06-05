import express, { Request, Response, Router } from "express";
import {
    actualizar_Notificacion,
    mostrar_Notificacion,
} from "../Controllers/notificacionController";
import verifyToken from "../Middlewares/verifyToken";
import { obtenerUsuarioYPuntuacion } from "../Controllers/notificacionController";

const router: Router = express.Router();
router.get("/consultar", verifyToken, mostrar_Notificacion);

router.get("/puntuacion", verifyToken, obtenerUsuarioYPuntuacion);

router.put("/actualizar/:id", verifyToken, actualizar_Notificacion);

export default router;
