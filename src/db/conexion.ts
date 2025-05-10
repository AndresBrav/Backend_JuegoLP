import { Sequelize } from "sequelize";

const db_config = {
    nombre: process.env.NOMBRE_DB as string,
    usuario: process.env.USUARIO_DB as string,
    password: process.env.PASSWORD_DB as string,
    host: process.env.PORT_DATABASE as string,
}
// Option 3: Passing parameters separately (other dialects)
const sequelize = new Sequelize(
    db_config.nombre,
    db_config.usuario,
    db_config.password,
    {
        host: db_config.host,
        dialect: "mysql",
    }
);

export default sequelize