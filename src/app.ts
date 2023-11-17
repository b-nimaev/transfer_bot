import express from 'express';
import bodyParser from 'body-parser';
import { bot } from './index';
import cors from 'cors';
const morgan = require("morgan")
const PORT = process.env.PORT;

const app = express();

export const secretPath = `/telegraf/secret_path/bot1`;

app.use(bodyParser.json());

// Настройка CORS
const corsOptions = {
    origin: '*', // Замените на адрес вашего клиентского приложения
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.post(secretPath, (req, res) => {
    bot.handleUpdate(req.body, res);
});

app.get("/", (req, res) => res.send("Бот запущен!"))

app.use(morgan("dev"));
app.use(express.json())
app.use(cors(corsOptions));

app.listen(PORT, () => { console.log(`Server running on port ${PORT}`) });

const fetchData = async () => {
    const { default: fetch } = await import('node-fetch');

    const res = await fetch('http://127.0.0.1:4040/api/tunnels')
    //@ts-ignore
    // console.log(await res.json().tu)
    const json = await res.json();
    // console.log(json)
    //@ts-ignore
    const secureTunnel = json.tunnels[0].public_url
    console.log(secureTunnel)
    await bot.telegram.setWebhook(`${secureTunnel}${secretPath}`)
        .then(res => {
            console.log(res)
        })
};

async function set_webhook() {
    console.log(`${process.env.mode?.replace(/"/g, '')}`)
    if (`${process.env.mode?.replace(/"/g, '')}` === "production") {
        console.log(`${process.env.mode?.replace(/"/g, '')}`)
        console.log(`prod secret path: ${secretPath}`)
        await bot.telegram.setWebhook(`https://drvcash.com` + secretPath)
            .then((status) => {
                console.log('webhook setted status: ' + status);
            }).catch(err => {
                console.log(err)
            })
    } else {
        await fetchData().catch((error: any) => {
            console.error('Error setting webhook:', error);
        });
    }
};

set_webhook()
