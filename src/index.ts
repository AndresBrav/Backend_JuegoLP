import ApiServer from "./Config/apiServer";

const apiServer = new ApiServer(); //llamamos al servidor 
apiServer.escuchar();                //ejecutamos su metodo que escucha al puerto