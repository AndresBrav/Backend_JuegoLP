import { DataTypes, Model } from "sequelize";
import db from "../db/conexion";
import UsuarioJuegosIA from "./usuario_juegosIAModel";

// atributos
export interface JuegosIAAttributes {
    id?: number;
    descripcion?: string;
    tipo_juego?: string;
    usuario_id?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

// instancia
export interface JuegosIAInstance
    extends Model<JuegosIAAttributes>,
        JuegosIAAttributes {}

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
    },
    {
        tableName: "juegosia",
        timestamps: true,
    },
);

JuegosIA.hasMany(UsuarioJuegosIA, {
    foreignKey: "juego_ia_id",
    sourceKey: "id",
});

UsuarioJuegosIA.belongsTo(JuegosIA, {
    foreignKey: "juego_ia_id",
    targetKey: "id",
});

export default JuegosIA;
