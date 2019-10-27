// Discord.js modules
const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.
// Node modules
const path = require("path")
// Custom modules.
const base    = require(path.join(__dirname, "../../custom_modules/base.js"))
const modBase = require(path.join(__dirname, "../../custom_modules/modBase.js"))

// Time interpreter.
const convertTime = require("parse-duration")
const humanizeDuration = require("humanize-duration")
module.exports = class AddBan extends Command {
	constructor(client) {
		super(client, {
			name: "ban",
			group: "moderation",
			memberName: "ban",
			description: "Bans the user with a given length and reason, and optionally a length of time to delete messages from the user for.",
			guildOnly: true,
            args: [
                {
                    key: "user",
                    prompt: "Which user would you look to warn?",
                    type: "member"
                },
                {
                    key: "length",
                    prompt: "How long should the user be banned for? Set to 0 for a permament ban.",
                    type: "string"
                },
			    {
				    key: "reason",
				    prompt: "What is the ban reason?",
				    type: "string"
	            }
            ]
		})
	}


	run(msg, args){
    const {user, length, reason} = args;

    // Manually handle user permissions, because commando has terrible formatting.
    if (!msg.member.hasPermission("BAN_MEMBERS")){
        const errorEmbed = new RichEmbed()
            .setTitle("**You do not have permission to use this command!**")
            .setDescription("This command requires the 'Ban Members' permission.")
            .setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
            .setColor(0xFF0000)
        return msg.embed(errorEmbed)
    }

    // Check if the user is trying to ban themselves.
    if (msg.member == user){
        const errorEmbed = new RichEmbed()
			.setTitle("**You cannot ban yourself!**")
            .setDescription("Why are you trying to, anyway?")
            .setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
			.setColor(0xFF0000)
		return msg.embed(errorEmbed)
    }

    // Compare roles, can't ban someone with the same or higher role as you.
    else if (msg.member.highestRole.comparePositionTo(user.highestRole) <= 0 && !(msg.member == msg.guild.owner)){
        const errorEmbed = new RichEmbed()
            .addField("**You cannot ban that user!**", user + " has an equal or higher role in the server than you!")
            .setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
			.setColor(0xFF0000)
		return msg.embed(errorEmbed)
    }

	// Check if the bot is actually able to ban the user.
	else if (!user.bannable){
		const errorEmbed = new RichEmbed()
			.setTitle("Error!")
			.setColor(0xFF0000)
            .setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
			.addField("Unable to ban the specified user.", "I do not have sufficient permissions to ban that user.\nMake sure that my bot role is above all the other user's roles.")
		return msg.embed(errorEmbed)
	}


	let serverInfo = base.getServerInfo(msg)
    serverInfo.caseNumber = (serverInfo.caseNumber + 1)
    let caseNumber = serverInfo.caseNumber
	let modLog     = serverInfo.modLog    || {}
	let banTimers  = serverInfo.banTimers || {}

	let banTime = convertTime(length)

	// There isn't a tempban feature, so we're going to BAN, then create a timer
    let dateVal = new Date()
	let banTimestamp = dateVal.getTime()
	let adjustedTime = banTimestamp + banTime

	let banLength = humanizeDuration(banTime) // This is a string "duration".

	// Information about the ban, dealing if there are two or more bans.
	// overwriteBan:
	// 0 - no current ban, user has been banned for the given amount.
	// 1 - previous ban of less length, user has been banned for the new time.
	// 2 - previous ban of longer length, user has had their ban length shortened.
	// Also check to see if its a perm ban, in which case ignore most of this.

	let overwriteBan = 0
	let previousBanLength = null
	if (banTime !== 0){
		let currentBan = user.id in banTimers
		if (currentBan){
			if (adjustedTime >= banTimers[user.id]){
				overwriteBan = 1
				previousBanLength = banTimers[user.id]
				banTimers[user.id] = adjustedTime
			}
			else{
				overwriteBan = 2
				previousBanLength = banTimers[user.id]
				banTimers[user.id] = adjustedTime
			}
		}
		else {
			banTimers[user.id] = adjustedTime
		}
	}


	// Add the ban to the mod log.
	// If they already have had a mod action against them.
	if (user.id in modLog){
		let userLogs = modLog[user.id]
		let logObject = {
			case: caseNumber,
			action: "ban",
			length: banTime,
            endTime: adjustedTime,
			reason: reason,
			mod: msg.member.id,
			timestamp: banTimestamp
		}
		userLogs.push(logObject)

	}
	// If they haven't, we need to add the array to the object.
	else {
		let logObject = {
			case: caseNumber,
			action: "ban",
			length: banTime,
            endTime: adjustedTime,
			reason: reason,
			mod: msg.member.id,
			timestamp: banTimestamp
		}
		modLog[user.id] = [logObject]
	}

    const embed = new RichEmbed()
      .setColor(0xFF0000)
      .setAuthor("Member Banned", user.user.avatarURL)
      .setFooter("Case Number: " + caseNumber)
      .setTimestamp(banTimestamp)
      .addField("User: ", user, true)
      .addField("Ban Length:", banLength, true)
      .addField("Ban Reason:", reason, true)
      .addField("Moderator:", msg.member, true)
    msg.channel.send(embed)

	// Send a message to the user, detailing that they have been banned.
	const alertEmbed = new RichEmbed()
		.setTitle("**You have been banned from " + msg.guild.name + ".**")
		.setColor(0xFF0000)
		.setFooter("Case Number: " + caseNumber)
		.addField("Ban Length: ", banLength, true)
		.addField("Ban Reason: ", reason, true)
		.setTimestamp(banTimestamp)

	user.createDM()
    .then( channel => {
        channel.send({embed: alertEmbed}) // this might be the wrong syntax.
    })
	// Actually ban the user on the server.
	// Have to ban after sending DM's, because it makes it a bit easier.
	msg.guild.ban(user.id, {
		reason: "(CASE " + caseNumber + "): " + reason + " - " + banLength + " - " + (msg.member.nickname || msg.member.user.username)
	})
	.then(console.log("User: " + user.id + " banned."))




    base.saveServerInfo(msg, serverInfo)
	 }
}
