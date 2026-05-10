import cron from "node-cron";
import Notificaciones from "../Models/NotificacionesModel";
import Usuarios from "../Models/usuarioModel";

// * * * * * *
// │ │ │ │ │ │
// │ │ │ │ │ └── día de la semana
// │ │ │ │ └──── mes
// │ │ │ └────── día del mes
// │ │ └──────── hora
// │ └────────── minuto
// └──────────── segundo

// * * * * *
// │ │ │ │ │
// │ │ │ │ └── día de la semana (0-7)
// │ │ │ └──── mes (1-12)
// │ │ └────── día del mes (1-31)
// │ └──────── hora (0-23)
// └────────── minuto (0-59)

export const iniciarCronJobs = async () => {
    console.log("Cron inicializado");

    // notificaciones diarias
    await Notificaciones_Diaria();
};

export const Notificaciones_Diaria = async () => {
    cron.schedule(
        "0 8 * * *",
        async () => {
            console.log("Ejecutando tarea cada dia a las 8:00 am");

            const users = await Usuarios.findAll({
                attributes: ["id"],
                raw: true,
            });

            const ids: number[] = users.map((user) => user.id);

            console.log(users);
            console.log(ids);

            const noti = await Notificaciones.findAll();
            console.log(noti);

            // vamos a llenar la base de datos de usuario con notificaciones
            for (const id of ids) {
                await Notificaciones.create({
                    descripcion: "⏰ No olvides completar tu actividad diaria",
                    usuario_id: id,
                    leido: false,
                    fecha: new Date(),
                });
            }

            Notificaciones.findAll({ raw: true })
                .then((res) => console.log(res))
                .catch((error) => console.error("Error:", error));
        },
        {
            timezone: "America/La_Paz",
        },
    );
};

// cron.schedule(
//     "0 8 * * *",
//     () => {
//         console.log("Ejecutando tarea diaria a las 8 AM");
//     },
//     {
//         timezone: "America/La_Paz",
//     },
// );
