import { DataTypes, Model } from "sequelize";
import db from "../db/conexion";

// atributos
interface JuegosIAAttributes {
    id?: number;
    descripcion?: string;
    tipo_juego?: string;
    usuario_id?: number;
    completado?: boolean;
    puntos?: number;
    estado_tablero?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

// instancia
export interface JuegosIAInstance
    extends Model<JuegosIAAttributes>, JuegosIAAttributes {}

const JuegosIA = db.define<JuegosIAInstance>(
    "JuegosIA",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        descripcion: {
            type: DataTypes.STRING(2000),
            allowNull: true,
        },
        tipo_juego: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        usuario_id: {
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
    },
    {
        tableName: "juegosia",
        timestamps: true, // 👈 porque tu migration tiene createdAt y updatedAt
    },
);

export default JuegosIA;
