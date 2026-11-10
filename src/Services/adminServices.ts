import Usuarios from "../Models/usuarioModel";
import UsuarioJuegos from "../Models/usuario_juegosModel";
import UsuarioJuegosIA from "../Models/usuario_juegosIAModel";

/** Lista global de estudiantes con sus puntos y ejercicios completados. */
export const listarEstudiantes = async () => {
    const estudiantes = await Usuarios.findAll({
        where: { rol: "estudiante" },
        attributes: ["id", "codigo", "username", "edad", "createdAt"],
        order: [["username", "ASC"]],
        raw: true,
    });

    const [progresos, juegosIA] = await Promise.all([
        UsuarioJuegos.findAll({
            attributes: ["usuario_id", "puntos", "completado"],
            raw: true,
        }),
        UsuarioJuegosIA.findAll({
            attributes: ["usuario_id", "puntos", "completado"],
            raw: true,
        }),
    ]);

    return estudiantes.map((estudiante) => {
        const id = Number(estudiante.id);
        const propios = progresos.filter((p) => Number(p.usuario_id) === id);
        const propiosIA = juegosIA.filter((j) => Number(j.usuario_id) === id);

        const puntos =
            propios.reduce((total, p) => total + Number(p.puntos ?? 0), 0) +
            propiosIA.reduce((total, j) => total + Number(j.puntos ?? 0), 0);

        const completados =
            propios.filter((p) => Boolean(p.completado)).length +
            propiosIA.filter((j) => Boolean(j.completado)).length;

        return {
            ...estudiante,
            puntos,
            completados,
        };
    });
};
