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
module.exports = class ModLog extends Command {
	constructor(client) {
		super(client, {
			name: "modlog",
			group: "moderation",
			memberName: "modlog",
			description: "Displays mod logs for the given user..",
			guildOnly: true,
            args: [
                {
                    key: "tempuser",
                    prompt: "which user would you like mod logs for?",
                    type: "member|string"
                },
            ],
            aliases: ["modlogs"]
		})
	}


	async run(msg, args){
        const {tempuser} = args;

        // Need to check if we have a member or a string (for when the user is banned), then get the info that we need.
        let username = ""
        let avatarURL = ""
        let userID = ""
        if (typeof tempuser == "object"){
            // This person is a member, so we can just get values directly.
            username = (tempuser.nickname || tempuser.user.username)
            avatarURL = tempuser.user.avatarURL
            userID = tempuser.id
        }
        else if (typeof tempuser == "string"){
            // This is an ID, so they aren't on the server. Have to fetch.
            await this.client.fetchUser(tempuser)
            .then( user => {
                username = user.username
                avatarURL = user.avatarURL
                userID = tempuser
            })
        }


        // Manually handle user permissions, because commando has terrible formatting.
        if (!msg.member.hasPermission("MANAGE_MESSAGES")){
            const errorEmbed = new RichEmbed()
                .setTitle("**You do not have permission to use this command!**")
                .setDescription("This command requires the 'Manage Messages' permission.")
                .setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
                .setColor(0xFF0000)
            return msg.embed(errorEmbed)
        }

        // We want to go and generate an array of objects (probably not the worlds most efficient method, but it'll do) based on a users logs.

    	let serverInfo = base.getServerInfo(msg)
    	let modLog = serverInfo.modLog

        // Retrieve their logs, or error out if they have no logs.
        if (!(userID in modLog)){
            const errorEmbed = new RichEmbed()
                .setTitle("**That user has no associated logs!**")
                .setAuthor(username, avatarURL)
                .setColor(0xFF0000)
            return msg.embed(errorEmbed)
        }

        // They have logs, so let's start formatting them.
        // We just want to procedurally build a embed, or two, or three. Hopefully we don't need 4, as that's quite a lot.
        // This is where it gets a bit tricky!

        // First check if the user is currently banned, because they might be unbanned (and we want to format based on this)
        let userBanned = false
        await msg.guild.fetchBans()
        .then( banList => {
            if (banList.has(userID)){
                userBanned = true
            }
        })

        let userLogs = modLog[userID]
        const infoEmbed = new RichEmbed()
            .setTitle("**Mod Logs for " + username + ":**")
            .setColor(0x800080)
            .setAuthor(username, avatarURL)

				const infoEmbed1 = new RichEmbed()
					.setColor(0x800080)

				const infoEmbed2 = new RichEmbed()
					.setColor(0x800080)

				const infoEmbed3 = new RichEmbed()
					.setColor(0x800080)

				// A few sketchy things so that we can display more than 20 results.
				let lastSent = false
        for (var i = 0; i < userLogs.length; i++){ // need to use this for loop to make sure we are in order:
						lastSent = false
            let logObj = userLogs[i]

						// Check which embed we want to add to.
						var currentEmbed
						if (i < 20){
							currentEmbed = infoEmbed
						}
						if ( i >= 20 && i < 40){
							currentEmbed = infoEmbed1
						}
						if (i >= 40 && i < 60){
							currentEmbed = infoEmbed2
						}
						if (i >= 60 && i < 80){
							currentEmbed = infoEmbed3
						}


            // Now, figure out what we want to do according to the type of log.
            // Case 1: BAN
            if (logObj.action == "ban"){
                let embedHeader = "**Case " + logObj.case + ": Ban**"
                // Check if the ban has expired.
                let banExpired = false
                if ( (new Date()).getTime() > logObj.endTime){
                    embedHeader += " **(EXPIRED)**"
                    banExpired = true
                }
                // Check if they have already been unbanned (and the timer hasn't expired)
                else if (!userBanned){
                    embedHeader += " **(UNBANNED)**"
                    banExpired = true
                }
                let embedContent = ""
                embedContent += ("**Reason:** " + logObj.reason)
                embedContent += ("\n**Length:** " + humanizeDuration(logObj.length))
                // Add time till expiry, if it hasn't already expired.
                if (!banExpired){
                    embedContent += ("\n**Expires:** " + humanizeDuration( logObj.endTime - (new Date()).getTime()))
                }
                embedContent += ("\n**Ban Date:** " + (new Date(logObj.timestamp)).toUTCString())
                embedContent += ("\n**Moderator:** " + msg.guild.members.get(logObj.mod))

                // Add the info to the embed.
                currentEmbed.addField(embedHeader, embedContent)
            }

            // Case 2, UNBAN
            else if (logObj.action == "unban"){
                let embedContent = ""
                embedContent += ("**Reason:** " + logObj.reason)
                embedContent += ("\n**Unban Date:** " + (new Date(logObj.timestamp)).toUTCString())
                embedContent += ("\n**Moderator:** " + msg.guild.members.get(logObj.mod))

                // Add the info to the embed.
                currentEmbed.addField("**Case " + logObj.case + ": Unban**", embedContent)
            }

            // Case 3, KICK
            else if (logObj.action == "kick"){
                let embedContent = ""
                embedContent += ("**Reason:** " + logObj.reason)
                embedContent += ("\n**Kick Date**: " + (new Date(logObj.timestamp)).toUTCString())
                embedContent += ("\n**Moderator:** " + msg.guild.members.get(logObj.mod))

                currentEmbed.addField("**Case " + logObj.case + ": Kick**", embedContent)
            }

            // Case 4, WARN
            else if (logObj.action == "warn"){
                // Check if the warn has expired.
                let embedHeader = ""
                if ( (new Date()).getTime() > logObj.expireDate){
                    // We still want to display it, but cross it off.
                    embedHeader = ("~~**Case " + logObj.case + ": Warn~~ (EXPIRED)**")
                }
                else{
                    embedHeader = ("**Case " + logObj.case + ": Warn**")
                }

                let embedContent = ""
                embedContent += ("**Reason:** " + logObj.reason)
                embedContent += ("**\nWarn Date:** " + (new Date(logObj.timestamp)).toUTCString())
                embedContent += ("**\nModerator:** " + msg.guild.members.get(logObj.mod))

                currentEmbed.addField(embedHeader, embedContent)
            }


						// See if we need to send it.
						if (i == 20 || i == 40 || i = 60){
							lastSent = true
							msg.embed(currentEmbed)
						}
        }
				if (!lastSent){
					msg.embed(currentEmbed)
				}


	}
}
