import { DataTypes, Model } from "sequelize";
import db from "../db/conexion";

export interface GrupoEstudiantesAttributes {
    id?: number;
    grupo_id?: number;
    usuario_id?: number;
    fecha_union?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface GrupoEstudiantesInstance
    extends Model<GrupoEstudiantesAttributes>,
        GrupoEstudiantesAttributes {}

/**
 * Inscripción de un estudiante en un grupo (many-to-many).
 * El índice único (grupo_id, usuario_id) está en la migración: un
 * estudiante no puede inscribirse dos veces al mismo grupo.
 */
const GrupoEstudiantes = db.define<GrupoEstudiantesInstance>(
    "GrupoEstudiantes",
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
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        fecha_union: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
    },
    {
        tableName: "Grupo_Estudiantes",
        timestamps: true,
    },
);

export default GrupoEstudiantes;
