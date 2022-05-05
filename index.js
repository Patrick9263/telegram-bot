require('dotenv').config()

const { Telegraf } = require('telegraf')

const bot = new Telegraf(process.env.TELEGRAM_TOKEN)
bot.start((ctx) => ctx.reply('Starting bot...'))
/*
	the above line runs when a user interact with the bot for the first time or
	type /start. Everything that goes into ctx.reply("message goes here") will be
	sent as a message to the user by the bot.
*/

const trackNewMembers = {}

function testUserJoinedDate(msg, from) {
	if (Object.keys(trackNewMembers).includes(from?.username)) {
		const { dateJoined, lastCoolDown } = trackNewMembers[from.username]
		const numDaysSinceJoined = (new Date() - dateJoined) / (1000 * 60 * 60 * 24)
		const minimumDays = 7
		const remainingDays = minimumDays - numDaysSinceJoined.toFixed(2)
		if (numDaysSinceJoined >= minimumDays) {
			delete trackNewMembers[from?.username]
		} else {
			msg.deleteMessage()
			const hoursSinceLastSorry = !!lastCoolDown && (new Date() - lastCoolDown) / (1000 * 60 * 60)
			if (lastCoolDown === null || hoursSinceLastSorry > 3) {
				msg.reply(
					`Sorry @${from.username}, you cannot send photos, videos, gifs, or documents until you've been in the chat for at least ${minimumDays} days. You have ${remainingDays} days remaining.`,
				)
				trackNewMembers[from.username].lastCoolDown = new Date()
			}
		}
	}
}

/*
	bot.on('text', (ctx) => {
		// Explicit usage
		ctx.telegram.sendMessage(ctx.message.chat.id, `Hello ${ctx.state.role}`)

		// Using context shortcut
		ctx.reply(`Hello ${ctx.state.role}`)
	})
*/
bot.on('photo', (ctx) => {
	const message = ctx?.update?.message
	if (message) {
		const { from } = message
		ctx.reply(`${from?.username} sent a photo.`)
		testUserJoinedDate(ctx, from)
	}
})
bot.on('animation', (ctx) => {
	const message = ctx?.update?.message
	if (message) {
		const { from } = message
		ctx.reply(`${from?.username} sent a gif or something.`)
		testUserJoinedDate(ctx, from)
	}
})
bot.on('video', (ctx) => {
	const message = ctx?.update?.message
	if (message) {
		const { from } = message
		ctx.reply(`${from?.username} sent a video.`)
		testUserJoinedDate(ctx, from)
	}
})
bot.on('document', (ctx) => {
	const message = ctx?.update?.message
	if (message) {
		const { from } = message
		ctx.reply(`${from?.username} sent a document.`)
		testUserJoinedDate(ctx, from)
	}
})
bot.on('sticker', (ctx) => ctx.reply('Yo, nice sticker bro 👍'))

bot.hears('hello', (ctx) => {
	ctx.reply('Hello! I\'m the super cool chat bot. 😏')
})

bot.command('lambda', Telegraf.reply('λ'))
bot.command('quit', (ctx) => {
	ctx.telegram.leaveChat(ctx.message.chat.id) // Explicit usage
	ctx.leaveChat() // Using context shortcut
})

bot.on('message', (msg) => {
	if (msg?.update?.message?.new_chat_members !== undefined) {
		const message = msg?.update?.message
		const { username, id } = message.new_chat_member.username
		// eslint-disable-next-line no-console
		console.log(`The following member joined: "${username}", with ID: ${id}`)

		trackNewMembers[message.new_chat_member.username] = {
			userID: message.new_chat_member.id,
			dateJoined: new Date(),
			lastCoolDown: null,
		}
	}
})

// bot.hears waits for the user to pass in a keyword that triggers a message or
// action by the bot. It accepts the first parameter to be a keyword and then an
// arrow function which has ctx.reply
bot.launch()

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
