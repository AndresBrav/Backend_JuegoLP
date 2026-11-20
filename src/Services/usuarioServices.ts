import { Op } from "sequelize";
import { Rol, Usuario } from "../interfaces/Usuario";
// import Usuarios from "../Models/usuariosModel"

import { UsuarioActualizado } from "../interfaces/Usuario";
import Avatares from "../Models/avatarModel";
import UsuarioJuegos from "../Models/usuario_juegosModel";
import Usuarios, { UsuariosInstance } from "../Models/usuarioModel";
import UsuarioJuegosIA from "../Models/usuario_juegosIAModel";

import { isString, isNumero, esRolDeRegistro } from "../Validations/validaciones";
import UsuarioEjerciciosGrupo from "../Models/usuario_ejerciciosGrupoModel";
import { hashContrasena } from "../utils/contrasenas";

export const obtenerTodosLosUsuarios = async (): Promise<
    UsuariosInstance[]
> => {
    const usuarios = await Usuarios.findAll();
    if (!usuarios || usuarios.length === 0) {
        throw new Error("No se encontraron usuarios");
    }
    return usuarios;
};

// export const obtenerTodosLosUsuarios = async (): Promise<any> => {
//     const usuarios = await Usuarios.findAll();
//     if (!usuarios || usuarios.length === 0) {
//         throw new Error('No se encontraron usuarios');
//     }
//     return usuarios;
// }

export const consultarDetalleUsuario = async (
    id: string,
): Promise<UsuariosInstance> => {
    // console.log("el parametro que se paso es "+isString(id))
    const tipoID = isString(id);

    if (tipoID) {
        const usuario: UsuariosInstance = await Usuarios.findByPk(id);
        return usuario;
    } else {
        throw new Error("pasa el tipo de dato correcto");
    }
};

export const aniadirUsuario = async (
    codigo: any,
    username: any,
    edad: any,
    password: any,
    rol: any = "estudiante",
): Promise<boolean> => {
    if (
        isString(codigo) &&
        isNumero(edad) &&
        isString(username) &&
        isString(password)
    ) {
        // Solo estudiante o profesor desde el registro público; admin
        // se crea exclusivamente con el seeder.
        const rolFinal = esRolDeRegistro(rol) ? rol : "estudiante";
        await Usuarios.create({
            codigo: codigo.trim(),
            username,
            edad,
            passwordHash: await hashContrasena(password),
            rol: rolFinal,
            idAvatar: 1,
        });
        return true;
    } else {
        return false;
    }
};

export const actualizarUsuario = async (
    username: any,
    edad: any,
    password: any,
    id: string,
): Promise<boolean> => {
    const usuario = await Usuarios.findByPk(id);

    if (!usuario) {
        throw new Error("Usuario no encontrado");
    }

    // Verificar si los tres parámetros son undefined
    if (
        username === undefined &&
        edad === undefined &&
        password === undefined
    ) {
        throw new Error("No se proporcionaron campos para actualizar");
    }

    const usuarioActualizado: UsuarioActualizado = {};

    // Verificar si no es undefined antes de agregar al objeto
    if (username !== undefined && isString(username)) {
        usuarioActualizado.username = username;
    }

    if (edad !== undefined && isNumero(edad)) {
        usuarioActualizado.edad = edad;
    }

    if (password !== undefined && isString(password)) {
        usuarioActualizado.passwordHash = await hashContrasena(password);
    }

    // Actualizamos el usuario con los campos que no son undefined
    await usuario.update(usuarioActualizado);
    return true;
};

export const borrarUsuario = async (id: string): Promise<boolean> => {
    let resultado: boolean = false;
    const usuario = await Usuarios.findByPk(id);
    console.log("vamos a eliminar el usuario.........");

    if (usuario !== null) {
        console.log(usuario);
        await usuario.destroy();
        resultado = true;
    }
    return resultado;
};

export const obtenerUnUsuarioServicio = async (
    id: unknown,
    username?: unknown,
): Promise<UsuariosInstance> => {
    const idNumerico = Number(id);
    if (Number.isInteger(idNumerico) && idNumerico > 0) {
        const usuario = await Usuarios.findByPk(idNumerico);
        if (!usuario) {
            throw new Error("Usuario no encontrado");
        }
        return usuario;
    }

    if (typeof username === "string" && username.trim()) {
        const usuario = await Usuarios.findOne({
            where: { username: username.trim() },
        });
        if (usuario) {
            return usuario;
        }
    }

    throw new Error("Usuario no encontrado");
};

export const retornarIDAvatar = async (idAva: number): Promise<string> => {
    const idAvatar = await Avatares.findByPk(idAva);
    return idAvatar.url;
};

