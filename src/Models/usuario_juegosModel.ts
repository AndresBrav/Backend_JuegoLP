import { DataTypes, Model, Sequelize } from "sequelize";
import db from "../db/conexion"; // Asegúrate de que esta ruta sea correcta

// permite acceder directamente a username, edad, password

// Define el modelo con los tipos específicos
const UsuarioJuegos = db.define(
    "UsuarioJuegos",
    {
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        juego_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        completado: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        puntos: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        tableName: "Usuario_Juegos",
        timestamps: false,
    }
);

export default UsuarioJuegos;
