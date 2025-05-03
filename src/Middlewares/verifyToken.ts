import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import * as dotenv from 'dotenv';
dotenv.config(); // ¡Esto carga el archivo .env!

// Secreto para firmar el token (puedes cambiar esto por un valor más seguro más adelante)
const secretKey = process.env.CLAVE_JWT ?? 'no hay clave';

// Extender `Request` para agregar `DatosToken`
export interface AuthenticatedRequest extends Request {
    DatosToken?: JwtPayload;
}

// Middleware para verificar el token
const verifyToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const token = req.header("Authorization");

    if (!token) {
        res.status(403).send("Acceso denegado");
        return;
    }

    try {
        // Verificar y decodificar el token
        const decoded = jwt.verify(token, secretKey) as JwtPayload;
        req.DatosToken = decoded;
        next();
    } catch (err) {
        res.status(400).send("Token no válido");
    }
};

export default verifyToken;
