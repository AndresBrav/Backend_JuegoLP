import { DataTypes, Model } from "sequelize";
import db from "../db/conexion";

interface GrupoEstudianteAttributes {
    id?: number;
    grupo_id?: number;
    estudiante_id?: number;
    createdAt?: Date;
}

export interface GrupoEstudianteInstance
    extends Model<GrupoEstudianteAttributes>, GrupoEstudianteAttributes {}

const GrupoEstudiante = db.define<GrupoEstudianteInstance>(
    "Grupo_Estudiantes",
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
        estudiante_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        tableName: "Grupo_Estudiantes",
        timestamps: true,
        updatedAt: false,
    },
);

export default GrupoEstudiante;
