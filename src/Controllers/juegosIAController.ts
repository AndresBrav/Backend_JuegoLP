import { Request, Response } from "express";
import verifyToken, { AuthenticatedRequest } from "../Middlewares/verifyToken";
import { obtenerUnUsuarioServicio } from "../Services/usuarioServices";
import {
    obtenerTodosLosJuegosIA,
    guardarJuegoIA,
} from "../Services/juegosiaServicios";

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

export { traerJuegosController, guardarJuegoIAController };
