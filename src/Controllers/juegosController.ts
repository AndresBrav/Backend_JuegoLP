import { Request, Response } from "express";
import jwt from "jsonwebtoken";  // Asegúrate de importar jsonwebtoken
// import cors from "cors";
import verifyToken, { AuthenticatedRequest } from "../Middlewares/verifyToken"; 
import { obtenerTodosLosJuegos } from "../Services/juegoServices";

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