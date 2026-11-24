import { DataTypes, Model } from "sequelize";
import db from "../db/conexion";

export interface EjercicioGrupoEstudianteAttributes {
    id?: number;
    ejercicio_grupo_id?: number;
    usuario_id?: number;
}

export interface EjercicioGrupoEstudianteInstance
    extends Model<EjercicioGrupoEstudianteAttributes>,
        EjercicioGrupoEstudianteAttributes {}

const EjercicioGrupoEstudiante =
    db.define<EjercicioGrupoEstudianteInstance>(
        "EjercicioGrupoEstudiante",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            ejercicio_grupo_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            usuario_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
        },
        {
            tableName: "Ejercicio_Grupo_Estudiantes",
            timestamps: false,
        },
    );

export default EjercicioGrupoEstudiante;
