const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.

const path = require("path");

const base = require(path.join(__dirname, "../../custom_modules/base.js"));
const botConfig = require(path.join(__dirname, "../../settings/botConfig.json"))

module.exports = class EditCase extends Command {
	constructor(client) {
		super(client, {
			name: "editcase",
			group: "moderation",
			memberName: "editcase",
			description: "Edits a case reason based on case number.",
			format: "<user> <case number> <new case reason>",
			guildOnly: true,
			args: [
				{
					key: "user",
					prompt: "which user would you like to edit a case for?",
					type: "user"
				},
				{
					key: "caseNum",
					prompt: "what is the case number that you want to edit?",
					type: "integer"
				},
				{
					key: "reason",
					prompt: "what is the new case reason?",
					type: "string"
				}
			]
		})
	}


	run(msg, args){
				const {user, caseNum, reason} = args;

				// Manually handle user permissions, because commando has terrible formatting.
				if (!msg.member.hasPermission("MANAGE_MESSAGES")){
						const errorEmbed = new RichEmbed()
								.setTitle("**You do not have permission to use this command!**")
								.setDescription("This command requires the 'Manage Messages' permission.")
								.setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
								.setColor(0xFF0000)
						return msg.embed(errorEmbed)
				}

				let serverInfo = base.getServerInfo(msg)
				var userID = user.id
				let modLog = serverInfo.modLog

				// Handle usernames for embeds, since we might have a member not in the guild.
				let guildMember = msg.guild.members.get(user.id)
				let userNick = user.username
				let userAvatar = user.avatarURL
				if (guildMember !== undefined){
						if (guildMember.nickname !== undefined){
								userNick = guildMember.nickname
						}
				}


				// Retrieve data from the user.
				if (userID in modLog){
					// Get the data.
						let logArray = modLog[userID]
						let relevantCase = undefined
						for (var i = 0; i < logArray.length; i++){
						if (logArray[i].case == caseNum){
								console.log(logArray[i])
								// We have the correct case, so let's edit it.
				// Also, save it so we can refer to it after.
								// Because .slice actually results in references, we can't use it like that. Let's create a new object:
								relevantCase = {
										reason: logArray[i].reason,
										mod: logArray[i].mod,
										type: logArray[i].action
								}
								console.log(relevantCase)
				// Edit the case.
				logArray[i].reason = reason
						}
					}
				if (relevantCase == undefined){
						const errorEmbed = new RichEmbed()
								.setTitle("**There was no case matching the number you provided!**")
								.setAuthor(userNick, userAvatar)
								.setColor(0xFF0000)
						return msg.embed(errorEmbed)
				}

						// At this point, we should have the correct case, and it should already be edited.
						// Display information.
						// Figure out what type of action we just edited.
						let caseType = "Unknown"
						switch(relevantCase.type){
								case "warn":
										caseType = "Warn";
										console.log("YEP")
										break;
								case "ban":
										caseType = "Ban";
										break;
								case "unban":
										caseType = "Unban";
										break;
								case "kick":
										caseType = "Kick";
										break;
								default:
										caseType = "Unknown";
										break;
						}

						const infoEmbed = new RichEmbed()
								.setTitle("**Case Edited:**")
								.setAuthor(userNick, userAvatar)
								.setColor(0x00FF00)
								.setFooter("Case Number Edited: " + caseNum)
								.setTimestamp(new Date())
				// Compile information in an obviously not-adding-a-warn way.
						infoEmbed.addField("**Case Type:**", caseType)
						let embedText = "**Old Reason:** " + relevantCase.reason
						embedText += "\n**Old Moderator:** " + msg.guild.members.get(relevantCase.mod)
						infoEmbed.addField("**Old Info:**", embedText, true)
				infoEmbed.addField("**New Reason:**", reason, true)
			infoEmbed.addField("**New Mod:**", msg.member, true)



						// DM the user, telling them they've been warned.
						user.createDM()
						.then( channel => {
								// Also send a message to the user saying the message has been edited.
								if (channel == undefined){ return }
					const updateEmbed = new RichEmbed()
						.setTitle("**Alert: one of your mod cases has been edited.**")
						.setFooter("Case Number Edited: " + caseNum)
										.addField("**Case Type**: ", caseType)
										.addField("**Old Reason:**", relevantCase.reason, true)
						.addField("**New Reason:**", reason, true)

								channel.send({embed: updateEmbed})
								.catch(err => {
										// If we can't actually send the message to the user, because they aren't on the server, notify the staff.
										const errorEmbed = new RichEmbed()
												.addField("**Unable to send DM to user notifying them of the change.**", "This is likely due to them not being a member of the server.")
												.setFooter("The edit has still been recorded.")
												.setColor(0xFF0000)
										msg.embed(errorEmbed)
								})
						})

					msg.embed(infoEmbed)
					.then(embedMsg => {
							const logEmbed = new RichEmbed()
							.setColor(0x00FF00)
							.addField("**New Mod Action:**", msg.member + " edited case number `" + caseNum.toString() + "` for "  + (guildMember || user.username) + " with the reason " + "`" + reason + "`" )
							.addField("Command:", "[View Message](" + embedMsg.url + ")")
							.setTimestamp(new Date())
							.setFooter("Case Number: " + caseNum)
							msg.guild.channels.get(botConfig.modLogChannel).send({embed: logEmbed})
					})
				}
				else {
					// They don't have data, so error out.
					const errorEmbed = new RichEmbed()
							.setTitle("**That person does not have any modlogs!**")
							.setAuthor(userNick, userAvatar)
							.setColor(0xFF0000)
					msg.embed(errorEmbed)
				}


				return base.saveServerInfo(msg, serverInfo)
	 }
}
