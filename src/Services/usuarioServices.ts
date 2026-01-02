import { Usuario } from "../interfaces/Usuario";
// import Usuarios from "../Models/usuariosModel"

import { UsuarioActualizado } from "../interfaces/Usuario";
import Avatares from "../Models/avatarModel";
import UsuarioJuegos from "../Models/usuario_juegosModel";
import Usuarios, { UsuariosInstance } from "../Models/usuarioModel";

import { isString, isNumero } from "../Validations/validaciones";

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
    id: string
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
    username: any,
    edad: any,
    password: any
): Promise<boolean> => {
    if (isNumero(edad) && isString(username) && isString(password)) {
        const usuarioA: UsuarioActualizado = { username, edad, password };
        // const usuario = {
        //     username,
        //     edad,
        //     password
        // };
        await Usuarios.create(usuarioA);
        return true;
    } else {
        return false;
    }
};

export const actualizarUsuario = async (
    username: any,
    edad: any,
    password: any,
    id: string
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
        usuarioActualizado.password = password;
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
    nombre: string,
    password: string
): Promise<UsuariosInstance> => {
    const usuario = await Usuarios.findOne({
        where: {
            username: nombre,
            password: password,
        },
    });
    return usuario;
};

export const retornarIDAvatar = async (idAva: number): Promise<string> => {
    const idAvatar = await Avatares.findByPk(idAva);
    return idAvatar.url;
};

export const obtenerPuntuacionUsuario = async (
    idUser: number
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

export const IncrementarPuntosUsuario = async (
    idjuego: string,
    idUser: number
): Promise<void> => {
    const juego = await UsuarioJuegos.findAll({
        where: { juego_id: Number(idjuego) },
        // raw: true
    });
    console.log("we are going to print the value");
    console.log(juego);
};

export const servicioActualizarFoto = async (
    nombre: string,
    password: string,
    idFoto: string
): Promise<UsuariosInstance> => {
    try {
        const usuario = await obtenerUnUsuarioServicio(nombre, password);
        usuario.idAvatar = Number(idFoto);
        usuario.save();
        return usuario;
    } catch (error) {
        throw error;
    }
};
