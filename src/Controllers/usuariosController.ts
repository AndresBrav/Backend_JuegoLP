import { Request, Response } from "express";
import jwt from "jsonwebtoken";  // Asegúrate de importar jsonwebtoken
// import cors from "cors";
import verifyToken, { AuthenticatedRequest } from "../Middlewares/verifyToken";  // Importa verifyToken


const consultar =  async(req: AuthenticatedRequest, res: Response)=> {
    try {
        console.log("Datos del token:", req.DatosToken?.username); // Sin await
        
        res.json({
            username: `los datos son ${req.DatosToken.username}`
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
    try {
        res.json({ 
            msg:`Este es el id que se paso ${id}`,
            username: `los datos son ${req.DatosToken.username}`
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
        // Aquí agregas la lógica para ingresar el usuario
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

// Función para actualizar un usuario
const actualizar = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        // Aquí puedes agregar la lógica para actualizar el usuario con el id
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

// Función para borrar un usuario
const borrar = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        // Aquí agregas la lógica para borrar el usuario con el id
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

// Exportar las funciones para usarlas en las rutas
export { consultar, consultarDetalle, ingresar, actualizar, borrar };
