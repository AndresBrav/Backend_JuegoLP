import JuegosIA, { JuegosIAInstance } from "../Models/juegos_iaModel";
import UsuarioJuegosIA, {
    UsuarioJuegosIAInstance,
} from "../Models/usuario_juegosIAModel";

export interface JuegoIAPlano {
    id: number;
    descripcion: string;
    tipo_juego: string;
    usuario_id: number;
    completado: boolean;
    puntos: number;
    estado_tablero: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

const extraerProgreso = (juegoInstance: any) => {
    const raw = juegoInstance?.toJSON ? juegoInstance.toJSON() : juegoInstance;
    if (!raw) return null;
    const arrayProgreso = raw.UsuarioJuegosIAs || raw.UsuarioJuegosIA;
    if (Array.isArray(arrayProgreso)) {
        return arrayProgreso[0] || null;
    }
    return arrayProgreso || null;
};

const aplanarJuego = (juego: any): JuegoIAPlano => {
    const raw = juego?.toJSON ? juego.toJSON() : juego;
    const progreso = extraerProgreso(raw);

    return {
        id: Number(raw.id),
        descripcion: raw.descripcion,
        tipo_juego: raw.tipo_juego,
        usuario_id: Number(raw.usuario_id),
        completado: Boolean(progreso?.completado),
        puntos: Number(progreso?.puntos ?? 0),
        estado_tablero: progreso?.estado_tablero ?? null,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
    };
};

export const obtenerTodosLosJuegosIA = async (
    usuario_id: number,
): Promise<JuegoIAPlano[]> => {
    const juegos = await JuegosIA.findAll({
        where: { usuario_id, tipo_juego: "ia" },
        include: [
            {
                model: UsuarioJuegosIA,
                where: { usuario_id },
                required: false,
            },
        ],
        order: [["id", "ASC"]],
    });

    return juegos.map(aplanarJuego);
};

export const obtenerTodosLosJuegosIAPseudo = async (
    usuario_id: number,
): Promise<JuegoIAPlano[]> => {
    const juegos = await JuegosIA.findAll({
        where: { usuario_id, tipo_juego: "iapseudo" },
        include: [
            {
                model: UsuarioJuegosIA,
                where: { usuario_id },
                required: false,
            },
        ],
        order: [["id", "ASC"]],
    });

    return juegos.map(aplanarJuego);
};

export const guardarJuegoIA = async (
    usuario_id: number,
    descripcion: string,
    tipo_juego: string,
    completado?: boolean,
    puntos?: number,
): Promise<JuegoIAPlano> => {
    const juegoIA = await JuegosIA.create({
        usuario_id,
        descripcion,
        tipo_juego,
    });

    const estaCompletado = Boolean(completado);
    const puntosIniciales = Number(puntos || 0);

    const progreso = await UsuarioJuegosIA.create({
        usuario_id,
        juego_ia_id: juegoIA.id,
        completado: estaCompletado,
        puntos: puntosIniciales,
        estado_tablero: null,
        fecha_completado: estaCompletado ? new Date() : null,
        ultima_actividad: new Date(),
    });

    return {
        id: Number(juegoIA.id),
        descripcion: juegoIA.descripcion,
        tipo_juego: juegoIA.tipo_juego,
        usuario_id: Number(juegoIA.usuario_id),
        completado: Boolean(progreso.completado),
        puntos: Number(progreso.puntos ?? 0),
        estado_tablero: progreso.estado_tablero ?? null,
        createdAt: juegoIA.createdAt,
        updatedAt: juegoIA.updatedAt,
    };
};

export const completarJuegoIA = async (
    usuario_id: number,
    juego_id: number,
): Promise<JuegoIAPlano> => {
    const juego = await JuegosIA.findOne({
        where: { id: juego_id, usuario_id },
    });
    if (!juego) {
        throw new Error("No se encontró el juego");
    }

    let progreso = await UsuarioJuegosIA.findOne({
        where: { juego_ia_id: juego_id, usuario_id },
    });

    if (!progreso) {
        progreso = await UsuarioJuegosIA.create({
            usuario_id,
            juego_ia_id: juego_id,
            completado: true,
            puntos: 5,
            fecha_completado: new Date(),
            ultima_actividad: new Date(),
        });
    } else {
        progreso.puntos = Number(progreso.puntos || 0) + 5;
        progreso.completado = true;
        progreso.fecha_completado = new Date();
        progreso.ultima_actividad = new Date();
        await progreso.save();
    }

    return {
        id: Number(juego.id),
        descripcion: juego.descripcion,
        tipo_juego: juego.tipo_juego,
        usuario_id: Number(juego.usuario_id),
        completado: Boolean(progreso.completado),
        puntos: Number(progreso.puntos ?? 0),
        estado_tablero: progreso.estado_tablero ?? null,
        createdAt: juego.createdAt,
        updatedAt: juego.updatedAt,
    };
};

export const obtenerJuegoIAPorId = async (
    usuario_id: number,
    juego_id: number,
): Promise<JuegoIAPlano | null> => {
    const juego = await JuegosIA.findOne({
        where: { id: juego_id, usuario_id },
        include: [
            {
                model: UsuarioJuegosIA,
                where: { usuario_id },
                required: false,
            },
        ],
    });

    if (!juego) {
        return null;
    }

    return aplanarJuego(juego);
};

export const guardarEstadoTableroJuegoIA = async (
    usuario_id: number,
    juego_id: number,
    estado_tablero: string | null,
): Promise<JuegoIAPlano> => {
    const juego = await JuegosIA.findOne({
        where: { id: juego_id, usuario_id },
    });
    if (!juego) {
        throw new Error("No se encontró el juego");
    }

    let progreso = await UsuarioJuegosIA.findOne({
        where: { juego_ia_id: juego_id, usuario_id },
    });

    if (!progreso) {
        progreso = await UsuarioJuegosIA.create({
            usuario_id,
            juego_ia_id: juego_id,
            completado: false,
            puntos: 0,
            estado_tablero,
            ultima_actividad: new Date(),
        });
    } else {
        progreso.estado_tablero = estado_tablero;
        progreso.ultima_actividad = new Date();
        await progreso.save();
    }

    return {
        id: Number(juego.id),
        descripcion: juego.descripcion,
        tipo_juego: juego.tipo_juego,
        usuario_id: Number(juego.usuario_id),
        completado: Boolean(progreso.completado),
        puntos: Number(progreso.puntos ?? 0),
        estado_tablero: progreso.estado_tablero ?? null,
        createdAt: juego.createdAt,
        updatedAt: juego.updatedAt,
    };
};

export const reiniciarEstadoTableroJuegoIA = async (
    usuario_id: number,
    juego_id: number,
): Promise<JuegoIAPlano> => {
    const juego = await JuegosIA.findOne({
        where: { id: juego_id, usuario_id },
    });
    if (!juego) {
        throw new Error("No se encontró el juego");
    }

    let progreso = await UsuarioJuegosIA.findOne({
        where: { juego_ia_id: juego_id, usuario_id },
    });

    if (progreso) {
        progreso.estado_tablero = null;
        progreso.ultima_actividad = new Date();
        await progreso.save();
    }

    return {
        id: Number(juego.id),
        descripcion: juego.descripcion,
        tipo_juego: juego.tipo_juego,
        usuario_id: Number(juego.usuario_id),
        completado: Boolean(progreso?.completado),
        puntos: Number(progreso?.puntos ?? 0),
        estado_tablero: null,
        createdAt: juego.createdAt,
        updatedAt: juego.updatedAt,
    };
};
