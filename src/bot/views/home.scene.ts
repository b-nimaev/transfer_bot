import { Composer, Scenes } from "telegraf";
import { ExtraEditMessageText } from "telegraf/typings/telegram-types";
import { IUser, User } from "../../models/IUser";
import rlhubContext from "../models/rlhubContext";
import { CarModel, ICar } from "../../models/ICar";
import { ObjectId } from "mongodb";
import { InlineKeyboardButton } from "telegraf/typings/core/types/typegram";
import { Markup } from "telegraf";

const handler = new Composer<rlhubContext>();
const home = new Scenes.WizardScene("home", 
    handler,
    async (ctx) => await add_car_handler(ctx),
    async (ctx) => await cars_list_hander(ctx),
    async (ctx) => await choose_date_handler(ctx),
    async (ctx) => await select_hours_handler(ctx)
);

// функция приветствия
export async function greeting (ctx: rlhubContext, reply?: boolean) {

    let user: IUser | null = await User.findOne({ id: ctx.from?.id })

    if (!user) {
        await new User(ctx.from).save()
        
        let greeting_m = 'Приветствую, ' + ctx.from?.first_name

        await ctx.reply(greeting_m)
        return ctx.scene.enter('home')
    }

    let extra: ExtraEditMessageText = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Просмотр доступных машин',
                        callback_data: 'cars_list'
                    }
                ]
            ]
        }
    }
    
    if (user?.is_admin) {

        // добавляем кнопку для добавления машин
        extra.reply_markup?.inline_keyboard.push([{ text: 'Добавить машину', callback_data: 'add_car' }])
    
    }
    
    let message: string = 'Выберите раздел для начала работ'
    
    try {
        
        if (reply) {
            return ctx.reply(message, extra)
        }

        // ctx.updateType === 'message' ? await ctx.reply(message, extra) : false
        ctx.updateType === 'callback_query' ? await ctx.editMessageText(message, extra) : ctx.reply(message, extra)

    } catch (err) {
    
        console.log(err)
    
    }
}

home.start(async (ctx: rlhubContext) => {

    try {

        await greeting(ctx)

    } catch (err) {
        
        console.log(err)

    }
})

home.enter(async (ctx) => { 
    await greeting(ctx)
 })

home.action(/\./, async (ctx) => {
    
    await greeting(ctx)

})

async function getTomorrowDateAndMonth() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const months = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];

    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    const currentMonth = months[today.getMonth()];

    return {
        tomorrowDate: tomorrow.getDate(),
        currentMonth: currentMonth,
        daysInMonth: lastDayOfMonth,
        indexMonth: today.getMonth() + 1,
        currentYear: today.getFullYear()
    };
}

async function select_hours_handler (ctx: rlhubContext) {
    try {

        if (ctx.updateType === 'callback_query') {

            let data: string = ctx.update.callback_query.data

            if (data.indexOf('select_hours') !== -1) {

                let hours = data.split('-')[1]

                ctx.answerCbQuery(`Выбранная продолжительность ${hours} ⏳`)

                
            } else if (data === 'choose-car') {

                // await add_car_render(ctx)
                await cars_list_render(ctx)

            } else if (data === 'back') {
                
                await choose_date_handler(ctx)

            } else {
                
                ctx.answerCbQuery()

            }


        }

    } catch (error) {

        console.error(error)
        

    }
}

async function generateNewKeyboard(ctx: rlhubContext, prev?: boolean) {

    const keyboard: any = [];

    // Используйте startingDay вместо завтрашней даты для начала генерации
    const startDate = ctx.scene.session.ended_date;

    for (let i = 0; i < 21; i++) {

        // получаем дату на котором остановились до этого
        const date = new Date(startDate);

        if (prev) {
            
            // устанавливаем дату с которого начинать итерацию
            date.setDate(startDate.getDate() - 40 + i);
            
        } else {
            
            date.setDate((startDate.getDate() + i));

        }


        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'long' });

        const callbackData = `choosed-date-${day}-${date.getMonth() + 1}-${date.getFullYear()}`;

        const button = {
            text: `${day} ${month}`,
            callback_data: callbackData,
        };

        if (i % 7 === 0) {
            // Создаем новый столбец
            // @ts-ignore
            keyboard.push([button]);
        } else {
            // Добавляем кнопку в уже существующий столбец
            // @ts-ignore
            keyboard[keyboard.length - 1].push(button);
        }
        
        ctx.scene.session.ended_date = date

    }
    
    // Транспонируем клавиатуру, чтобы получить три столбца
    // @ts-ignore
    const transposedKeyboard = keyboard[0].map((_, colIndex) => keyboard.map(row => row[colIndex]));

    return transposedKeyboard;
}

