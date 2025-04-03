// import express, { Request, Response } from "express";
// import jwt from "jsonwebtoken";  // Asegúrate de importar jsonwebtoken
// import cors from "cors";
// import verifyToken, { AuthenticatedRequest } from "./middlewares/verifyToken";  // Importa verifyToken

// const app = express();
// const port = 3000;

// app.use(cors());
// app.use(express.json());

// // Ruta para obtener un token
// app.post("/login", (req: Request, res: Response): void => {
//     const { id, username, edad } = req.body;

//     if (!id || !username || !edad) {
//         res.status(400).json({ message: "Faltan datos en la solicitud" });
//         return;
//     }

//     const usuario = { id, username, edad };

//     // Crear un token con expiración
//     const token = jwt.sign(usuario, "miSecreto", { expiresIn: "1h" });

//     res.json({ token });
// });

// // Ruta protegida que requiere token
// app.get("/protected", verifyToken, (req: AuthenticatedRequest, res: Response): void => {
//     res.send(`Acceso permitido a la ruta protegida. El username del usuario es: ${req.DatosToken?.username}`);
// });

// // Ruta para obtener datos del usuario desde el token
// app.get("/hola", verifyToken, (req: AuthenticatedRequest, res: Response): void => {
//     const { id, username } = req.DatosToken || {};

//     if (!id || !username) {
//         res.status(400).json({ message: "Token inválido" });
//         return;
//     }

//     res.send(`El id del usuario es: ${id}, El username es: ${username}`);
// });

// app.listen(port, () => {
//     console.log(`Servidor escuchando en http://localhost:${port}`);
// });

import ApiServer from "./Config/apiServer";

const apiServer = new ApiServer(); //llamamos al servidor 
apiServer.escuchar();   