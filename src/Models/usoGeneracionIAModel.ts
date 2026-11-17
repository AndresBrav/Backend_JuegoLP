import { DataTypes, Model } from "sequelize";
import db from "../db/conexion";

interface UsoGeneracionIAAttributes {
    id?: number;
    usuario_id?: number;
    fecha_local?: string;
    cantidad?: number;
}

interface UsoGeneracionIAInstance
    extends Model<UsoGeneracionIAAttributes>,
        UsoGeneracionIAAttributes {}

const UsoGeneracionIA = db.define<UsoGeneracionIAInstance>(
    "UsoGeneracionIA",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        fecha_local: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        cantidad: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    },
    {
        tableName: "Uso_Generacion_IA",
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ["usuario_id", "fecha_local"],
                name: "uq_uso_generacion_ia_usuario_fecha",
            },
        ],
    },
);

export default UsoGeneracionIA;