async function generateKeyboard(ctx: rlhubContext, prev?: true) {
    const keyboard: any = [];

    const today = new Date();
    const tomorrow = new Date(today);
    
    if (prev) {
    
        tomorrow.setDate((today.getDate() + 1) - 21);
    
    } else {
    
        tomorrow.setDate(today.getDate() + 1);
    
    }

    for (let i = 0; i < 21; i++) {
        const date = new Date(tomorrow);
        date.setDate(tomorrow.getDate() + i);

        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'long' });

        const callbackData = `choosed-date-${day}-${date.getMonth() + 1}-${date.getFullYear()}`;

        const button = {
            text: `${day} ${month}`,
            callback_data: callbackData,
        };

        if (i % 7 === 0) {
            // Создаем новый столбец
            // @ts-ignore
            keyboard.push([button]);
        } else {
            // Добавляем кнопку в уже существующий столбец
            // @ts-ignore
            keyboard[keyboard.length - 1].push(button);
        }

        ctx.scene.session.ended_date = date

    }
    
    // Транспонируем клавиатуру, чтобы получить три столбца
    // @ts-ignore
    const transposedKeyboard = keyboard[0].map((_, colIndex) => keyboard.map(row => row[colIndex]));

    return transposedKeyboard;
}

async function choose_date_render (ctx: rlhubContext) {
    try {

        let message: string = `Укажите дату бронирования \n`
        
        const keyboard: any = await generateKeyboard(ctx)
        
        let extra: ExtraEditMessageText = {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: keyboard
            }
        }

        const result = await getTomorrowDateAndMonth();
        
        message += `-\n`
        message += `<i>Сегодня ${result.tomorrowDate - 1} ${result.currentMonth}, ${result.currentYear}</i>`

        console.log(`Tomorrow will be ${result.tomorrowDate} ${result.currentMonth}`);
        console.log(`Showed be: from ${keyboard[0][0].callback_data}`);
        
        message += `\n-\n`
        message += `<i>Отображены числа  [ ${keyboard[0][0].text}, ${keyboard[0][0].callback_data.slice(-4)} ] по [ ${keyboard[6][2].text}, ${keyboard[6][2].callback_data.slice(-4)} ] </i>`

        // console.log(`Showed be: to ${keyboard[0][keyboard[0].length].callback_data}`);

        // добавление кнопки назад

        extra.reply_markup?.inline_keyboard.push([
            { text: '« Назад', callback_data: 'prev-21-days' },
            { text: 'Далее »', callback_data: 'next-21-days' },
        ])
        extra.reply_markup?.inline_keyboard.push([{ text: 'Выбрать машину', callback_data: 'back' }])
        extra.reply_markup?.inline_keyboard.push([{ text: 'На главную', callback_data: 'home' }])

        if (ctx.updateType === 'callback_query') {

            await ctx.editMessageText(message, extra)

        }

        ctx.wizard.selectStep(3)

    } catch (error) {

        console.error(error)

    }
}

async function choose_date_handler (ctx: rlhubContext) {
    try {

        if (ctx.updateType === 'callback_query') {

            const data: 'next-21-days' | 'prev-21-days' | 'home' | 'back' | string = ctx.update.callback_query.data

            if (data === 'prev-21-days' || data === 'next-21-days') {

                let message: string = `Укажите дату бронирования \n`

                message += `-\n`

                const result = await getTomorrowDateAndMonth();

                message += `<i>Сегодня ${result.tomorrowDate - 1} ${result.currentMonth}, ${result.currentYear}</i>`

                let new_keyboard: any

                if (data === 'next-21-days') {
                
                    new_keyboard = await generateNewKeyboard(ctx)
                
                } else {

                    new_keyboard = await generateNewKeyboard(ctx, true)

                }

                message += `\n-\n`
                message += `<i>Отображены числа  [ ${new_keyboard[0][0].text}, ${new_keyboard[0][0].callback_data.slice(-4)} ] по [ ${new_keyboard[6][2].text}, ${new_keyboard[6][2].callback_data.slice(-4)} ] </i>`

                let extra: ExtraEditMessageText = {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: new_keyboard
                    }
                }

                extra.reply_markup?.inline_keyboard.push([
                    { text: '« Назад', callback_data: 'prev-21-days' },
                    { text: 'Далее »', callback_data: 'next-21-days' },
                ])
                extra.reply_markup?.inline_keyboard.push([{ text: 'Выбрать машину', callback_data: 'back' }])
                extra.reply_markup?.inline_keyboard.push([{ text: 'На главную', callback_data: 'home' }])

                await ctx.editMessageText(message, extra)

            }

            if (data === 'back') {

                await choose_date_render(ctx)

            }

            if (data === 'home') {

                await ctx.scene.enter('home')

            }

            else {

                if (data.indexOf('choosed-date') !== -1) {

                    
                    const date = {
                        day: parseFloat(data.split('-')[2]),
                        month: parseFloat(data.split('-')[3]),
                        year: parseFloat(data.slice(-4))
                    }

                    const months = [
                        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
                    ];
                    
                    let message: string = `Выберите продолжительность аренды <b>на дату ${date.day} ${months[date.month - 1]} ${date.year}</b>\n`

                    const car = await CarModel.findById(new ObjectId(ctx.scene.session.selected_car))

                    message += `Выбранная машина: ${car?.name}`

                    const extra: ExtraEditMessageText = {
                        parse_mode: 'HTML',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: '3 часа', callback_data: 'select_hours-3' },
                                    { text: '6 часов', callback_data: 'select_hours-6' },
                                    { text: '8 часов', callback_data: 'select_hours-8' }
                                ],
                                [{ text: 'Выбрать машину', callback_data: 'choose-car' }],
                                [{ text: 'Выбрать дату', callback_data: 'back' }],
                                [{ text: 'На главную', callback_data: 'home' }]
                            ]
                        }
                    }

                    await ctx.editMessageText(message, extra)
                    ctx.wizard.selectStep(4)
                    return ctx.answerCbQuery('Выбрана дата!')

                }

            }

            ctx.answerCbQuery()

        }

    } catch (error) {

        console.error(error)

    }
}

