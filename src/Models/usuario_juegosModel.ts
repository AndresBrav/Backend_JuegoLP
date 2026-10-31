import { DataTypes, Model } from "sequelize";
import db from "../db/conexion";

interface UsuariosJuegosAttributes {
    id?: number;
    usuario_id?: number;
    juego_id?: number;
    completado?: boolean;
    puntos?: number;
    fecha_completado?: Date | null;
    ultima_actividad?: Date | null;
    intentos?: number;
}

export interface UsuariosJuegosInstance
    extends Model<UsuariosJuegosAttributes>, UsuariosJuegosAttributes {}

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
        fecha_completado: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        ultima_actividad: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        intentos: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    },
    {
        tableName: "Usuario_Juegos",
        timestamps: false,
    },
);

export default UsuarioJuegos;
