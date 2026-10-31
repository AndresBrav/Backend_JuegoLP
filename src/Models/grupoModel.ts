import { DataTypes, Model } from "sequelize";
import db from "../db/conexion";
import Usuarios from "./usuarioModel";
import GrupoEstudiante from "./grupoEstudianteModel";

interface GrupoAttributes {
    id?: number;
    nombre?: string;
    codigo?: string;
    profesor_id?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface GrupoInstance
    extends Model<GrupoAttributes>, GrupoAttributes {}

const Grupo = db.define<GrupoInstance>(
    "Grupos",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nombre: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        codigo: {
            type: DataTypes.STRING(8),
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
    },
);

Grupo.belongsTo(Usuarios, {
    as: "profesor",
    foreignKey: "profesor_id",
});

Usuarios.hasMany(Grupo, {
    as: "gruposCreados",
    foreignKey: "profesor_id",
});

Grupo.belongsToMany(Usuarios, {
    through: GrupoEstudiante,
    as: "estudiantes",
    foreignKey: "grupo_id",
    otherKey: "estudiante_id",
});

Usuarios.belongsToMany(Grupo, {
    through: GrupoEstudiante,
    as: "grupos",
    foreignKey: "estudiante_id",
    otherKey: "grupo_id",
});

Grupo.hasMany(GrupoEstudiante, {
    as: "matriculas",
    foreignKey: "grupo_id",
});

GrupoEstudiante.belongsTo(Grupo, {
    as: "grupo",
    foreignKey: "grupo_id",
});

export default Grupo;
