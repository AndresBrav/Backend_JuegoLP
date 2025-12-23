import { Request, Response } from "express";
import { obtenerAvataresServicios, obtenerUnAvatarServicios } from "../Services/avatarServicios";

export const obtenerAvataresController = async (req: Request, res: Response) => {
    const avatares = await obtenerAvataresServicios();
    res.json(avatares);
}

export const obtenerUno = async (req: Request, res: Response) => {
    const { id } = req.params;
    const avatar = await obtenerUnAvatarServicios(id);
    res.json(avatar);
}

