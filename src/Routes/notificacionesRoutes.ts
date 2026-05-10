import express, { Request, Response, Router } from "express";
import { mostrar_Notificacion } from "../Controllers/notificacionController";
import verifyToken from "../Middlewares/verifyToken";

const router: Router = express.Router();
router.get("/consultar", verifyToken, mostrar_Notificacion);

export default router;
