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

    // 1. Recordatorio obligatorio diario a las 8:00 AM
    await Notificaciones_Diaria();

    // 2. Tip de lógica y motivación gamificada por la tarde (2:00 PM)
    await Notificaciones_Tips_Gamificados();
};

export const Notificaciones_Diaria = async () => {
    cron.schedule(
        // "0 8 * * *",
        "* * * * * ",
        async () => {
            console.log("Ejecutando tarea diaria a las 8:00 am");

            try {
                const users = await Usuarios.findAll({
                    attributes: ["id"],
                    raw: true,
                });

                const ids: number[] = users.map((user) => user.id);

                for (const id of ids) {
                    await Notificaciones.create({
                        descripcion:
                            "⏰ No olvides completar tu actividad diaria",
                        usuario_id: id,
                        leido: false,
                        fecha: new Date(),
                    });
                }

                console.log(
                    `Recordatorios de 8:00 AM enviados a ${ids.length} usuarios.`,
                );
            } catch (error) {
                console.error("Error al enviar recordatorios diarios:", error);
            }
        },
        {
            timezone: "America/La_Paz",
        },
    );
};

const MENSAJES_GAMIFICADOS: string[] = [
    "💡 Recuerda: Dividir un problema complejo en subproblemas es la clave del pseudocódigo.",
    "💡 Tip de diagramas: El rombo representa una decisión. Revisa siempre que ambas salidas (Sí/No) estén conectadas.",
    "💡 Consejo de lógica: Traza las entradas, procesos y salidas en papel antes de escribir el algoritmo.",
    "🚀 Variables claras: Usa nombres descriptivos como 'sumaTotal' o 'contador' en tus programas.",
    "🔄 Atención con los bucles: Asegúrate de tener una condición de salida clara en tu ciclo para evitar bucles infinitos.",
    "🎯 ¡Hoy es un gran día para practicar! Completa un ejercicio de pseudocódigo y acumula puntos.",
    "🏆 Sigue practicando: Cada ejercicio resuelto te ayuda a escalar posiciones en la tabla de clasificación.",
    "🎨 Recuerda revisar tu perfil: Al acumular puntos podrás desbloquear nuevos avatares.",
    "📝 Comentarios explicativos: Explicar en palabras sencillas lo que hace una sección de tu algoritmo mejora tu pensamiento lógico.",
    "⚡ Desafío de lógica: Intenta resolver un diagrama de flujo de selección múltiple hoy en la plataforma.",
];

export const Notificaciones_Tips_Gamificados = async () => {
    // Se ejecuta diariamente a las 2:00 PM (14:00 hrs)
    cron.schedule(
        // "0 14 * * *",
        "* * * * * ",
        async () => {
            console.log(
                "Ejecutando tarea de tips gamificados a las 2:00 pm (14:00 hrs)",
            );

            try {
                const users = await Usuarios.findAll({
                    attributes: ["id"],
                    raw: true,
                });

                const ids: number[] = users.map((user) => user.id);

                // Seleccionar un mensaje rotativo según el día del año
                const diaDelAno = Math.floor(
                    Date.now() / (1000 * 60 * 60 * 24),
                );
                const mensajeDelDia =
                    MENSAJES_GAMIFICADOS[
                        diaDelAno % MENSAJES_GAMIFICADOS.length
                    ];

                for (const id of ids) {
                    await Notificaciones.create({
                        descripcion: mensajeDelDia,
                        usuario_id: id,
                        leido: false,
                        fecha: new Date(),
                    });
                }

                console.log(
                    `Tips gamificados diarios enviados a ${ids.length} usuarios: "${mensajeDelDia}"`,
                );
            } catch (error) {
                console.error("Error al enviar tips gamificados:", error);
            }
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
