import express from "express";
import verifyToken, { AuthenticatedRequest } from "../Middlewares/verifyToken";
import { consultarJuegos } from "../Controllers/juegosController";
import {
    traerJuegosController,
    guardarJuegoIAController,
} from "../Controllers/juegosIAController";

const router = express.Router();
router.get("/consultar", verifyToken, consultarJuegos);

// trae los juegos con IA que se guardo
router.get("/traerJuegosConIA", verifyToken, traerJuegosController);

// guarda un nuevo juego con IA
router.post("/guardarjuegoIA", verifyToken, guardarJuegoIAController);

export default router;
