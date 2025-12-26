import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
    process.env.DB_NAME as string,
    process.env.DB_USER as string,
    process.env.DB_PASSWORD as string,
    {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT), // ¡Importante: el puerto 27284!
        dialect: "mysql",
        dialectOptions: {
            ssl: {
                require: true, // Porque Aiven exige SSL
                rejectUnauthorized: false, // Recomendado para seguridad vamos  a ponerlo false porsiacaso
            },
        },
        logging: false, // Opcional: quita logs de consultas si quieres
    }
);

export default sequelize;

// import { Sequelize } from "sequelize";

// const db_config = {
//     nombre: process.env.NOMBRE_DB as string,
//     usuario: process.env.USUARIO_DB as string,
//     password: process.env.PASSWORD_DB as string,
//     host: process.env.PORT_DATABASE as string,
// }
// // Option 3: Passing parameters separately (other dialects)
// const sequelize = new Sequelize(
//     db_config.nombre,
//     db_config.usuario,
//     db_config.password,
//     {
//         host: db_config.host,
//         dialect: "mysql",
//     }
// );

// export default sequelize