export const obtenerPuntuacionUsuario = async (
    idUser: number,
): Promise<number> => {
    const puntosRaw = await UsuarioJuegos.findAll({
        attributes: ["puntos"],
        where: { usuario_id: idUser },
        raw: true,
    });

    // Convertimos a unknown primero, luego a la forma correcta
    const puntos = puntosRaw as unknown as { puntos: number }[];

    const totalPuntos = puntos.reduce((acc, x) => acc + x.puntos, 0);

    return totalPuntos;
};

export const obtenerJuegosCompletadosUsuario = async (
    idUser: number,
): Promise<number[]> => {
    const juegosRaw = await UsuarioJuegos.findAll({
        attributes: ["juego_id"],
        where: { usuario_id: idUser, completado: true },
        raw: true,
    });

    const juegos = juegosRaw as unknown as { juego_id: number }[];

    const juegosCompletados = juegos.map((j) => Number(j.juego_id));

    return juegosCompletados;
};

export const obtenerPuntuacionusuarioIA = async (
    idUser: number,
): Promise<number> => {
    const puntosRaw = await UsuarioJuegosIA.findAll({
        attributes: ["puntos"],
        where: { usuario_id: idUser },
        raw: true,
    });

    // Convertimos a unknown primero, luego a la forma correcta
    const puntos = puntosRaw as unknown as { puntos: number }[];

    const totalPuntos = puntos.reduce((acc, x) => acc + x.puntos, 0);

    return totalPuntos;
};

export const IncrementarPuntosUsuario = async (
    idjuego: string,
    idUser: number,
): Promise<void> => {
    const juego = await UsuarioJuegos.findAll({
        where: { juego_id: Number(idjuego) },
        // raw: true
    });
    console.log("we are going to print the value");
    console.log(juego);
};

export const servicioActualizarFoto = async (
    id: number,
    idFoto: string,
): Promise<UsuariosInstance> => {
    const usuario = await Usuarios.findByPk(id);
    if (!usuario) {
        throw new Error("Usuario no encontrado");
    }
    usuario.idAvatar = Number(idFoto);
    await usuario.save();
    return usuario;
};

/* ------------------------------------------------------------------ */
/* Autenticación, registro y perfil                                    */
/* ------------------------------------------------------------------ */

export const buscarUsuarioPorId = async (
    id: number,
): Promise<UsuariosInstance | null> => {
    return Usuarios.findByPk(id);
};

/** Permite iniciar sesión con el username o con el código institucional. */
export const buscarUsuarioPorIdentificador = async (
    identificador: string,
): Promise<UsuariosInstance | null> => {
    return Usuarios.unscoped().findOne({
        where: {
            [Op.or]: [
                { username: identificador },
                { codigo: identificador },
            ],
        },
    });
};

export const existeUsername = async (username: string): Promise<boolean> => {
    const total = await Usuarios.count({ where: { username } });
    return total > 0;
};

export const existeCodigo = async (codigo: string): Promise<boolean> => {
    const total = await Usuarios.count({ where: { codigo } });
    return total > 0;
};

export const crearUsuario = async (datos: {
    codigo: string;
    username: string;
    edad: number;
    password: string;
    rol: Rol;
    idAvatar?: number;
}): Promise<UsuariosInstance> => {
    const { password, ...datosUsuario } = datos;
    return Usuarios.create({
        ...datosUsuario,
        passwordHash: await hashContrasena(password),
        idAvatar: datos.idAvatar ?? 1,
    });
};

/** Puntos ganados en ejercicios de grupo: SOLO la calificación del
 * profesor (`puntos_profesor`). La entrega del estudiante no otorga
 * puntos, por lo que la columna `puntos` no se suma al perfil. */
export const obtenerPuntuacionGrupos = async (idUser: number) => {
    const filas = (await UsuarioEjerciciosGrupo.findAll({
        attributes: ["puntos_profesor"],
        where: { usuario_id: idUser },
        raw: true,
    })) as unknown as { puntos_profesor: number | null }[];

    return filas.reduce(
        (acc, f) => acc + Number(f.puntos_profesor ?? 0),
        0,
    );
};

export const obtenerPerfilCompleto = async (id: number) => {
    const usuario = await Usuarios.findByPk(id);

    if (!usuario) {
        return null;
    }

    const avatar = usuario.idAvatar
        ? await Avatares.findByPk(usuario.idAvatar)
        : null;

    const puntosFijos = await obtenerPuntuacionUsuario(id);
    const puntosIA = await obtenerPuntuacionusuarioIA(id);
    const puntosGrupos = await obtenerPuntuacionGrupos(id);

    return {
        id,
        codigo: usuario.codigo,
        username: usuario.username,
        edad: usuario.edad,
        rol: usuario.rol,
        avatarUrl: avatar ? avatar.url : null,
        puntos: puntosFijos + puntosIA + puntosGrupos,
    };
};

