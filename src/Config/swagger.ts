import swaggerJSDoc, { Options } from "swagger-jsdoc";
import * as dotenv from "dotenv";
dotenv.config();

const port = process.env.PORT || 4000;

const swaggerOptions: Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Backend API",
            version: "1.0.0",
            description:
                "Documentación de la API del proyecto fullstack (usuarios, juegos, avatares y notificaciones).",
        },
        servers: [
            {
                url: `http://localhost:${port}`,
                description: "Servidor local",
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: "apiKey",
                    in: "header",
                    name: "Authorization",
                    description:
                        "Token encriptado que se obtiene al iniciar sesión. Incluye el valor directamente en el header Authorization (sin prefijo Bearer), tal como lo devuelve el endpoint de login.",
                },
            },
            schemas: {
                Usuario: {
                    type: "object",
                    properties: {
                        id: { type: "integer", description: "Identificador del usuario" },
                        username: { type: "string", description: "Nombre de usuario" },
                        edad: { type: "integer", description: "Edad del usuario" },
                        password: { type: "string", description: "Contraseña del usuario" },
                        idAvatar: { type: "integer", description: "Identificador del avatar asignado" },
                    },
                },
                Juego: {
                    type: "object",
                    properties: {
                        id: { type: "integer", description: "Identificador del juego" },
                        nombre_juego: { type: "string", description: "Nombre del juego" },
                        nivel_juego: { type: "integer", description: "Nivel del juego" },
                    },
                },
                JuegosIA: {
                    type: "object",
                    properties: {
                        id: { type: "integer", description: "Identificador del juego IA" },
                        descripcion: { type: "string", description: "Descripción del juego generado con IA" },
                        tipo_juego: {
                            type: "string",
                            enum: ["ia", "iapseudo"],
                            description: "Tipo de juego IA",
                        },
                        usuario_id: { type: "integer", description: "Usuario dueño del juego" },
                        completado: { type: "boolean", description: "Indica si el juego fue completado" },
                        puntos: { type: "integer", description: "Puntos acumulados del juego" },
                    },
                },
                Avatar: {
                    type: "object",
                    properties: {
                        id: { type: "integer", description: "Identificador del avatar" },
                        url: { type: "string", description: "URL de la imagen del avatar" },
                    },
                },
                Notificacion: {
                    type: "object",
                    properties: {
                        id: { type: "integer", description: "Identificador de la notificación" },
                        descripcion: { type: "string", description: "Contenido de la notificación" },
                        usuario_id: { type: "integer", description: "Usuario destinatario" },
                        leido: { type: "boolean", description: "Indica si la notificación fue leída" },
                        fecha: { type: "string", format: "date-time", description: "Fecha de creación" },
                    },
                },
                UsuarioJuegos: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                        usuario_id: { type: "integer" },
                        juego_id: { type: "integer" },
                        completado: { type: "boolean" },
                        puntos: { type: "integer" },
                    },
                },
                AuthResponse: {
                    type: "object",
                    properties: {
                        token: {
                            type: "string",
                            description: "Token encriptado para usar en el header Authorization",
                        },
                    },
                },
            },
        },
    },
    apis: [
        "./src/Controllers/*.ts",
        "./src/Routes/*.ts",
        "./src/Config/swagger.ts",
    ],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

export default swaggerSpec;