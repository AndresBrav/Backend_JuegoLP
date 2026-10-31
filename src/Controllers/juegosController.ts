import { Response } from "express";
import { AuthenticatedRequest } from "../Middlewares/verifyToken";
import {
    obtenerTodosLosJuegos,
    obtenerEstadoJuegoServicio,
    guardarEstadoJuegoServicio,
    reiniciarEstadoJuegoServicio,
} from "../Services/juegoServices";
import { obtenerUnUsuarioServicio } from "../Services/usuarioServices";

/**
 * @swagger
 * /juegos/consultar:
 *   get:
 *     tags: [Juegos]
 *     summary: Listar todos los juegos
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de juegos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                 msg:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Juego'
 *       401:
 *         description: Token no válido
 *       403:
 *         description: Acceso denegado (sin token)
 *       500:
 *         description: Error interno
 */
const consultarJuegos = async (req: AuthenticatedRequest, res: Response) => {
    try {
        console.log("Datos del token:", req.DatosToken?.username);
        const juegos = await obtenerTodosLosJuegos();
        res.json({
            username: `los datos son ${req.DatosToken?.username}`,
            msg: juegos,
        });
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

/**
 * @swagger
 * /juegos/estado/{id}:
 *   get:
 *     tags: [Juegos]
 *     summary: Obtener el estado guardado de un juego fijo por ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del juego fijo (1 al 15)
 *     responses:
 *       200:
 *         description: Estado del juego obtenido correctamente
 *       400:
 *         description: ID de juego inválido
 *       401:
 *         description: Token no válido
 *       500:
 *         description: Error interno
 */
const obtenerEstadoJuegoController = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    try {
        const nombre: string = req.DatosToken?.username;
        const password: string = req.DatosToken?.password;
        const usuario = await obtenerUnUsuarioServicio(nombre, password);
        const usuario_id = Number(usuario.id);

        const juego_id = Number(req.params.id);
        if (isNaN(juego_id)) {
            res.status(400).json({ msg: "ID de juego inválido" });
            return;
        }

        const registro = await obtenerEstadoJuegoServicio(usuario_id, juego_id);
        res.json({
            juego_id,
            completado: registro?.completado ?? false,
            puntos: registro?.puntos ?? 0,
            estado_juego: registro?.estado_juego ?? null,
            ultima_actividad: registro?.ultima_actividad ?? null,
        });
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

/**
 * @swagger
 * /juegos/guardarEstado/{id}:
 *   put:
 *     tags: [Juegos]
 *     summary: Guardar el estado / progreso de un juego fijo por ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del juego fijo (1 al 15)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estado_juego:
 *                 type: object
 *                 description: Objeto o arreglo con el estado de fichas/código
 *     responses:
 *       200:
 *         description: Estado del juego guardado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no válido
 *       500:
 *         description: Error interno
 */
const guardarEstadoJuegoController = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    try {
        const nombre: string = req.DatosToken?.username;
        const password: string = req.DatosToken?.password;
        const usuario = await obtenerUnUsuarioServicio(nombre, password);
        const usuario_id = Number(usuario.id);

        const juego_id = Number(req.params.id);
        if (isNaN(juego_id)) {
            res.status(400).json({ msg: "ID de juego inválido" });
            return;
        }

        const { estado_juego } = req.body;
        const estadoString =
            typeof estado_juego === "object"
                ? JSON.stringify(estado_juego)
                : String(estado_juego ?? "");

        const registro = await guardarEstadoJuegoServicio(
            usuario_id,
            juego_id,
            estadoString,
        );

        res.json({
            msg: "Estado del juego guardado correctamente",
            registro,
        });
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

/**
 * @swagger
 * /juegos/reiniciarEstado/{id}:
 *   put:
 *     tags: [Juegos]
 *     summary: Reiniciar el estado guardado de un juego fijo por ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del juego fijo (1 al 15)
 *     responses:
 *       200:
 *         description: Estado reiniciado correctamente
 *       400:
 *         description: ID de juego inválido
 *       401:
 *         description: Token no válido
 *       500:
 *         description: Error interno
 */
const reiniciarEstadoJuegoController = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    try {
        const nombre: string = req.DatosToken?.username;
        const password: string = req.DatosToken?.password;
        const usuario = await obtenerUnUsuarioServicio(nombre, password);
        const usuario_id = Number(usuario.id);

        const juego_id = Number(req.params.id);
        if (isNaN(juego_id)) {
            res.status(400).json({ msg: "ID de juego inválido" });
            return;
        }

        const resultado = await reiniciarEstadoJuegoServicio(
            usuario_id,
            juego_id,
        );
        res.json(resultado);
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

export {
    consultarJuegos,
    obtenerEstadoJuegoController,
    guardarEstadoJuegoController,
    reiniciarEstadoJuegoController,
};