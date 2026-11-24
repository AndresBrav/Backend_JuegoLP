import crypto from "crypto";
import { Op, UniqueConstraintError } from "sequelize";
import Grupo from "../Models/grupoModel";
import GrupoEstudiantes from "../Models/grupoEstudianteModel";
import Usuarios from "../Models/usuarioModel";
import { esCodigoValido, normalizarCodigo } from "../Validations/validaciones";

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Código corto de 6 caracteres, sin ambiguos (sin O/0 ni I/1). */
export const generarCodigoGrupo = (): string => {
    let codigo = "";
    for (let i = 0; i < 6; i++) {
        codigo += ALFABETO[crypto.randomInt(0, ALFABETO.length)];
    }
    return codigo;
};

/** Profesor: crea un grupo con un código único de 6 caracteres. */
export const crearGrupo = async (profesorId: number, nombre: string) => {
    if (!isNombreValido(nombre)) {
        throw new Error(
            "El nombre del grupo debe tener entre 2 y 80 caracteres",
        );
    }

    for (let intento = 0; intento < 5; intento++) {
        const codigo = generarCodigoGrupo();
        const existente = await Grupo.findOne({ where: { codigo } });

        if (existente) {
            continue;
        }

        return Grupo.create({
            nombre: nombre.trim(),
            codigo,
            profesor_id: profesorId,
        });
    }

    throw new Error("No se pudo generar un código único para el grupo");
};

const isNombreValido = (nombre: any): boolean =>
    typeof nombre === "string" &&
    nombre.trim().length >= 2 &&
    nombre.trim().length <= 80;

/** Profesor: sus grupos con la cantidad de estudiantes inscritos. */
export const listarGruposProfesor = async (profesorId: number) => {
    const grupos = await Grupo.findAll({
        where: { profesor_id: profesorId },
        order: [["createdAt", "DESC"]],
        raw: true,
    }) as unknown as Array<{
        id: number;
        nombre: string;
        codigo: string;
        createdAt: Date;
    }>;

    return Promise.all(
        grupos.map(async (g) => ({
            ...g,
            estudiantes: await GrupoEstudiantes.count({
                where: { grupo_id: g.id },
            }),
        })),
    );
};

/** Estudiante: los grupos a los que pertenece (con su profesor). */
export const listarGruposEstudiante = async (estudianteId: number) => {
    const inscripciones = (await GrupoEstudiantes.findAll({
        where: { usuario_id: estudianteId },
        raw: true,
    })) as unknown as Array<{ grupo_id: number; fecha_union: string }>;

    return Promise.all(
        inscripciones.map(async (i) => {
            const grupo = (await Grupo.findByPk(i.grupo_id, {
                raw: true,
            })) as unknown as {
                id: number;
                nombre: string;
                codigo: string;
                profesor_id: number;
            } | null;

            if (!grupo) return null;

            const profesor = (await Usuarios.findByPk(grupo.profesor_id, {
                attributes: ["username"],
                raw: true,
            })) as unknown as { username: string } | null;

            return {
                id: grupo.id,
                nombre: grupo.nombre,
                codigo: grupo.codigo,
                profesor: profesor?.username ?? "",
                fecha_union: i.fecha_union,
            };
        }),
    ).then((g) => g.filter(Boolean));
};

/** Estudiante: se une a un grupo con el código de 6 caracteres. */
export const unirseAGrupo = async (estudianteId: number, codigo: string) => {
    if (typeof codigo !== "string" || !/^[A-Za-z0-9]{6}$/.test(codigo)) {
        throw new Error("El código del grupo debe tener 6 caracteres");
    }

    const grupo = await Grupo.findOne({
        where: { codigo: codigo.toUpperCase() },
    });

    if (!grupo) {
        throw new Error("No existe un grupo con ese código");
    }

    const yaInscrito = await GrupoEstudiantes.findOne({
        where: { grupo_id: grupo.id, usuario_id: estudianteId },
    });

    if (yaInscrito) {
        throw new Error("Ya estás inscrito en este grupo");
    }

    await GrupoEstudiantes.create({
        grupo_id: grupo.id,
        usuario_id: estudianteId,
        fecha_union: new Date().toISOString().slice(0, 10),
    });

    return grupo;
};

/** Estudiante: sale de un grupo (borra su inscripción). */
export const salirDeGrupo = async (estudianteId: number, grupoId: number) => {
    const inscripcion = await GrupoEstudiantes.findOne({
        where: { grupo_id: grupoId, usuario_id: estudianteId },
    });

    if (!inscripcion) {
        throw new Error("No estás inscrito en ese grupo");
    }

    await inscripcion.destroy();
};

/** ¿El usuario está inscrito en el grupo? (usado por los servicios). */
export const esMiembroDeGrupo = async (
    grupoId: number,
    usuarioId: number,
): Promise<boolean> => {
    const inscripcion = await GrupoEstudiantes.findOne({
        where: { grupo_id: grupoId, usuario_id: usuarioId },
    });
    return Boolean(inscripcion);
};

