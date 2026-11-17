import { DataTypes, Model } from "sequelize";
import db from "../db/conexion";
import EjerciciosGrupo from "./ejerciciosGrupoModel";

export interface TemariosGrupoAttributes {
    id?: number;
    grupo_id?: number;
    nombre?: string;
    orden?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface TemariosGrupoInstance
    extends Model<TemariosGrupoAttributes>,
        TemariosGrupoAttributes {}

/**
 * Temarios DENTRO de un grupo. El índice único (grupo_id, nombre) está
 * en la migración: nombres de temario repetidos solo dentro del mismo
 * grupo están prohibidos.
 */
const TemariosGrupo = db.define<TemariosGrupoInstance>(
    "TemariosGrupo",
    {
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
                len: {
                    args: [2, 80],
                    msg: "El nombre del temario debe tener 2 a 80 caracteres",
                },
            },
        },
        orden: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    },
    {
        tableName: "Temarios_Grupo",
        timestamps: true,
    },
);

TemariosGrupo.hasMany(EjerciciosGrupo, {
    foreignKey: "temario_id",
    sourceKey: "id",
});

EjerciciosGrupo.belongsTo(TemariosGrupo, {
    foreignKey: "temario_id",
    targetKey: "id",
});

export default TemariosGrupo;
