import { Request, Response } from "express";
import jwt from "jsonwebtoken";  // Asegúrate de importar jsonwebtoken
// import cors from "cors";
import verifyToken, { AuthenticatedRequest } from "../Middlewares/verifyToken"; 
import { obtenerTodosLosJuegos } from "../Services/juegoServices";

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
        console.log("Datos del token:", req.DatosToken?.username); // Sin await
        const juegos = await obtenerTodosLosJuegos();  //llama al Servicio
        res.json({
            username: `los datos son ${req.DatosToken.username}`,
            msg: juegos
        });
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

export {consultarJuegos}