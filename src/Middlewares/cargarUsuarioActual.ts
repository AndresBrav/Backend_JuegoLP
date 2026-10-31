import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./verifyToken";
import Usuarios from "../Models/usuarioModel";
import { Rol, UsuarioAutenticado } from "../interfaces/Usuario";

export interface RequestAutenticado extends AuthenticatedRequest {
    usuarioActual?: UsuarioAutenticado;
}

/**
 * Después de verifyToken, carga al usuario real desde la base de datos.
 * Así el rol y el código no dependen de un token de 30 días.
 * Soporta tokens antiguos que solo traían username + password.
 */
const cargarUsuarioActual = async (
    req: RequestAutenticado,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const datos = req.DatosToken;

        if (!datos) {
            res.status(401).json({ message: "No autenticado" });
            return;
        }

        const id = datos.id ? Number(datos.id) : null;

        const usuario = id
            ? await Usuarios.findByPk(id)
            : await Usuarios.findOne({
                  where: {
                      username: datos.username,
                      password: datos.password,
                  },
              });

        if (!usuario || !usuario.id) {
            res.status(401).json({ message: "Usuario no encontrado" });
            return;
        }

        req.usuarioActual = {
            id: Number(usuario.id),
            codigo: String(usuario.codigo ?? ""),
            username: String(usuario.username ?? ""),
            rol: (usuario.rol ?? "estudiante") as Rol,
        };

        next();
    } catch (error) {
        console.error("ERROR cargarUsuarioActual:", error);
        res.status(500).json({ message: "Error al cargar el usuario" });
    }
};

export default cargarUsuarioActual;
