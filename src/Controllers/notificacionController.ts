import { Request, Response } from "express";
import verifyToken, { AuthenticatedRequest } from "../Middlewares/verifyToken"; // Importa verifyToken
import { obtenerUnUsuarioServicio } from "../Services/usuarioServices";
import { mostrar_Notificacion_Servicio } from "../Services/notificacionServicio";

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

export { mostrar_Notificacion };
