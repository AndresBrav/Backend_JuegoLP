import express, { Router } from "express";
import {
    consultarUsuarios,
    consultarDetalle,
    ingresar,
    actualizar,
    borrar,
    RegistrarLogin,
    iniciarSesion,
    traerMiPerfil,
    miProgreso,
    traerDatosUnUsuario,
    traerPuntuacion,
    traerJuegosCompletados,
    aumentarPuntuacion,
    actualizarPefilFoto,
} from "../Controllers/usuariosController";
import verifyToken from "../Middlewares/verifyToken";
import cargarUsuarioActual from "../Middlewares/cargarUsuarioActual";
import * as dotenv from "dotenv";
dotenv.config();

const router: Router = express.Router();

router.get("/consultar", verifyToken, consultarUsuarios);

router.post("/ingresar", verifyToken, ingresar);

router
    .route("/detalles/:id")
    .get(verifyToken, consultarDetalle)
    .put(verifyToken, actualizar)
    .delete(verifyToken, borrar);

router.post("/login/registrar", RegistrarLogin);

/**
 * @swagger
 * /usuarios/login/iniciar:
 *   post:
 *     tags: [Usuarios]
 *     summary: Iniciar sesión con username o código institucional
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Nombre de usuario o código institucional
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token de acceso o mensaje de error
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/AuthResponse'
 *                 - type: object
 *                   properties:
 *                     msg:
 *                       type: string
 *                       example: el usuario que ingresaste no existe Registrate
 *       400:
 *         description: Faltan datos en la solicitud
 */
router.post("/login/iniciar", iniciarSesion);

router.get("/me", verifyToken, cargarUsuarioActual, traerMiPerfil);

/**
 * @swagger
 * /usuarios/me/progreso:
 *   get:
 *     tags: [Usuarios]
 *     summary: Progreso propio (fijos, IA y total) para el dashboard
 *     security:
 *       - BearerAuth: []
 */
router.get("/me/progreso", verifyToken, cargarUsuarioActual, miProgreso);

// Ruta protegida que requiere token
router.get("/traerDatosUsuario", verifyToken, traerDatosUnUsuario);

router.get("/traerpuntuacion", verifyToken, traerPuntuacion);

router.get("/traerJuegosCompletados", verifyToken, traerJuegosCompletados);

router.put(
    "/incrpuntos/:idjuego",
    verifyToken,
    cargarUsuarioActual,
    aumentarPuntuacion,
);

router.put("/actualizarPefilFoto/:idFoto", verifyToken, actualizarPefilFoto);

export default router;
