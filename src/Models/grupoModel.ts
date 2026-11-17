import { DataTypes, Model } from "sequelize";
import db from "../db/conexion";
import TemariosGrupo from "./temariosGrupoModel";
import GrupoEstudiantes from "./grupoEstudianteModel";

export interface GrupoAttributes {
    id?: number;
    nombre?: string;
    codigo?: string;
    profesor_id?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface GrupoInstance
    extends Model<GrupoAttributes>,
        GrupoAttributes {}

/**
 * Grupos: el profesor crea el grupo con un código de 6 caracteres que
 * comparte con sus estudiantes para que se unan.
 */
const Grupos = db.define<GrupoInstance>(
    "Grupos",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nombre: {
            type: DataTypes.STRING(80),
            allowNull: false,
            validate: {
                len: {
                    args: [2, 80],
                    msg: "El nombre del grupo debe tener 2 a 80 caracteres",
                },
            },
        },
        codigo: {
            type: DataTypes.STRING(6),
            allowNull: false,
            unique: true,
        },
        profesor_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        tableName: "Grupos",
        timestamps: true,
    },
);

Grupos.hasMany(TemariosGrupo, {
    foreignKey: "grupo_id",
    sourceKey: "id",
});

TemariosGrupo.belongsTo(Grupos, {
    foreignKey: "grupo_id",
    targetKey: "id",
});

Grupos.hasMany(GrupoEstudiantes, {
    foreignKey: "grupo_id",
    sourceKey: "id",
});

GrupoEstudiantes.belongsTo(Grupos, {
    foreignKey: "grupo_id",
    targetKey: "id",
});

export default Grupos;
