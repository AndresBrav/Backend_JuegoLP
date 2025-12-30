import { Request, Response } from "express";
import jwt from "jsonwebtoken"; // Asegúrate de importar jsonwebtoken
// import cors from "cors";
import verifyToken, { AuthenticatedRequest } from "../Middlewares/verifyToken"; // Importa verifyToken
import { Usuario } from "../interfaces/Usuario";

import {
    obtenerTodosLosUsuarios,
    consultarDetalleUsuario,
    aniadirUsuario,
    actualizarUsuario,
    borrarUsuario,
    obtenerUnUsuarioServicio,
    retornarIDAvatar,
} from "../Services/usuarioServices";
import Usuarios from "../Models/usuarioModel";

//mejorado
import * as dotenv from "dotenv";
dotenv.config(); // ¡Esto carga el archivo .env!
import { encrypt, decrypt } from "../utils/encriptador";
import UsuarioJuegos from "../Models/usuario_juegosModel";

const consultarUsuarios = async (req: AuthenticatedRequest, res: Response) => {
    try {
        console.log("Datos del token:", req.DatosToken?.username); // Sin await
        const usuarios = await obtenerTodosLosUsuarios(); //llama al Servicio
        res.json({
            username: `los datos son ${req.DatosToken.username}`,
            msg: usuarios,
        });
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

// Función para consultar detalles de un usuario
const consultarDetalle = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const usuario = await consultarDetalleUsuario(id); //llama al servicio
    try {
        res.json({
            id: `Este es el id que se paso ${id}`,
            username: `los datos del token son ${req.DatosToken.username}`,
            msg: usuario,
        });
        // Aquí puedes agregar la lógica para consultar los detalles del usuario con el id
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

// Función para ingresar un nuevo usuario
const ingresar = async (req: Request, res: Response) => {
    try {
        const { username, edad, password } = req.body;
        const datosCorrectos: boolean = await aniadirUsuario(
            username,
            edad,
            password
        );

        // console.log("vamos a verificar")
        // console.log(datosCorrectos)

        if (datosCorrectos) {
            res.json({
                msg: "se creo correctamente el usuario",
            });
        } else {
            res.json({
                msg: "ingresa correctamente los datos",
            });
        }
        // Aquí agregas la lógica para ingresar el usuario
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

// Función para actualizar un usuario
const actualizar = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { username, edad, password } = req.body;
        const datosCorrectos: boolean = await actualizarUsuario(
            username,
            edad,
            password,
            id
        );

        if (datosCorrectos) {
            res.json({
                msg: " el usuario fue actualizado con exito ",
            });
        } else {
            res.json("el usuario no se pudo actualizar");
        }

        // Aquí puedes agregar la lógica para actualizar el usuario con el id
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

// Función para borrar un usuario
const borrar = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const usuarioEliminado = await borrarUsuario(id);

        if (usuarioEliminado) {
            res.json({
                msg: "el usuario fue eliminado con exito",
            });
        } else {
            res.status(404).json({
                msg: `no existe el usuario ${id}`,
            });
        }
        // Aquí agregas la lógica para borrar el usuario con el id
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

// Función para ingresar un nuevo usuario
const RegistrarLogin = async (req: Request, res: Response) => {
    const { username, edad, password } = req.body;

    if (!username || !password || !edad) {
        res.status(400).json({ message: "Faltan datos en la solicitud" });
        return;
    }
    // const usuario:Usuario = { username, password };
    if (typeof username === "string" && typeof password === "string") {
        console.log("los datos son de tipo string");
        const usuario = { username, edad, password, idAvatar: 1 };
        await Usuarios.create(usuario); //lo crea en la base de datos

        const UsuarioA = { username, password };

        const UsuarioArevisar: Usuario = UsuarioA;
        let existe = await verificarLogin(UsuarioArevisar);
        // console.log(existe)
        if (existe) {
            //Crear un token con expiración
            const secretKey = process.env.CLAVE_JWT ?? "no hay clave";
            const tokenA = jwt.sign(UsuarioArevisar, secretKey, {
                expiresIn: "1h",
            });
            const tokenEncriptado = encrypt(tokenA);
            const token = tokenEncriptado;
            res.json({ token });
        } else {
            res.json({ msg: "el usuario que ingresaste no existe Registrate" });
        }
    } else {
        res.json({ msg: "Ingresa correctamente el usuario" });
    }
};

const verificarLogin = async (usuario: Usuario): Promise<boolean> => {
    // Usa la interfaz para tipar el resultado de findAll
    const usuariosBD = await Usuarios.findAll({
        attributes: ["username", "password"],
        raw: true,
    });

    // Convierte explícitamente a unknown y luego a Usuario[]
    const usuarios = usuariosBD as unknown as Usuario[];

    const UsuarioALogear: Usuario = usuario;
    console.log("El usuario que se va a logear es:");
    console.log(UsuarioALogear);

    let registro: boolean = false;

    for (let i = 0; i < usuariosBD.length; i++) {
        if (
            usuarios[i].username === UsuarioALogear.username &&
            usuarios[i].password === UsuarioALogear.password
        ) {
            registro = true;
        }
    }

    return registro; // 🔁 esto hace internamente un `resolve(registro)`
};

const traerDatosUnUsuario = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const nombre: string = req.DatosToken?.username;
    const password: string = req.DatosToken?.password;
    const resultado = await obtenerUnUsuarioServicio(nombre, password);

    const idAva = resultado.idAvatar;
    const idAvatar2 = await retornarIDAvatar(idAva);

    res.json({
        nombre: resultado.username,
        edad: resultado.edad,
        idAvatar: idAvatar2,
    });
};

const traerPuntuacion = async (req: AuthenticatedRequest, res: Response) => {
    const nombre: string = req.DatosToken?.username;
    const password: string = req.DatosToken?.password;
    const resultado = await obtenerUnUsuarioServicio(nombre, password);
    console.log("desde aqui es el usuario");
    const idUser = resultado.id;

    const puntosRaw = await UsuarioJuegos.findAll({
        attributes: ["puntos"],
        where: { usuario_id: idUser },
        raw: true,
    });

    // Convertimos a unknown primero, luego a la forma correcta
    const puntos = puntosRaw as unknown as { puntos: number }[];

    const totalPuntos = puntos.reduce((acc, x) => acc + x.puntos, 0);

    console.log(totalPuntos); // 1

    console.log(puntos);
    // console.log(resultado.id)
    // console.log(resultado.username)
    // console.log(resultado.password)
    res.end();
};

// Exportar las funciones para usarlas en las rutas
export {
    consultarUsuarios,
    consultarDetalle,
    ingresar,
    actualizar,
    borrar,
    RegistrarLogin,
    verificarLogin,
    traerDatosUnUsuario,
    traerPuntuacion,
};
