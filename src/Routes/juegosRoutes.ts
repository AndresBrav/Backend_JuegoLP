import express from "express";
import verifyToken from "../Middlewares/verifyToken";
import {
    consultarJuegos,
    obtenerEstadoJuegoController,
    guardarEstadoJuegoController,
    reiniciarEstadoJuegoController,
} from "../Controllers/juegosController";
import {
    traerJuegosController,
    guardarJuegoIAController,
    traerJuegosControllerPseudo,
    completarJuegoController,
    obtenerGeminiKeyController,
    obtenerJuegoIAController,
    guardarEstadoTableroController,
    reiniciarEstadoTableroController,
} from "../Controllers/juegosIAController";

const router = express.Router();
router.get("/consultar", verifyToken, consultarJuegos);

// Rutas de estado para juegos fijos (1 al 15)
router.get("/estado/:id", verifyToken, obtenerEstadoJuegoController);
router.put("/guardarEstado/:id", verifyToken, guardarEstadoJuegoController);
router.put("/reiniciarEstado/:id", verifyToken, reiniciarEstadoJuegoController);

// obtener la API key de Gemini para el cliente autenticado
router.get("/gemini-key", verifyToken, obtenerGeminiKeyController);

// trae los juegos con IA que se guardo
router.get("/traerJuegosConIA", verifyToken, traerJuegosController);

router.get("/traerJuegosConIAPseudo", verifyToken, traerJuegosControllerPseudo);

// obtener juego IA individual con estado de tablero
router.get("/ia/:id", verifyToken, obtenerJuegoIAController);

// guarda un nuevo juego con IA
router.post("/guardarjuegoIA", verifyToken, guardarJuegoIAController);

// guardar estado / progreso del tablero de IA
router.put("/guardarTablero/:id", verifyToken, guardarEstadoTableroController);

// restablecer estado del tablero de IA a null
router.put(
    "/reiniciarTablero/:id",
    verifyToken,
    reiniciarEstadoTableroController,
);

// marcar juego como completado e incrementar puntos
router.put("/completar/:id", verifyToken, completarJuegoController);

export default router;
