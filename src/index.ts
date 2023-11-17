import dotenv from 'dotenv';
import rlhubContext from './bot/models/rlhubContext';
import { Scenes, Telegraf, session } from 'telegraf';
dotenv.config()

export const bot = new Telegraf<rlhubContext>(process.env.BOT_TOKEN!);

import './app'
import './webhook'
import './database'

import home from './bot/views/home.scene';
import sentences from './bot/views/sentences.scene';
import settings from './bot/views/settings.scene';
import dashboard from './bot/views/dashboard.scene';
import vocabular from './bot/views/vocabular.scene';
import moderation from './bot/views/moderation.scene';
import chat from './bot/views/chat.scene';
import { Translation, voteModel } from './models/ISentence';
import { IUser, User } from './models/IUser';
import { ExtraEditMessageText } from 'telegraf/typings/telegram-types';
import { InlineQueryResult } from 'telegraf/typings/core/types/typegram';
import { greeting } from './bot/views/home.scene';
    
const stage: any = new Scenes.Stage<rlhubContext>([ home ], { default: 'home' });

bot.use(session())
bot.use(stage.middleware())

bot.start(async (ctx) => {
    await ctx.scene.enter('home')
    // ctx.deleteMessage(874)
})

bot.action(/./, async function (ctx: rlhubContext) {
    // await ctx.scene.enter('home')
    ctx.answerCbQuery()
    await greeting(ctx, true)
})

bot.command('chat', async (ctx) => { await ctx.scene.enter('chatgpt') })
bot.command('home', async (ctx) => { await ctx.scene.enter('home') })

// bot.on("inline_query", async (ctx) => {

//     const query = ctx.inlineQuery.query

//     console.log(query)
    
//     const results: InlineQueryResult[] = [
//         {
//             type: 'document',
//             id: '1',
//             title: 'Результат 1',
//             input_message_content: {
//                 message_text: 'Это результат 1'
//             },
//         },
//         // Добавьте другие результаты поиска
//     ];

//     // @ts-ignore
//     await ctx.answerInlineQuery(results, {});

// })