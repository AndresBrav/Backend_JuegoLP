import { DataTypes, Model, Sequelize } from "sequelize";
import db from "../db/conexion"; // Asegúrate de que esta ruta sea correcta

interface UsuariosJuegosAttributes {
    id?: number;
    usuario_id?: number;
    juego_id?: number;
    completado?: boolean;
    puntos?: number;
}

// Define una interfaz para la instancia del modelo
export interface UsuariosJuegosInstance
    extends Model<UsuariosJuegosAttributes>, // incluye métodos como .save(), .destroy(), etc. // Métodos de Sequelize con tipos
        UsuariosJuegosAttributes {} // permite acceder directamente a username, edad, password

// permite acceder directamente a username, edad, password

// Define el modelo con los tipos específicos
const UsuarioJuegos = db.define<UsuariosJuegosInstance>(
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
