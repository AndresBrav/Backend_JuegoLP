import express from "express";
import verifyToken, { AuthenticatedRequest } from "../Middlewares/verifyToken";
import { consultarJuegos } from "../Controllers/juegosController";
import {
    traerJuegosController,
    guardarJuegoIAController,
    traerJuegosControllerPseudo,
} from "../Controllers/juegosIAController";
import { completarJuegoController } from "../Controllers/juegosIAController";

const router = express.Router();
router.get("/consultar", verifyToken, consultarJuegos);

// trae los juegos con IA que se guardo
router.get("/traerJuegosConIA", verifyToken, traerJuegosController);

router.get("/traerJuegosConIAPseudo", verifyToken, traerJuegosControllerPseudo);

// guarda un nuevo juego con IA
router.post("/guardarjuegoIA", verifyToken, guardarJuegoIAController);

// marcar juego como completado e incrementar puntos
router.put("/completar/:id", verifyToken, completarJuegoController);

export default router;
