import Notificaciones, {
    NotificacionesInstance,
} from "../Models/NotificacionesModel";

export const mostrar_Notificacion_Servicio = async (
    usuario_id: number,
): Promise<NotificacionesInstance[]> => {
    // notificacines de un usuario
    const arregloNotificacion: NotificacionesInstance[] =
        await Notificaciones.findAll({
            attributes: ["id", "descripcion"],
            where: {
                usuario_id: usuario_id,
                leido: false,
            },
            raw: true,
        });
    return arregloNotificacion;
};
