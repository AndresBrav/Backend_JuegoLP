import JuegosIA, { JuegosIAInstance } from "../Models/juegos_iaModel";

export const obtenerTodosLosJuegosIA = async (
    usuario_id: number,
): Promise<JuegosIAInstance[] | null> => {
    const juegos = await JuegosIA.findAll({ where: { usuario_id }, raw: true });
    if (!juegos || juegos.length === 0) {
        throw new Error("No se encontraron juegos");
    }
    return juegos;
};
