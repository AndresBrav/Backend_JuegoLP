import Juego from "../Models/juegoModel";
import UsuarioJuegos from "../Models/usuario_juegosModel";

export const obtenerTodosLosJuegos = async (): Promise<any> => {
    const juegos = await Juego.findAll();
    if (!juegos || juegos.length === 0) {
        throw new Error("No se encontraron juegos");
    }
    return juegos;
};

export const obtenerEstadoJuegoServicio = async (
    usuarioId: number,
    juegoId: number,
) => {
    const registro = await UsuarioJuegos.findOne({
        where: { usuario_id: usuarioId, juego_id: juegoId },
    });
    return registro;
};

export const guardarEstadoJuegoServicio = async (
    usuarioId: number,
    juegoId: number,
    estadoJuego: string,
) => {
    const ahora = new Date();
    let registro = await UsuarioJuegos.findOne({
        where: { usuario_id: usuarioId, juego_id: juegoId },
    });

    if (!registro) {
        registro = await UsuarioJuegos.create({
            usuario_id: usuarioId,
            juego_id: juegoId,
            completado: false,
            puntos: 0,
            intentos: 0,
            estado_juego: estadoJuego,
            ultima_actividad: ahora,
        });
    } else {
        registro.estado_juego = estadoJuego;
        registro.ultima_actividad = ahora;
        await registro.save();
    }

    return registro;
};

export const reiniciarEstadoJuegoServicio = async (
    usuarioId: number,
    juegoId: number,
) => {
    const registro = await UsuarioJuegos.findOne({
        where: { usuario_id: usuarioId, juego_id: juegoId },
    });

    if (registro) {
        registro.estado_juego = null;
        registro.ultima_actividad = new Date();
        await registro.save();
    }

    return { ok: true, mensaje: "Estado del juego reiniciado correctamente" };
};