import express, { response } from 'express'
import { PrismaClient } from '@prisma/client'
import { convertHourToMinutes } from './utils/convert-hour'
import { convertMinutesToHours } from './utils/convert-minutes'
import cors from 'cors'

const app = express()

app.use(express.json())
app.use(cors({}))

const prisma = new PrismaClient({
    log: ['query']
})

app.get('/games', async(request, response) => {
    const games = await prisma.game.findMany({
        include: {
           _count:{
            select: {
                ads: true
            }
           }
        }}
    )

    return response.json(games);
});

app.post('/games/:gameId/ads', async(request, response) => {
    const gameId = request.params.gameId;
    const body = request.body;
    
    const gameAd = await prisma.ad.create({
        data: {
            gameId,
            name: body.name,
            yearsPlaying: body.yearsPlaying,
            discord: body.discord,
            weekDays: body.weekDays.join(','),
            hourStart: convertHourToMinutes(body.hourStart),
            hourEnd: convertHourToMinutes(body.hourEnd),
            useVoiceChannel: body.useVoiceChannel,
            createAt: body.createAt,
        }
    })

    return response.status(201).json(gameAd);
});

app.get('/games/:id/ads', async(request, response)=>{
    const gameId = request.params.id;
    // return response.send(gameId)

    const ads = await prisma.ad.findMany({

        select:{
            id: true,
            name: true,
            yearsPlaying: true,
            weekDays: true,
            hourStart: true,
            hourEnd: true,
            useVoiceChannel: true
        },
        where:{
            gameId: gameId
        },
        orderBy: {
            createAt: 'desc'
        }
    })

    return response.json(ads.map(ad => {
        return {
            ...ad,
            weekDays: ad.weekDays.split(','),
            hourStart: convertMinutesToHours(ad.hourStart),
            hourEnd: convertMinutesToHours(ad.hourEnd)
        }
    }))
})

app.get('/ads/:id/discord', async(request, response)=>{
    const adId = request.params.id;

    const ad = await prisma.ad.findUniqueOrThrow({
        select:{
            discord: true,
        },
        where: {
            id: adId
        }
    })

    return response.json({
        discord: ad.discord
    })
})

app.listen(3333)