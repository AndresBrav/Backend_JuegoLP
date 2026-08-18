import { Request, Response } from "express";
import verifyToken, { AuthenticatedRequest } from "../Middlewares/verifyToken"; // Importa verifyToken
import {
    obtenerUnUsuarioServicio,
    obtenerPuntuacionUsuario,
    obtenerPuntuacionusuarioIA,
    obtenerTodosLosUsuarios,
} from "../Services/usuarioServices";
import {
    actualizar_Estado_Noti,
    mostrar_Notificacion_Servicio,
} from "../Services/notificacionServicio";

/**
 * @swagger
 * /notificaciones/consultar:
 *   get:
 *     tags: [Notificaciones]
 *     summary: Listar las notificaciones no leídas del usuario autenticado
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de notificaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "La lista de notificaciones es:"
 *                 arreglonoti:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notificacion'
 *       401:
 *         description: Token no válido
 *       403:
 *         description: Acceso denegado (sin token)
 */
const mostrar_Notificacion = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    const nombre: string = req.DatosToken?.username;
    const password: string = req.DatosToken?.password;
    const usuario = await obtenerUnUsuarioServicio(nombre, password);
    const usuario_id = usuario.id;

    const arreglo_Notificaciones =
        await mostrar_Notificacion_Servicio(usuario_id);

    console.log(arreglo_Notificaciones);
    res.json({
        msg: "La lista de notificaciones es:",
        arreglonoti: arreglo_Notificaciones,
    });
};

/**
 * @swagger
 * /notificaciones/actualizar/{id}:
 *   put:
 *     tags: [Notificaciones]
 *     summary: Marcar una notificación como leída
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador de la notificación
 *     responses:
 *       200:
 *         description: Notificación actualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: La notificacion fue actualizada
 *       401:
 *         description: Token no válido
 *       403:
 *         description: Acceso denegado (sin token)
 *       500:
 *         description: Error interno
 */
const actualizar_Notificacion = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const estado = await actualizar_Estado_Noti(id);

        if (estado) {
            res.json({
                msg: "La notificacion fue actualizada",
            });
        }

        // Aquí puedes agregar la lógica para actualizar el usuario con el id
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

/**
 * @swagger
 * /notificaciones/puntuacion:
 *   get:
 *     tags: [Notificaciones]
 *     summary: Obtener el ranking de usuarios con su puntuación total
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Ranking de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   username:
 *                     type: string
 *                   puntuacionTotal:
 *                     type: integer
 *       401:
 *         description: Token no válido
 *       403:
 *         description: Acceso denegado (sin token)
 *       500:
 *         description: Error interno
 */
const obtenerUsuarioYPuntuacion = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> => {
    try {
        const usuarios = await obtenerTodosLosUsuarios();

        const usuariosConPuntos = await Promise.all(
            usuarios.map(async (u) => {
                const idUser = u.id;
                const puntuacion = await obtenerPuntuacionUsuario(idUser);
                const puntuacionIA = await obtenerPuntuacionusuarioIA(idUser);
                return {
                    username: u.username,
                    puntuacionTotal: puntuacion + puntuacionIA,
                };
            }),
        );

        res.json(usuariosConPuntos);
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

export {
    mostrar_Notificacion,
    actualizar_Notificacion,
    obtenerUsuarioYPuntuacion,
};
