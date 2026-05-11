import Notificaciones, {
    NotificacionesInstance,
} from "../Models/NotificacionesModel";

export const mostrar_Notificacion_Servicio = async (
    usuario_id: number,
): Promise<NotificacionesInstance[]> => {
    // notificacines de un usuario
    const arregloNotificacion: NotificacionesInstance[] =
        await Notificaciones.findAll({
            attributes: ["id", "descripcion", "fecha"],
            where: {
                usuario_id: usuario_id,
                leido: false,
            },
            raw: true,
        });
    return arregloNotificacion;
};

export const actualizar_Estado_Noti = async (id: string): Promise<boolean> => {
    try {
        const notificacion = await Notificaciones.findByPk(id);

        if (!notificacion) {
            throw new Error("notificacion no encontrada");
            return false;
        } else {
            notificacion.leido = true;
            await notificacion.save();
            return true;
        }
    } catch (error) {
        throw error;
    }
};
