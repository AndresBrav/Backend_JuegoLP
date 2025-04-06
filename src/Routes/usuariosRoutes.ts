import express, { Request, Response, Router } from 'express';
import { consultar, consultarDetalle, ingresar, actualizar, borrar, verificarLogin } from '../Controllers/usuariosController'; // Asegúrate de importar las funciones from '../Controllers/usuariosController'
import jwt from "jsonwebtoken";  // Asegúrate de importar jsonwebtoken
// import cors from "cors";
import verifyToken, { AuthenticatedRequest } from "../Middlewares/verifyToken";  // Importa verifyToken


const router: Router = express.Router();

interface Usuario {
    username: string,
    password: string
}



router.get('/consultar', verifyToken, consultar);

router.post('/ingresar', verifyToken, ingresar);

router.route("/detalles/:id")
    .get(verifyToken, consultarDetalle)  // Aplica verifyToken al método GET
    .put(verifyToken, actualizar)        // Aplica verifyToken al método PUT
    .delete(verifyToken, borrar);



//Ruta para obtener un token
router.post("/login/usuario", async(req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
        res.status(400).json({ message: "Faltan datos en la solicitud" });
        return;
    }

    const usuario: Usuario = {  username, password };

    let existe = await verificarLogin(usuario);                   //verifica que el usuario exista en la BD
    console.log(existe)
    if (existe) {
        //Crear un token con expiración
        const token = jwt.sign(usuario, "miSecreto", { expiresIn: "1h" });
        res.json({ token });
    }
    else {
        res.json({ msg: 'el usuario que ingresaste no existe Registrate' })
    }

});

// const verificarLogin = (usuario: Usuario): boolean => {
//     const UsuarioALogear: Usuario = usuario
//     console.log("el usuario que se va logear es ")
//     console.log(UsuarioALogear);

//     let registro: boolean = false;

//     // console.log("el numeros de usuarios es "+usuarios.length)
//     for (let i = 0; i < usuarios.length; i++) {
//         if (
//             usuarios[i].username === UsuarioALogear.username &&
//             usuarios[i].password === UsuarioALogear.password) {
//             registro = true;
//         }
//     }

//     return registro;
// }

// Ruta protegida que requiere token
router.get("/protected/usuario", verifyToken, (req: AuthenticatedRequest, res: Response): void => {
    res.send(`Acceso permitido a la ruta protegida. El username del usuario es: ${req.DatosToken?.username}`);
});

// Ruta para obtener datos del usuario desde el token
router.get("/hola/usuario", verifyToken, (req: AuthenticatedRequest, res: Response): void => {
    const { id, username } = req.DatosToken || {};

    if (!id || !username) {
        res.status(400).json({ message: "Token inválido" });
        return;
    }

    res.send(`El id del usuario es: ${id}, El username es: ${username}`);
});

export default router;