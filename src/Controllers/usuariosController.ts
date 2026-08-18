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
    obtenerPuntuacionUsuario,
    IncrementarPuntosUsuario,
    servicioActualizarFoto,
    obtenerPuntuacionusuarioIA,
    obtenerJuegosCompletadosUsuario,
} from "../Services/usuarioServices";
import Usuarios, { UsuariosInstance } from "../Models/usuarioModel";

//mejorado
import * as dotenv from "dotenv";
dotenv.config(); // ¡Esto carga el archivo .env!
import { encrypt, decrypt } from "../utils/encriptador";
import UsuarioJuegos from "../Models/usuario_juegosModel";

/**
 * @swagger
 * /usuarios/consultar:
 *   get:
 *     tags: [Usuarios]
 *     summary: Listar todos los usuarios
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                 msg:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: Token no válido
 *       403:
 *         description: Acceso denegado (sin token)
 *       500:
 *         description: Error interno
 */
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
/**
 * @swagger
 * /usuarios/detalles/{id}:
 *   get:
 *     tags: [Usuarios]
 *     summary: Consultar el detalle de un usuario
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador del usuario
 *     responses:
 *       200:
 *         description: Detalle del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 msg:
 *                   $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: Token no válido
 *       403:
 *         description: Acceso denegado (sin token)
 *       500:
 *         description: Error interno
 */
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
/**
 * @swagger
 * /usuarios/ingresar:
 *   post:
 *     tags: [Usuarios]
 *     summary: Crear un nuevo usuario
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - edad
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               edad:
 *                 type: integer
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Resultado de la creación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: se creo correctamente el usuario
 *       401:
 *         description: Token no válido
 *       403:
 *         description: Acceso denegado (sin token)
 *       500:
 *         description: Error interno
 */
