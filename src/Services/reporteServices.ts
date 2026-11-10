import Juegos from "../Models/juegoModel";
import UsuarioJuegos from "../Models/usuario_juegosModel";
import JuegosIA from "../Models/juegos_iaModel";
import UsuarioJuegosIA from "../Models/usuario_juegosIAModel";
import Usuarios from "../Models/usuarioModel";

/** true para completado en cualquiera de sus variantes (true/1/"1"). */
const estaCompletado = (valor: any): boolean =>
    valor === true || valor === 1 || valor === "1";

// Progreso PROPIO del usuario para el dashboard (/usuarios/me/progreso).
// Suma los ejercicios fijos (tabla Juegos, persistidos en Usuario_Juegos)
// y los generados con IA (juegosia + Usuario_JuegosIA).
export const miProgresoEstudiante = async (usuarioId: number) => {
    const usuario = await Usuarios.findByPk(usuarioId);

    if (!usuario) {
        return null;
    }

    const [juegosFijos, progresosFijos, generadosIA, progresosIA] =
        await Promise.all([
            Juegos.findAll({ attributes: ["id"], raw: true }),
            UsuarioJuegos.findAll({
                where: { usuario_id: usuarioId },
                raw: true,
            }),
            JuegosIA.count({ where: { usuario_id: usuarioId } }),
            UsuarioJuegosIA.findAll({
                where: { usuario_id: usuarioId },
                raw: true,
            }),
        ]);

    const idsFijos = new Set(
        (juegosFijos as any[]).map((j) => Number(j.id)),
    );
    const fijosCompletados = (progresosFijos as any[]).filter(
        (p) => idsFijos.has(Number(p.juego_id)) && estaCompletado(p.completado),
    ).length;
    const iaCompletados = (progresosIA as any[]).filter((p) =>
        estaCompletado(p.completado),
    ).length;

    const fijosTotales: number = idsFijos.size;
    const iaGenerados = Number(generadosIA);

    const denominadorTotal = fijosTotales + iaGenerados;
    const progresoTotal =
        denominadorTotal > 0
            ? Number(
                  ((fijosCompletados + iaCompletados) / denominadorTotal).toFixed(
                      2,
                  ),
              )
            : 0;

    return {
        usuario: {
            id: Number(usuario.id),
            codigo: usuario.codigo,
            username: usuario.username,
            edad: usuario.edad,
            rol: usuario.rol,
        },
        resumen: {
            fijosCompletados,
            fijosTotales,
            iaCompletados,
            iaGenerados,
            progreso: progresoTotal,
        },
    };
};

export const estadisticasGlobales = async () => {
    const [
        estudiantes,
        admins,
        completadosFijos,
        completadosIA,
        puntosFijos,
        puntosIA,
        ultimaFija,
        ultimaIA,
    ] = await Promise.all([
        Usuarios.count({ where: { rol: "estudiante" } }),
        Usuarios.count({ where: { rol: "admin" } }),
        UsuarioJuegos.count({ where: { completado: true } }),
        UsuarioJuegosIA.count({ where: { completado: true } }),
        UsuarioJuegos.sum("puntos"),
        UsuarioJuegosIA.sum("puntos"),
        UsuarioJuegos.max("ultima_actividad"),
        UsuarioJuegosIA.max("ultima_actividad"),
    ]);

    const fechas = [ultimaFija, ultimaIA]
        .filter(Boolean)
        .map((f) => new Date(f as any).getTime())
        .filter((t) => !Number.isNaN(t));

    return {
        usuarios: { estudiantes, admins },
        completados: { fijos: completadosFijos, ia: completadosIA },
        puntos: {
            fijos: Number(puntosFijos ?? 0),
            ia: Number(puntosIA ?? 0),
            total: Number(puntosFijos ?? 0) + Number(puntosIA ?? 0),
        },
        ultimaActividad: fechas.length
            ? new Date(Math.max(...fechas)).toISOString()
            : null,
    };
};
