// Discord.js modules
const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.
// Node modules
const path = require("path")
// Custom modules.
const base    = require(path.join(__dirname, "../../custom_modules/base.js"))
const modBase = require(path.join(__dirname, "../../custom_modules/modBase.js"))

module.exports = class KickUser extends Command {
	constructor(client) {
		super(client, {
			name: "kick",
			group: "moderation",
			memberName: "kick",
			description: "Kicks the user with a specified user.",
	  guildOnly: true,
	  args: [
		{
			key: "user",
			prompt: "which user would you look to kick?",
			type: "member"
		},
		{
			key: "reason",
			prompt: "what is the kick reason?",
			type: "string"
		}
	  ]
		})
	}


	async run(msg, args){
		const {user, reason} = args;

		// Manually handle user permissions, because commando has terrible formatting.
		if (!msg.member.hasPermission("KICK_MEMBERS")){
			const errorEmbed = new RichEmbed()
				.setTitle("**You do not have permission to use this command!**")
				.setDescription("This command requires the 'Kick Members' permission.")
				.setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
				.setColor(0xFF0000)
			return msg.embed(errorEmbed)
		}

		// Check if the user is trying to kick themselves.
	    if (msg.member == user){
	        const errorEmbed = new RichEmbed()
				.setTitle("**You cannot kick yourself!**")
	            .setDescription("Why are you trying to, anyway?")
	            .setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
				.setColor(0xFF0000)
			return msg.embed(errorEmbed)
	    }

	    // Compare roles, can't ban someone with the same or higher role as you.
	    else if (msg.member.highestRole.comparePositionTo(user.highestRole) <= 0 && !(msg.member == msg.guild.owner)){
	        const errorEmbed = new RichEmbed()
	            .addField("**You cannot kick that user!**", user + " has an equal or higher role in the server than you!")
	            .setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
				.setColor(0xFF0000)
			return msg.embed(errorEmbed)
	    }

		// Check if the bot is actually able to kick the user.
		else if (!user.kickable){
			const errorEmbed = new RichEmbed()
				.setTitle("Error!")
				.setColor(0xFF0000)
	            .setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
				.addField("Unable to kick the specified user.", "I do not have sufficient permissions to kick that user.\nMake sure that my bot role is above all the other user's roles.")
			return msg.embed(errorEmbed)
		}

		let dateVal = new Date()
		let kickTimestamp = dateVal.getTime()

		let serverInfo = base.getServerInfo(msg)
		serverInfo.caseNumber = (serverInfo.caseNumber + 1)
		let caseNumber = serverInfo.caseNumber
		let modLog     = serverInfo.modLog    || {}




		// Add the kick to the mod log.
		// If they already have had a mod actio3n against them.
		if (user.id in modLog){
			let userLogs = modLog[user.id]
			let logObject = {
				case: caseNumber,
				action: "kick",
				reason: reason,
				mod: msg.member.id,
				timestamp: kickTimestamp
			}

		userLogs.push(logObject)

		}
		// If they haven't, we need to add the array to the object.
		else {
			let logObject = {
				case: caseNumber,
				action: "kick",
				reason: reason,
				mod: msg.member.id,
				timestamp: kickTimestamp
			}
			modLog[user.id] = [logObject]
		}

		// Alert the user they have been kicked.
		const kickedEmbed = new RichEmbed()
			.setTitle("**You have been kicked from " + msg.guild.name + ".**")
			.setTimestamp(kickTimestamp)
			.setColor(0xFF0000)
			.setFooter("Case Number: " + caseNumber)
			.addField("Kick Reason: ", reason)
			.addField("Moderator: ", (msg.member.nickname || msg.member.user.username))

		await user.createDM()
		.then( channel => {
			channel.send({embed: kickedEmbed})

			// Actually kick the user.
			user.kick("(CASE " + caseNumber + "): " + reason + " - " + (msg.member.nickname || msg.member.user.username))
		})


		const embed = new RichEmbed()
		  .setTitle("User Kicked:")
		  .setColor(0xFF0000)
		  .setAuthor((user.nickname || user.user.username), user.user.avatarURL)
		  .setFooter("Case Number: " + caseNumber)
		  .setTimestamp(kickTimestamp)
		  .addField("Member Kicked:", user, true)
		  .addField("Moderator:", msg.member, true)
		  .addField("Kick Reason:", reason)

		msg.channel.send(embed)

		base.saveServerInfo(msg, serverInfo)
	}
}