const ingresar = async (req: Request, res: Response) => {
    try {
        const { username, edad, password } = req.body;
        const datosCorrectos: boolean = await aniadirUsuario(
            username,
            edad,
            password,
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
/**
 * @swagger
 * /usuarios/detalles/{id}:
 *   put:
 *     tags: [Usuarios]
 *     summary: Actualizar un usuario
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               edad:
 *                 type: integer
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: el usuario fue actualizado con exito
 *       401:
 *         description: Token no válido
 *       403:
 *         description: Acceso denegado (sin token)
 *       500:
 *         description: Error interno
 */
const actualizar = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { username, edad, password } = req.body;
        const datosCorrectos: boolean = await actualizarUsuario(
            username,
            edad,
            password,
            id,
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
/**
 * @swagger
 * /usuarios/detalles/{id}:
 *   delete:
 *     tags: [Usuarios]
 *     summary: Borrar un usuario
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador del usuario
 *     responses:
 *       200:
 *         description: Usuario eliminado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: el usuario fue eliminado con exito
 *       404:
 *         description: No existe el usuario
 *       401:
 *         description: Token no válido
 *       403:
 *         description: Acceso denegado (sin token)
 *       500:
 *         description: Error interno
 */
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
/**
 * @swagger
 * /usuarios/login/registrar:
 *   post:
 *     tags: [Usuarios]
 *     summary: Registrar un nuevo usuario e iniciar sesión
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - edad
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               edad:
 *                 type: integer
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token de acceso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Faltan datos en la solicitud
 */
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
                expiresIn: "30d",
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

/**
 * @swagger
 * /usuarios/traerDatosUsuario:
 *   get:
 *     tags: [Usuarios]
 *     summary: Obtener datos del usuario autenticado
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nombre:
 *                   type: string
 *                 edad:
 *                   type: integer
 *                 idAvatar:
 *                   type: string
 *                   description: URL del avatar
 *       401:
 *         description: Token no válido
 *       403:
 *         description: Acceso denegado (sin token)
 */
const traerDatosUnUsuario = async (
    req: AuthenticatedRequest,
    res: Response,
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

/**
 * @swagger
 * /usuarios/traerpuntuacion:
 *   get:
 *     tags: [Usuarios]
 *     summary: Obtener la puntuación total del usuario autenticado
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Puntuación total
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 puntuacionTotal:
 *                   type: integer
 *                   description: Suma de puntos de juegos normales e IA
 *       401:
 *         description: Token no válido
 *       403:
 *         description: Acceso denegado (sin token)
 */
const traerPuntuacion = async (req: AuthenticatedRequest, res: Response) => {
    const nombre: string = req.DatosToken?.username;
    const password: string = req.DatosToken?.password;
    const resultado = await obtenerUnUsuarioServicio(nombre, password);
    // console.log("desde aqui es el usuario");
    const idUser = resultado.id;

    const puntuacion = await obtenerPuntuacionUsuario(idUser); //obtener los puntos del usuario

    const puntuacionIA = await obtenerPuntuacionusuarioIA(idUser); //obtener los puntos del usuario en juegos IA

    // console.log(puntos);
    res.json({ puntuacionTotal: puntuacion + puntuacionIA });
};

/**
 * @swagger
 * /usuarios/traerJuegosCompletados:
 *   get:
 *     tags: [Usuarios]
 *     summary: Obtener los juegos completados del usuario autenticado
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de ids de juegos completados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 juegosCompletados:
 *                   type: array
 *                   items:
 *                     type: integer
 *       401:
 *         description: Token no válido
 *       403:
 *         description: Acceso denegado (sin token)
 *       500:
 *         description: Error interno
 */
const traerJuegosCompletados = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    try {
        const nombre: string = req.DatosToken?.username;
        const password: string = req.DatosToken?.password;
        const usuario = await obtenerUnUsuarioServicio(nombre, password);
        const idUser = usuario.id;

        const juegosCompletados =
            await obtenerJuegosCompletadosUsuario(idUser);

        res.json({ juegosCompletados });
    } catch (error: any) {
        console.error("ERROR traerJuegosCompletados:", error);
        res.status(500).json({
            message: "Error interno",
            error: error.message,
        });
    }
};

/**
 * @swagger
 * /usuarios/incrpuntos/{idjuego}:
 *   put:
 *     tags: [Usuarios]
 *     summary: Incrementar puntos por completar un juego
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idjuego
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador del juego
 *     responses:
 *       200:
 *         description: Registro actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UsuarioJuegos'
 *       201:
 *         description: Registro creado (primera vez que completa el juego)
 *       401:
 *         description: Token no válido
 *       403:
 *         description: Acceso denegado (sin token)
 *       500:
 *         description: Error interno
 */
const aumentarPuntuacion = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> => {
    try {
        const { idjuego } = req.params;

        const nombre = req.DatosToken?.username!;
        const password = req.DatosToken?.password!;

        const usuario = await obtenerUnUsuarioServicio(nombre, password);
        const idUser = usuario.id;

        let juego = await UsuarioJuegos.findOne({
            where: {
                juego_id: Number(idjuego),
                usuario_id: Number(idUser),
            },
        });

        if (!juego) {
            juego = await UsuarioJuegos.create({
                usuario_id: idUser,
                juego_id: Number(idjuego),
                completado: true,
                puntos: 10,
            });

            res.status(201).json(juego);
            return;
        }

        if (!juego.completado) {
            juego.completado = true;
            juego.puntos += 10;
        } else {
            juego.puntos += 5;
        }

        await juego.save();
        res.json(juego);
    } catch (error: any) {
        console.error("ERROR aumentarPuntuacion:", error);
        res.status(500).json({
            message: "Error interno",
            error: error.message,
        });
    }
};

/**
 * @swagger
 * /usuarios/actualizarPefilFoto/{idFoto}:
 *   put:
 *     tags: [Usuarios]
 *     summary: Actualizar la foto de perfil del usuario autenticado
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idFoto
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador del nuevo avatar
 *     responses:
 *       200:
 *         description: Foto de perfil actualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: se actualizo la foto de perfil correctamente
 *                 user:
 *                   $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: Token no válido
 *       403:
 *         description: Acceso denegado (sin token)
 */
const actualizarPefilFoto = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    const { idFoto } = req.params;

    const nombre: string = req.DatosToken?.username;
    const password: string = req.DatosToken?.password;

    // await actualizarPefilFotoServicio(nombre, password, idFoto);

    // const usuario = await obtenerUnUsuarioServicio(nombre, password);

    // usuario.idAvatar = Number(idFoto);
    // usuario.save();

    const usuario: UsuariosInstance = await servicioActualizarFoto(
        nombre,
        password,
        idFoto,
    );
    res.json({
        msg: "se actualizo la foto de perfil correctamente",
        user: usuario,
    });
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
    traerJuegosCompletados,
    aumentarPuntuacion,
    actualizarPefilFoto,
};
