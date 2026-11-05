import { DataTypes, Model } from "sequelize";
import db from "../db/conexion";
import Grupo from "./grupoModel";

export interface TemarioGrupoAttributes {
    id?: number;
    grupo_id?: number;
    nombre?: string;
    descripcion?: string | null;
    orden?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface TemarioGrupoInstance
    extends Model<TemarioGrupoAttributes>,
        TemarioGrupoAttributes {}

const TemariosGrupo = db.define<TemarioGrupoInstance>("TemariosGrupo", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    grupo_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    nombre: {
        type: DataTypes.STRING(80),
        allowNull: false,
        validate: {
            len: { args: [2, 80], msg: "El nombre debe tener 2 a 80 caracteres" },
        },
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    orden: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
}, {
    tableName: "Temarios_Grupo",
    timestamps: true,
});

TemariosGrupo.belongsTo(Grupo, {
    as: "grupo",
    foreignKey: "grupo_id",
});

Grupo.hasMany(TemariosGrupo, {
    as: "temarios",
    foreignKey: "grupo_id",
});

// La asociación con EjerciciosGrupo (alias "temario") se define una sola
// vez en ejerciciosGrupoModel.ts para evitar el ciclo de imports.

export default TemariosGrupo;
