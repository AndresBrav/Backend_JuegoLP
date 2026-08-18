import { Request, Response } from "express";
import { obtenerAvataresServicios, obtenerUnAvatarServicios } from "../Services/avatarServicios";

/**
 * @swagger
 * /avatares/getAvatares:
 *   get:
 *     tags: [Avatares]
 *     summary: Listar todos los avatares
 *     responses:
 *       200:
 *         description: Lista de avatares
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Avatar'
 */
export const obtenerAvataresController = async (req: Request, res: Response) => {
    const avatares = await obtenerAvataresServicios();
    res.json(avatares);
}

/**
 * @swagger
 * /avatares/getOneAvatar/{id}:
 *   get:
 *     tags: [Avatares]
 *     summary: Obtener un avatar por su id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador del avatar
 *     responses:
 *       200:
 *         description: Avatar encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Avatar'
 */
export const obtenerUno = async (req: Request, res: Response) => {
    const { id } = req.params;
    const avatar = await obtenerUnAvatarServicios(id);
    res.json(avatar);
}

