import JuegosIA, { JuegosIAInstance } from "../Models/juegos_iaModel";

export const obtenerTodosLosJuegosIA = async (
    usuario_id: number,
): Promise<JuegosIAInstance[] | null> => {
    const juegos = await JuegosIA.findAll({
        where: { usuario_id, tipo_juego: "ia" },
        raw: true,
    });
    return juegos || [];
};

export const obtenerTodosLosJuegosIAPseudo = async (
    usuario_id: number,
): Promise<JuegosIAInstance[] | null> => {
    const juegos = await JuegosIA.findAll({
        where: { usuario_id, tipo_juego: "iapseudo" },
        raw: true,
    });
    return juegos || [];
};

export const guardarJuegoIA = async (
    usuario_id: number,
    descripcion: string,
    tipo_juego: string,
    completado?: boolean,
    puntos?: number,
): Promise<JuegosIAInstance> => {
    const juegoIA = await JuegosIA.create({
        usuario_id,
        descripcion,
        tipo_juego,
        completado: completado || false,
        puntos: puntos || 0,
    });
    return juegoIA;
};

export const completarJuegoIA = async (
    usuario_id: number,
    juego_id: number,
): Promise<JuegosIAInstance> => {
    const juego = await JuegosIA.findOne({
        where: { id: juego_id, usuario_id },
    });
    if (!juego) {
        throw new Error("No se encontró el juego");
    }

    // incrementar puntos en 5 y marcar como completado
    juego.puntos = (juego.puntos || 0) + 5;
    juego.completado = true;

    await juego.save();
    return juego;
};
