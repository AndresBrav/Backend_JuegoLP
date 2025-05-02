import Juego from "../Models/juegoModel";

export const obtenerTodosLosJuegos = async (): Promise<any> => {
    const juegos = await Juego.findAll();
    if (!juegos || juegos.length === 0) {
      throw new Error('No se encontraron juegos');
    }
    return juegos;
  };