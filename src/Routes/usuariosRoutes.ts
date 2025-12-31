import express, { Request, Response, Router } from "express";
import {
    consultarUsuarios,
    consultarDetalle,
    ingresar,
    actualizar,
    borrar,
    RegistrarLogin,
    verificarLogin,
    traerDatosUnUsuario,
    traerPuntuacion,
    aumentarPuntuacion,
} from "../Controllers/usuariosController"; // Asegúrate de importar las funciones from '../Controllers/usuariosController'
import jwt from "jsonwebtoken"; // Asegúrate de importar jsonwebtoken
// import cors from "cors";
import verifyToken, { AuthenticatedRequest } from "../Middlewares/verifyToken"; // Importa verifyToken
import { Usuario } from "../interfaces/Usuario";
import * as dotenv from "dotenv";
dotenv.config(); // ¡Esto carga el archivo .env!
import { encrypt, decrypt } from "../utils/encriptador";

const router: Router = express.Router();

router.get("/consultar", verifyToken, consultarUsuarios);

router.post("/ingresar", verifyToken, ingresar);

router
    .route("/detalles/:id")
    .get(verifyToken, consultarDetalle) // Aplica verifyToken al método GET
    .put(verifyToken, actualizar) // Aplica verifyToken al método PUT
    .delete(verifyToken, borrar);

router.post("/login/registrar", RegistrarLogin); //Ruta para registrar un nuevo usuario e inicia sesion

//Ruta para obtener un token
router.post("/login/iniciar", async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
        res.status(400).json({ message: "Faltan datos en la solicitud" });
        return;
    }

    const usuario: Usuario = { username, password };

    let existe = await verificarLogin(usuario); //verifica que el usuario exista en la BD
    console.log(existe);
    if (existe) {
        //Crear un token con expiración
        const secretKey =
            process.env.CLAVE_JWT ??
            "no hay clave"; /* ?? solo undefined o null */
        const tokenA = jwt.sign(usuario, secretKey, { expiresIn: "1h" });
        const tokenEncriptado = encrypt(tokenA);
        const token = tokenEncriptado;
        // res.json({ token });
        res.json({ token });
    } else {
        res.json({ msg: "el usuario que ingresaste no existe Registrate" });
    }
});

// Ruta protegida que requiere token
router.get("/traerDatosUsuario", verifyToken, traerDatosUnUsuario);

router.get("/traerpuntuacion", verifyToken, traerPuntuacion);

router.put("/incrpuntos/:idjuego",verifyToken,aumentarPuntuacion);

export default router;
