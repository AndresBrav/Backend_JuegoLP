import cron from "node-cron";

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

export const iniciarCronJobs = () => {
    console.log("Cron inicializado");

    cron.schedule("*/10 * * * * *", () => {
        console.log("Ejecutando tarea cada minuto");
    });
};

export const RecordarDiario = async () => {
    cron.schedule(
        "*/20 * * * * *",
        () => {
            console.log("Ejecutando tarea diaria a las 8 AM");
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
