import { Request, Response } from "express";
import jwt from "jsonwebtoken"; // Asegúrate de importar jsonwebtoken
// import cors from "cors";
import verifyToken, { AuthenticatedRequest } from "../Middlewares/verifyToken";
import { obtenerTodosLosJuegos } from "../Services/juegoServices";
import { obtenerUnUsuarioServicio } from "../Services/usuarioServices";
import { obtenerTodosLosJuegosIA } from "../Services/juegosiaServicios";
import Juegos from "../Models/juegoModel";

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
        // const juegos = await obtenerTodosLosJuegos(); //llama al Servicio
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

export { traerJuegosController };
