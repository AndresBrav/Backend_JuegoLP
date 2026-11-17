import { Response } from "express";
import { RequestAutenticado } from "../Middlewares/cargarUsuarioActual";
import { reporteGrupo } from "../Services/reporteServices";

/** Reporte del grupo para su profesor o para administración. */
export const reporteGrupoController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    const usuario = req.usuarioActual;
    if (!usuario) {
        res.status(401).json({ message: "No autenticado" });
        return;
    }

    if (usuario.rol !== "profesor" && usuario.rol !== "admin") {
        res.status(403).json({ message: "No tienes permiso para ver reportes" });
        return;
    }

    const grupoId = Number(req.params.id);
    if (!Number.isInteger(grupoId) || grupoId <= 0) {
        res.status(400).json({ message: "El identificador del grupo no es válido" });
        return;
    }

    try {
        const reporte = await reporteGrupo(grupoId, usuario.id, usuario.rol);
        if (!reporte) {
            res.status(404).json({
                message: "El grupo no existe o no tienes acceso a su reporte",
            });
            return;
        }
        res.json(reporte);
    } catch (error) {
        console.error("ERROR reporteGrupoController:", error);
        res.status(500).json({ message: "No se pudo cargar el reporte del grupo" });
    }
};
