import { Request, Response } from "express";
import jwt from "jsonwebtoken"; // Asegúrate de importar jsonwebtoken
// import cors from "cors";
import verifyToken, { AuthenticatedRequest } from "../Middlewares/verifyToken"; // Importa verifyToken
import { Rol, Usuario } from "../interfaces/Usuario";

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
    buscarUsuarioPorIdentificador,
    crearUsuario,
    existeCodigo,
    existeUsername,
    obtenerPerfilCompleto,
} from "../Services/usuarioServices";
import Usuarios, { UsuariosInstance } from "../Models/usuarioModel";

//mejorado
import * as dotenv from "dotenv";
dotenv.config(); // ¡Esto carga el archivo .env!
import { encrypt, decrypt } from "../utils/encriptador";
import UsuarioJuegos from "../Models/usuario_juegosModel";
import { RequestAutenticado } from "../Middlewares/cargarUsuarioActual";
import {
    esCodigoValido,
    esRolDeRegistro,
    normalizarCodigo,
} from "../Validations/validaciones";

/** Firma el JWT, lo cifra y devuelve el token que consume el cliente. */
const firmarToken = (usuario: UsuariosInstance): string => {
    const secretKey = process.env.CLAVE_JWT ?? "no hay clave";

    const payload = {
        id: usuario.id,
        codigo: usuario.codigo,
        username: usuario.username,
        password: usuario.password,
        rol: usuario.rol,
    };

    const token = jwt.sign(payload, secretKey, { expiresIn: "30d" });
    return encrypt(token);
};


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
 *               - codigo
 *               - username
 *               - edad
 *               - password
 *             properties:
 *               codigo:
 *                 type: string
 *                 description: Código institucional único
 *                 example: "201904950"
 *               username:
 *                 type: string
 *               edad:
 *                 type: integer
 *               password:
 *                 type: string
 *               rol:
 *                 type: string
 *                 enum: [estudiante, profesor]
 *                 default: estudiante
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
 *       400:
 *         description: Falta el código institucional
 *       401:
 *         description: Token no válido
 *       403:
 *         description: Acceso denegado (sin token)
 *       500:
 *         description: Error interno
 */
