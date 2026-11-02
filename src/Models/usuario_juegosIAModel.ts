import { DataTypes, Model } from "sequelize";
import db from "../db/conexion";

export interface UsuarioJuegosIAAttributes {
    id?: number;
    usuario_id?: number;
    juego_ia_id?: number;
    completado?: boolean;
    puntos?: number;
    estado_tablero?: string | null;
    fecha_completado?: Date | null;
    ultima_actividad?: Date | null;
}

export interface UsuarioJuegosIAInstance
    extends Model<UsuarioJuegosIAAttributes>,
        UsuarioJuegosIAAttributes {}

const UsuarioJuegosIA = db.define<UsuarioJuegosIAInstance>(
    "UsuarioJuegosIA",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        juego_ia_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        completado: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        puntos: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        estado_tablero: {
            type: DataTypes.TEXT("long"),
            allowNull: true,
        },
        fecha_completado: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        ultima_actividad: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: "Usuario_JuegosIA",
        timestamps: false,
    },
);

export default UsuarioJuegosIA;
