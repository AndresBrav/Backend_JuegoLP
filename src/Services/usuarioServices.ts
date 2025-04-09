import { Usuario } from '../interfaces/Usuario';
// import Usuarios from "../Models/usuariosModel"

import { UsuarioActualizado } from '../interfaces/Usuario';

import { isString, isNumero } from '../Validations/validaciones';


import Usuarios, { UsuariosInstance } from '../Models/usuariosModel'; // Asegúrate de que esta ruta sea correcta

export const obtenerTodosLosUsuarios = async (): Promise<UsuariosInstance[]> => {
  const usuarios = await Usuarios.findAll();
  if (!usuarios || usuarios.length === 0) {
    throw new Error('No se encontraron usuarios');
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

export const consultarDetalleUsuario = async (id: string): Promise<UsuariosInstance> => {

    // console.log("el parametro que se paso es "+isString(id))
    const tipoID = isString(id);

    if (tipoID) {
        const usuario:UsuariosInstance = await Usuarios.findByPk(id)
        return usuario;
    }
    else {
        throw new Error("pasa el tipo de dato correcto")
    }
}



export const aniadirUsuario = async (username: any, edad: any, password: any): Promise<boolean> => {
    if (isNumero(edad) && isString(username) && isString(password)) {
        const usuarioA:UsuarioActualizado ={username,edad,password}
        // const usuario = {
        //     username,
        //     edad,
        //     password
        // };
        await Usuarios.create(usuarioA)
        return true;
    }
    else {
        return false;
    }
}


export const actualizarUsuario = async (username: any, edad: any, password: any, id: string): Promise<boolean> => {
    const usuario = await Usuarios.findByPk(id);

    if (!usuario) {
        throw new Error("Usuario no encontrado");
    }

    // Verificar si los tres parámetros son undefined
    if (username === undefined && edad === undefined && password === undefined) {
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
}

export const borrarUsuario = async (id: string): Promise<boolean> => {
    let resultado:boolean = false;
    const usuario = await Usuarios.findByPk(id)
    console.log("vamos a eliminar el usuario.........")

    if (usuario !== null) {
        console.log(usuario)
        await usuario.destroy();
        resultado=true;
    }
    return resultado;
}