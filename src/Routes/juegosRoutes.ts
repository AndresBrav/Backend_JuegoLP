import express from "express";
import verifyToken from "../Middlewares/verifyToken";
import cargarUsuarioActual from "../Middlewares/cargarUsuarioActual";
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
    obtenerJuegoIAController,
    guardarEstadoTableroController,
    reiniciarEstadoTableroController,
    traerTemariosIAController,
    obtenerCuotaGeneracionIAController,
    generarEjercicioIAController,
    obtenerCuotaRevisionIAController,
    verificarDiagramaIAController,
    verificarPseudocodigoIAController,
} from "../Controllers/juegosIAController";

const router = express.Router();
router.get("/consultar", verifyToken, consultarJuegos);

// Rutas de estado para juegos fijos (1 al 15)
router.get("/estado/:id", verifyToken, obtenerEstadoJuegoController);
router.put("/guardarEstado/:id", verifyToken, guardarEstadoJuegoController);
router.put("/reiniciarEstado/:id", verifyToken, reiniciarEstadoJuegoController);

// cuota compartida entre generación de diagramas y pseudocódigo
router.get(
    "/cuota-generacion-ia",
    verifyToken,
    cargarUsuarioActual,
    obtenerCuotaGeneracionIAController,
);
router.post(
    "/generar-ejercicio-ia",
    verifyToken,
    cargarUsuarioActual,
    generarEjercicioIAController,
);

// temarios globales de IA para clasificar ejercicios de pseudocódigo
router.get("/temarios", verifyToken, traerTemariosIAController);

// trae los juegos con IA que se guardo
router.get("/traerJuegosConIA", verifyToken, traerJuegosController);

router.get("/traerJuegosConIAPseudo", verifyToken, traerJuegosControllerPseudo);

// revisión IA con cuota diaria por ejercicio
router.get(
    "/ia/:id/cuota-revision",
    verifyToken,
    cargarUsuarioActual,
    obtenerCuotaRevisionIAController,
);
router.post(
    "/ia/:id/revisar-diagrama",
    verifyToken,
    cargarUsuarioActual,
    verificarDiagramaIAController,
);
router.post(
    "/ia/:id/revisar-pseudocodigo",
    verifyToken,
    cargarUsuarioActual,
    verificarPseudocodigoIAController,
);

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
