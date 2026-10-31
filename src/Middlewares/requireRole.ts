import { Response, NextFunction } from "express";
import { RequestAutenticado } from "./cargarUsuarioActual";
import { Rol } from "../interfaces/Usuario";

/**
 * Restringe una ruta a los roles indicados.
 * El rol admin siempre tiene acceso.
 * Debe usarse después de verifyToken y cargarUsuarioActual.
 */
const requireRole =
    (...roles: Rol[]) =>
    (
        req: RequestAutenticado,
        res: Response,
        next: NextFunction,
    ): void => {
        const usuario = req.usuarioActual;

        if (!usuario) {
            res.status(401).json({ message: "No autenticado" });
            return;
        }

        if (usuario.rol === "admin" || roles.includes(usuario.rol)) {
            next();
            return;
        }

        res.status(403).json({
            message: "No tienes permisos para realizar esta acción",
        });
    };

export default requireRole;
