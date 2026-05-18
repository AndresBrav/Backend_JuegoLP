import { Request, Response } from "express";
import jwt from "jsonwebtoken"; // Asegúrate de importar jsonwebtoken
// import cors from "cors";
import verifyToken, { AuthenticatedRequest } from "../Middlewares/verifyToken";
import { obtenerTodosLosJuegos } from "../Services/juegoServices";
import { obtenerUnUsuarioServicio } from "../Services/usuarioServices";

const traerJuegosController = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    try {
        const nombre: string = req.DatosToken?.username;
        const password: string = req.DatosToken?.password;
        const resultado = await obtenerUnUsuarioServicio(nombre, password);

        const juegos = await obtenerTodosLosJuegos(); //llama al Servicio
        res.json({
            username: `el resultado es : ${resultado}`,
            msg: juegos,
        });
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

export { traerJuegosController };