/**
 * Обработка команда "Просмотр доступных машин"
 */

handler.action("cars_list", async (ctx) => await cars_list_render(ctx))

async function cars_list_render (ctx: rlhubContext) {
    try {

        let message: string = `Секция: Список доступных машин \n\n`
        let extra: ExtraEditMessageText = {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: []
            }
        }


        const cars = await CarModel.find()

        for (let i = 0; i < cars.length; i++) {

            let car: ICar = cars[i]
            
            if (car._id) {
                extra.reply_markup?.inline_keyboard.push([{
                    text: car.name,
                    callback_data: 'car ' + car._id.toString()
                }])
            }

        }

        // добавление кнопки назад

        extra.reply_markup?.inline_keyboard.push([{ text: 'Назад', callback_data: 'back' }])

        await ctx.editMessageText(message, extra)
        ctx.wizard.selectStep(2)

    } catch (error) {

        console.error(error)

    }
}

async function cars_list_hander (ctx: rlhubContext) {

    try {

        if (ctx.updateType === 'callback_query') {

            const data: string = ctx.update.callback_query.data

            if (data === 'back') {
                
                ctx.wizard.selectStep(0)
                return await greeting(ctx)

            } else {

                let callback_data: string =  data.split(' ')[1]
                ctx.scene.session.selected_car = new ObjectId(callback_data)
                
                // const car: ICar | null = await CarModel.findOne()

                await choose_date_render(ctx)

                ctx.answerCbQuery()

            }

        }

    } catch (error) {

        console.error(error)

    }

}

/**
 * Обработка команды "Добавить машину"
 */

handler.action("add_car", async (ctx) => await add_car_render(ctx))

/**
 * 
 * Секция для работы со списком существующих машин!
 */
async function add_car_render(ctx: rlhubContext) {

    try {

        let message: string = `<b>Секция: Добавление машин</b>\n\n`

        let extra: ExtraEditMessageText = {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Назад',
                            callback_data: 'back'
                        }
                    ]
                ]
            }
        }

        await ctx.editMessageText(message, extra)
        ctx.wizard.selectStep(1)
        ctx.answerCbQuery()

    } catch (error) {

        console.error(error)

    }

}
async function add_car_handler (ctx: rlhubContext) {
    try {

        if (ctx.updateType === 'message') {

            if (ctx.update.message.text) {

                ctx.scene.session.car_name = ctx.update.message.text
                let message_confirm: string = `Вы хотите добавить <b>${ctx.update.message.text}? в список машин</b>`

                let extra: ExtraEditMessageText = {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: 'Да',
                                    callback_data: 'yes'
                                },
                                {
                                    text: 'Нет',
                                    callback_data: 'no'
                                }
                            ],
                            [
                                {
                                    text: 'Назад',
                                    callback_data: 'back'
                                }
                            ]
                        ]
                    }
                }
                
                await ctx.reply(message_confirm, extra)

            }

        } else if (ctx.updateType === 'callback_query') {

            let data: 'back' | 'yes' | 'no' = ctx.update.callback_query.data

            if (data === 'back') {

                ctx.wizard.selectStep(0)
                return await greeting(ctx)

            } else if (data === 'no') {

                return await add_car_render(ctx)

            } else {

                await new CarModel({ name: ctx.scene.session.car_name }).save()
                await ctx.answerCbQuery('Машина сохранена ✅')
                ctx.wizard.selectStep(0)
                return await greeting(ctx)

            }
            
        }

    } catch (error) {
        
        console.error(error)

    }
}
/**
 * 
 * Завершение секции для работы со списком существующих машин
 */

export default home