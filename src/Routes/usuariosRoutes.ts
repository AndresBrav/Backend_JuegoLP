import express, { Request, Response, Router } from 'express';
import { consultar, consultarDetalle, ingresar, actualizar, borrar } from '../Controllers/usuariosController'; // Asegúrate de importar las funciones from '../Controllers/usuariosController'
import jwt from "jsonwebtoken";  // Asegúrate de importar jsonwebtoken
// import cors from "cors";
import verifyToken, { AuthenticatedRequest } from "../Middlewares/verifyToken";  // Importa verifyToken


const router: Router = express.Router();

interface Usuario{
    id:number,
    username:string,
    edad:number
}

// Simular una "base de datos" con un arreglo
const usuarios: Usuario[] = [
    { id: 1, username: "Andres", edad: 25 },
    { id: 2, username: "Maria", edad: 30 },
    { id: 3, username: "Juan", edad: 22 },
    { id: 4, username: "Sofia", edad: 28 }
];

router.get('/consultar',verifyToken,consultar);

router.post('/ingresar',verifyToken,ingresar);

router.route("/detalles/:id")
    .get(verifyToken, consultarDetalle)  // Aplica verifyToken al método GET
    .put(verifyToken, actualizar)        // Aplica verifyToken al método PUT
    .delete(verifyToken, borrar);



//Ruta para obtener un token
router.post("/login/usuario", (req: Request, res: Response): void => {
    const { id, username, edad } = req.body;

    if (!id || !username || !edad) {
        res.status(400).json({ message: "Faltan datos en la solicitud" });
        return;
    }

    const usuario = { id, username, edad };

    //verificarLogin(usuario);

    // Crear un token con expiración
    const token = jwt.sign(usuario, "miSecreto", { expiresIn: "1h" });

    res.json({ token });
});

// const verificarLogin = () => {
    
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