const ingresar = async (req: Request, res: Response) => {
    try {
        const { codigo, username, edad, password, rol } = req.body ?? {};

        if (!codigo) {
            res.status(400).json({
                message: "El código institucional es obligatorio",
            });
            return;
        }

        const datosCorrectos: boolean = await aniadirUsuario(
            codigo,
            username,
            edad,
            password,
            rol,
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
 *               - codigo
 *               - username
 *               - edad
 *               - password
 *               - rol
 *             properties:
 *               codigo:
 *                 type: string
 *                 description: Código institucional único (4 a 20 caracteres)
 *                 example: "201904950"
 *               username:
 *                 type: string
 *               edad:
 *                 type: integer
 *               password:
 *                 type: string
 *               rol:
 *                 type: string
 *                 enum: [estudiante, profesor]
 *                 description: admin no se permite por registro público
 *     responses:
 *       201:
 *         description: Token de acceso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Faltan datos o son inválidos
 *       409:
 *         description: Código o usuario ya registrado
 */
const RegistrarLogin = async (req: Request, res: Response) => {
    try {
        const { codigo, username, edad, password, rol } = req.body ?? {};

        if (!codigo || !username || !edad || !password || !rol) {
            res.status(400).json({ message: "Faltan datos en la solicitud" });
            return;
        }

        if (!esRolDeRegistro(rol)) {
            res.status(400).json({
                message: "Rol no permitido. Usa estudiante o profesor",
            });
            return;
        }

        const codigoNormalizado = normalizarCodigo(String(codigo));
        const usernameNormalizado = String(username).trim();
        const edadNumero = Number(edad);

        if (!esCodigoValido(codigoNormalizado)) {
            res.status(400).json({
                message:
                    "El código debe ser alfanumérico de 4 a 20 caracteres",
            });
            return;
        }

        if (!usernameNormalizado) {
            res.status(400).json({ message: "El nombre de usuario es obligatorio" });
            return;
        }

        if (
            !Number.isInteger(edadNumero) ||
            edadNumero <= 0 ||
            edadNumero > 120
        ) {
            res.status(400).json({ message: "Edad inválida" });
            return;
        }

        if (String(password).length < 4) {
            res.status(400).json({
                message: "La contraseña debe tener al menos 4 caracteres",
            });
            return;
        }

        if (await existeCodigo(codigoNormalizado)) {
            res.status(409).json({
                message: `El código ${codigoNormalizado} ya está registrado`,
            });
            return;
        }

        if (await existeUsername(usernameNormalizado)) {
            res.status(409).json({
                message: `El usuario ${usernameNormalizado} ya está registrado`,
            });
            return;
        }

        const usuario = await crearUsuario({
            codigo: codigoNormalizado,
            username: usernameNormalizado,
            edad: edadNumero,
            password: String(password),
            rol: rol as Rol,
        });

        res.status(201).json({ token: firmarToken(usuario) });
    } catch (error: any) {
        if (error?.name === "SequelizeUniqueConstraintError") {
            res.status(409).json({
                message: "El código o el usuario ya están registrados",
            });
            return;
        }

        console.error("ERROR RegistrarLogin:", error);
        res.status(500).json({ message: "No se pudo registrar el usuario" });
    }
};

const iniciarSesion = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body ?? {};
        const identificador =
            typeof username === "string" ? username.trim() : "";

        if (!identificador || !password) {
            res.status(400).json({ message: "Faltan datos en la solicitud" });
            return;
        }

        const usuario = await buscarUsuarioPorIdentificador(identificador);

        if (!usuario || usuario.password !== password) {
            res.json({
                msg: "el usuario que ingresaste no existe Registrate",
            });
            return;
        }

        res.json({ token: firmarToken(usuario) });
    } catch (error: any) {
        console.error("ERROR iniciarSesion:", error);
        res.status(500).json({ message: "No se pudo iniciar sesión" });
    }
};

const verificarLogin = async (usuario: Usuario): Promise<boolean> => {
    const encontrado = await buscarUsuarioPorIdentificador(usuario.username);
    return !!encontrado && encontrado.password === usuario.password;
};

/**
 * @swagger
 * /usuarios/me:
 *   get:
 *     tags: [Usuarios]
 *     summary: Perfil, rol y puntos del usuario autenticado
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario autenticado
 *       401:
 *         description: Token inválido
 */
const traerMiPerfil = async (req: RequestAutenticado, res: Response) => {
    try {
        const id = req.usuarioActual?.id;

        if (!id) {
            res.status(401).json({ message: "No autenticado" });
            return;
        }

        const perfil = await obtenerPerfilCompleto(id);

        if (!perfil) {
            res.status(404).json({ message: "Usuario no encontrado" });
            return;
        }

        res.json(perfil);
    } catch (error: any) {
        console.error("ERROR traerMiPerfil:", error);
        res.status(500).json({ message: "No se pudo obtener el perfil" });
    }
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
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const { idjuego } = req.params;
        const idJuego = Number(idjuego);

        if (!Number.isInteger(idJuego)) {
            res.status(400).json({ message: "Id de juego inválido" });
            return;
        }

        let idUser = req.usuarioActual?.id;

        if (!idUser) {
            const nombre = req.DatosToken?.username!;
            const password = req.DatosToken?.password!;
            const usuario = await obtenerUnUsuarioServicio(nombre, password);
            idUser = Number(usuario.id);
        }

        const ahora = new Date();

        let juego = await UsuarioJuegos.findOne({
            where: {
                juego_id: idJuego,
                usuario_id: Number(idUser),
            },
        });

        if (!juego) {
            juego = await UsuarioJuegos.create({
                usuario_id: Number(idUser),
                juego_id: idJuego,
                completado: true,
                puntos: 10,
                intentos: 1,
                fecha_completado: ahora,
                ultima_actividad: ahora,
            });

            res.status(201).json(juego);
            return;
        }

        juego.intentos = Number(juego.intentos ?? 0) + 1;
        juego.ultima_actividad = ahora;

        if (!juego.completado) {
            juego.completado = true;
            juego.puntos += 10;
            juego.fecha_completado = ahora;
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
    iniciarSesion,
    verificarLogin,
    traerMiPerfil,
    traerDatosUnUsuario,
    traerPuntuacion,
    traerJuegosCompletados,
    aumentarPuntuacion,
    actualizarPefilFoto,
};
