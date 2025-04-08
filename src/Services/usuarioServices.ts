import { Usuario } from '../interfaces/Usuario';
import Usuarios from "../Models/usuariosModel"

import { isString, isNumero } from '../Validations/validaciones';

export const obtenerTodosLosUsuarios = async (): Promise<any> => {
    const usuarios = await Usuarios.findAll();
    if (!usuarios || usuarios.length === 0) {
        throw new Error('No se encontraron usuarios');
    }
    return usuarios;
}

export const consultarDetalleUsuario = async (id: string): Promise<any> => {

    // console.log("el parametro que se paso es "+isString(id))
    const tipoID = isString(id);

    if (tipoID) {
        const usuario = await Usuarios.findByPk(id)
        return usuario;
    }
    else {
        throw new Error("pasa el tipo de dato correcto")
    }
}



export const aniadirUsuario = async (username: any, edad: any, password: any): Promise<boolean> => {
    if (isNumero(edad) && isString(username) && isString(password)) {
        const usuario = {
            username,
            edad,
            password
        };
        await Usuarios.create(usuario)
        return true;
    }
    else{
        return false;
    }
}