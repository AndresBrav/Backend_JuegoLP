import express from "express";
import verifyToken, { AuthenticatedRequest } from "../Middlewares/verifyToken";
import { consultarJuegos } from "../Controllers/juegosController";
import {
    traerJuegosController,
    guardarJuegoIAController,
    traerJuegosControllerPseudo,
    completarJuegoController,
    obtenerGeminiKeyController,
} from "../Controllers/juegosIAController";

const router = express.Router();
router.get("/consultar", verifyToken, consultarJuegos);

// obtener la API key de Gemini para el cliente autenticado
router.get("/gemini-key", verifyToken, obtenerGeminiKeyController);

// trae los juegos con IA que se guardo
router.get("/traerJuegosConIA", verifyToken, traerJuegosController);

router.get("/traerJuegosConIAPseudo", verifyToken, traerJuegosControllerPseudo);

// guarda un nuevo juego con IA
router.post("/guardarjuegoIA", verifyToken, guardarJuegoIAController);

// marcar juego como completado e incrementar puntos
router.put("/completar/:id", verifyToken, completarJuegoController);

export default router;
