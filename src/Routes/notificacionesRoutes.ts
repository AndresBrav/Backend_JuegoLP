import express, { Request, Response, Router } from "express";
import {
    actualizar_Notificacion,
    mostrar_Notificacion,
} from "../Controllers/notificacionController";
import verifyToken from "../Middlewares/verifyToken";
import { actualizar } from "../Controllers/usuariosController";

const router: Router = express.Router();
router.get("/consultar", verifyToken, mostrar_Notificacion);

router.put("/actualizar/:id", verifyToken, actualizar_Notificacion);

export default router;