/** Profesor: detalle de su grupo con la lista de inscritos. */
export const obtenerGrupoProfesor = async (
    grupoId: number,
    profesorId: number,
) => {
    const grupo = (await Grupo.findOne({
        where: { id: grupoId, profesor_id: profesorId },
        raw: true,
    })) as unknown as {
        id: number;
        nombre: string;
        codigo: string;
        createdAt: Date;
    } | null;

    if (!grupo) {
        return null;
    }

    const inscripciones = (await GrupoEstudiantes.findAll({
        where: { grupo_id: grupoId },
        raw: true,
    })) as unknown as Array<{ usuario_id: number; fecha_union: string }>;

    const estudiantes = await Promise.all(
        inscripciones.map(async (i) => {
            const u = (await Usuarios.findByPk(i.usuario_id, {
                attributes: ["id", "codigo", "username"],
                raw: true,
            })) as unknown as {
                id: number;
                codigo: string;
                username: string;
            } | null;
            return u ? { ...u, fecha_union: i.fecha_union } : null;
        }),
    );

    return {
        ...grupo,
        estudiantes: estudiantes.filter(Boolean),
    };
};

export type EstadoInscripcionSIS =
    | "agregado"
    | "ya_inscrito"
    | "no_encontrado"
    | "no_es_estudiante";

export interface ResultadoInscripcionSIS {
    codigo: string;
    estado: EstadoInscripcionSIS;
}

/** Profesor: inscribe estudiantes del grupo mediante sus códigos SIS. */
export const agregarEstudiantesPorCodigo = async (
    grupoId: number,
    profesorId: number,
    codigos: string[],
): Promise<ResultadoInscripcionSIS[]> => {
    if (
        !Array.isArray(codigos) ||
        codigos.length < 1 ||
        codigos.length > 100 ||
        codigos.some((codigo) => !esCodigoValido(codigo))
    ) {
        throw new Error(
            "La lista debe tener entre 1 y 100 códigos SIS válidos",
        );
    }

    const grupo = await Grupo.findOne({
        where: { id: grupoId, profesor_id: profesorId },
    });
    if (!grupo) {
        throw new Error("No existe ese grupo o no te pertenece");
    }

    const codigosPorClave = new Map(
        codigos.map((codigo) => {
            const normalizado = normalizarCodigo(codigo);
            return [normalizado.toLowerCase(), normalizado] as const;
        }),
    );
    const codigosUnicos = [...codigosPorClave.values()];
    const usuarios = (await Usuarios.findAll({
        where: { codigo: { [Op.in]: codigosUnicos } },
        attributes: ["id", "codigo", "rol"],
        raw: true,
    })) as unknown as Array<{
        id: number;
        codigo: string;
        rol: string;
    }>;
    const usuariosPorCodigo = new Map(
        usuarios.map((usuario) => [usuario.codigo.toLowerCase(), usuario]),
    );
    const idsEstudiantes = usuarios
        .filter((usuario) => usuario.rol === "estudiante")
        .map((usuario) => usuario.id);
    const inscripciones = (await GrupoEstudiantes.findAll({
        where: {
            grupo_id: grupoId,
            usuario_id: { [Op.in]: idsEstudiantes },
        },
        attributes: ["usuario_id"],
        raw: true,
    })) as unknown as Array<{ usuario_id: number }>;
    const inscritos = new Set(inscripciones.map((fila) => fila.usuario_id));

    const resultados: ResultadoInscripcionSIS[] = [];
    for (const codigo of codigosUnicos) {
        const usuario = usuariosPorCodigo.get(codigo.toLowerCase());
        if (!usuario) {
            resultados.push({ codigo, estado: "no_encontrado" });
            continue;
        }
        if (usuario.rol !== "estudiante") {
            resultados.push({ codigo, estado: "no_es_estudiante" });
            continue;
        }
        if (inscritos.has(usuario.id)) {
            resultados.push({ codigo, estado: "ya_inscrito" });
            continue;
        }

        try {
            await GrupoEstudiantes.create({
                grupo_id: grupoId,
                usuario_id: usuario.id,
                fecha_union: new Date().toISOString().slice(0, 10),
            });
            inscritos.add(usuario.id);
            resultados.push({ codigo, estado: "agregado" });
        } catch (error) {
            if (!(error instanceof UniqueConstraintError)) throw error;
            resultados.push({ codigo, estado: "ya_inscrito" });
        }
    }

    return resultados;
};

/** Profesor: elimina SU grupo (en cascada borra temarios, ejercicios
 * y entregas por los onDelete: CASCADE). */
export const eliminarGrupo = async (grupoId: number, profesorId: number) => {
    const grupo = await Grupo.findOne({
        where: { id: grupoId, profesor_id: profesorId },
    });

    if (!grupo) {
        throw new Error("No existe ese grupo o no te pertenece");
    }

    await grupo.destroy();
};
