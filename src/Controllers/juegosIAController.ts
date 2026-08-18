import { Request, Response } from "express";
import verifyToken, { AuthenticatedRequest } from "../Middlewares/verifyToken";
import { obtenerUnUsuarioServicio } from "../Services/usuarioServices";
import {
    obtenerTodosLosJuegosIA,
    guardarJuegoIA,
    obtenerTodosLosJuegosIAPseudo,
} from "../Services/juegosiaServicios";
import { completarJuegoIA } from "../Services/juegosiaServicios";

/**
 * @swagger
 * /juegos/traerJuegosConIA:
 *   get:
 *     tags: [Juegos IA]
 *     summary: Listar los juegos de IA guardados del usuario autenticado
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de juegos IA
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 juegosIA:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/JuegosIA'
 *                 msg:
 *                   type: string
 *       401:
 *         description: Token no válido
 *       403:
 *         description: Acceso denegado (sin token)
 *       500:
 *         description: Error interno
 */
const traerJuegosController = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    try {
        const nombre: string = req.DatosToken?.username;
        const password: string = req.DatosToken?.password;
        const usuario = await obtenerUnUsuarioServicio(nombre, password);
        const usuario_id = usuario.id;

        const juegosIA = await obtenerTodosLosJuegosIA(usuario_id); //llama al Servicio
        console.log(juegosIA);
        res.json({
            juegosIA: juegosIA,
            msg: "esta es la lista de juegos con IA que se guardo",
        });
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

/**
 * @swagger
 * /juegos/traerJuegosConIAPseudo:
 *   get:
 *     tags: [Juegos IA]
 *     summary: Listar los juegos IA (pseudo) guardados del usuario autenticado
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de juegos IA pseudo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 juegosIA:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/JuegosIA'
 *                 msg:
 *                   type: string
 *       401:
 *         description: Token no válido
 *       403:
 *         description: Acceso denegado (sin token)
 *       500:
 *         description: Error interno
 */
const traerJuegosControllerPseudo = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    try {
        const nombre: string = req.DatosToken?.username;
        const password: string = req.DatosToken?.password;
        const usuario = await obtenerUnUsuarioServicio(nombre, password);
        const usuario_id = usuario.id;

        const juegosIA = await obtenerTodosLosJuegosIAPseudo(usuario_id); //llama al Servicio
        console.log(juegosIA);
        res.json({
            juegosIA: juegosIA,
            msg: "esta es la lista de juegos con IA que se guardo",
        });
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

/**
 * @swagger
 * /juegos/guardarjuegoIA:
 *   post:
 *     tags: [Juegos IA]
 *     summary: Guardar un nuevo juego generado con IA
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - descripcion
 *               - tipo_juego
 *             properties:
 *               descripcion:
 *                 type: string
 *               tipo_juego:
 *                 type: string
 *                 enum: [ia, iapseudo]
 *               completado:
 *                 type: boolean
 *               puntos:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Juego IA guardado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Juego IA guardado correctamente
 *                 juegoIA:
 *                   $ref: '#/components/schemas/JuegosIA'
 *       400:
 *         description: descripcion y tipo_juego son requeridos
 *       401:
 *         description: Token no válido
 *       403:
 *         description: Acceso denegado (sin token)
 *       500:
 *         description: Error interno
 */
const guardarJuegoIAController = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    try {
        const nombre: string = req.DatosToken?.username;
        const password: string = req.DatosToken?.password;
        const usuario = await obtenerUnUsuarioServicio(nombre, password);
        const usuario_id = usuario.id;

        const { descripcion, tipo_juego, completado, puntos } = req.body;

        if (!descripcion || !tipo_juego) {
            res.status(400).json({
                msg: "descripcion y tipo_juego son requeridos",
            });
            return;
        }

        const juegoIA = await guardarJuegoIA(
            usuario_id,
            descripcion,
            tipo_juego,
            completado,
            puntos,
        );

        res.status(201).json({
            msg: "Juego IA guardado correctamente",
            juegoIA,
        });
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

/**
 * @swagger
 * /juegos/completar/{id}:
 *   put:
 *     tags: [Juegos IA]
 *     summary: Marcar un juego IA como completado e incrementar puntos
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identificador del juego IA
 *     responses:
 *       200:
 *         description: Juego actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Juego actualizado correctamente
 *                 juego:
 *                   $ref: '#/components/schemas/JuegosIA'
 *       400:
 *         description: id de juego inválido
 *       401:
 *         description: Token no válido
 *       403:
 *         description: Acceso denegado (sin token)
 *       500:
 *         description: Error interno
 */
const completarJuegoController = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    try {
        const nombre: string = req.DatosToken?.username;
        const password: string = req.DatosToken?.password;
        const usuario = await obtenerUnUsuarioServicio(nombre, password);
        const usuario_id = usuario.id;

        const juego_id = Number(req.params.id);
        if (isNaN(juego_id)) {
            res.status(400).json({ msg: "id de juego inválido" });
            return;
        }

        const juegoActualizado = await completarJuegoIA(usuario_id, juego_id);

        res.json({
            msg: "Juego actualizado correctamente",
            juego: juegoActualizado,
        });
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

export {
    traerJuegosController,
    guardarJuegoIAController,
    completarJuegoController,
    traerJuegosControllerPseudo,
};
