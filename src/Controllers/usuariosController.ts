import { Request, Response } from "express";
import jwt from "jsonwebtoken";  // Asegúrate de importar jsonwebtoken
// import cors from "cors";
import verifyToken, { AuthenticatedRequest } from "../Middlewares/verifyToken";  // Importa verifyToken
import Usuarios from "../Models/usuariosModel"

const consultar = async (req: AuthenticatedRequest, res: Response) => {
    try {
        console.log("Datos del token:", req.DatosToken?.username); // Sin await
        const usuarios = await Usuarios.findAll();
        res.json({
            username: `los datos son ${req.DatosToken.username}`,
            msg: usuarios
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

    const product = await Usuarios.findByPk(id)
    try {
        res.json({
            id: `Este es el id que se paso ${id}`,
            username: `los datos del token son ${req.DatosToken}`,
            msg: product
        })
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
        const { body } = req
        await Usuarios.create(body)
        res.json({
            msg: 'se creo correctamente el usuario'
        })
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
        const { id } = req.params
        const { body } = req

        const product = await Usuarios.findByPk(id)
        if (product) {
            await product.update(body)
            res.json({
                msg: " el producto fue actualizado con exito "
            })
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
        const { id } = req.params

        const usuario = await Usuarios.findByPk(id)

        if (!usuario) {
            res.status(404).json({
                msg: `no existe el usuario ${id}`
            })
        } else {
            await usuario.destroy();
            res.json({
                msg: 'el usuario fue eliminado con exito'
            })
        }
        // Aquí agregas la lógica para borrar el usuario con el id
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

interface Usuario {
    username: string,
    password: string
}

// Función para ingresar un nuevo usuario
const RegistrarLogin = async (req: Request, res: Response) => {
    const { username, edad, password } = req.body;

    if (!username || !password || !edad) {
        res.status(400).json({ message: "Faltan datos en la solicitud" });
        return;
    }
    // const usuario:Usuario = { username, password };
    if (typeof username === 'string' && typeof password === 'string') {
        console.log("los datos son de tipo string")
        const usuario = { username, edad, password }
        await Usuarios.create(usuario)  //lo crea en la base de datos

        const UsuarioA = { username, password }

        const UsuarioArevisar: Usuario = UsuarioA
        let existe = await verificarLogin(UsuarioArevisar);
        // console.log(existe)
        if (existe) {
            //Crear un token con expiración
            const token = jwt.sign(UsuarioArevisar, "miSecreto", { expiresIn: "1h" });
            res.json({ token });
        }
        else {
            res.json({ msg: 'el usuario que ingresaste no existe Registrate' })
        }
    }
    else {
        res.json({ msg: "Ingresa correctamente el usuario" })
    }

};


const verificarLogin = async (usuario: Usuario): Promise<boolean> => {

    // Usa la interfaz para tipar el resultado de findAll
    const usuariosBD = await Usuarios.findAll({
        attributes: ["username", "password"],
        raw: true
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


// Exportar las funciones para usarlas en las rutas
export { consultar, consultarDetalle, ingresar, actualizar, borrar, RegistrarLogin, verificarLogin };
