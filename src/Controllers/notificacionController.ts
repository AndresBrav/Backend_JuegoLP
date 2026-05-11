import { Request, Response } from "express";
import verifyToken, { AuthenticatedRequest } from "../Middlewares/verifyToken"; // Importa verifyToken
import { obtenerUnUsuarioServicio } from "../Services/usuarioServices";
import {
    actualizar_Estado_Noti,
    mostrar_Notificacion_Servicio,
} from "../Services/notificacionServicio";

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

export { mostrar_Notificacion, actualizar_Notificacion };
