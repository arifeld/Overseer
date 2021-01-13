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
			description: "Displays mod logs for the given user.",
			guildOnly: true,
      format: "<user>",
			argsType: "single",
			aliases: ["modlogs"]
      /*args: [
      {
          key: "tempuser",
          prompt: "which user would you like mod logs for?",
          type: "member|string"
      },
		],*/

		})
	}


	async run(msg, args){
		if (args == ""){
			return msg.embed(base.argError(msg, msg.command.format))
		}
		let tempuser = undefined
		let username = ""
		let avatarURL = ""
		let userID = ""
		let errorOut = false
		// check if the args is a member
		if (await base.isMember(this.client, args, msg) == true){
			tempuser = await base.parseMember(this.client, args, msg)
			username = (tempuser.nickname || tempuser.user.username)
			avatarURL = tempuser.user.avatarURL
			userID = tempuser.id
		}

		if (tempuser == undefined){ // now we need to see if they are a user
			tempuser = await base.verifyUser(this.client, args, msg)
			if (tempuser == undefined){	return }
			else{
				await this.client.fetchUser(tempuser)
				.then( user => {
						username = user.username
						avatarURL = user.avatarURL
						userID = tempuser.id
				})
				.catch( e => { // nope, not valid, screw you.
						errorOut = true
						const errorEmbed = new RichEmbed()
								.setTitle("**ERROR: something went wrong.**")
								.setDescription("That's odd. This shouldn't really happen. You should let Feldma#1776 know.")
								.setColor(0xFF0000)
						return msg.embed(errorEmbed)
				})
			}

		}




	    if (errorOut){ return }

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

        console.log(userID)

        // Retrieve their logs, or error out if they have no logs.
        if (!(userID in modLog) || modLog[userID].length == 0){
            const errorEmbed = new RichEmbed()
                .setTitle("**That user has no associated logs!**")
                .setAuthor(username, avatarURL)
                .setColor(0xFF0000)
            return msg.embed(errorEmbed)
                .then(_msg => {
                    if (userID in serverInfo.modNotes){
                        const notificationEmbed = new RichEmbed()
                            .setDescription(username + " has associated mod-notes. Please type `/viewnotes " + userID + "` to view them.")

                        msg.embed(notificationEmbed)
                    }
                })
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
                // Check if the ban was edited.
                if ("edited" in logObj){
                    if (logObj.edited) {
                        embedHeader += " - **(EDITED)**"
                    }
                }
                // Check if the ban has expired.
                let banExpired = false
                // Check if they were manually unbanned.
                 if ("unbanned" in logObj){
                    if (logObj.unbanned){
                        embedHeader += " - **(UNBANNED)**"
                        banExpired = true
                    }
                }
                else if ( logObj.length !== 0 && (new Date()).getTime() > logObj.endTime){ // if they're permed, it's not expired.
                    embedHeader += " - **(EXPIRED)**"
                    banExpired = true
                }

                let embedContent = ""
                embedContent += ("**Reason:** " + logObj.reason)
                embedContent += ("\n**Length:** " + ( logObj.length > 0 ? humanizeDuration(logObj.length) : "Permanent"))
                // Add time till expiry, if it hasn't already expired.
                if (!banExpired && logObj.length !== 0){
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
                    embedHeader = ("~~Case " + logObj.case + ": Warn~~ (EXPIRED)")
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

            // Case 5, MUTE
            else if (logObj.action == "mute"){
                let embedHeader = "**Case " + logObj.case + ": Mute**"
                // Check if the ban was edited.
                if ("edited" in logObj){
                    if (logObj.edited) {
                        embedHeader += " - **(EDITED)**"
                    }
                }
                // Check if the ban has expired.
                let muteExpired = false
                // Check if they were manually unbanned.
                 if ("unmuted" in logObj){
                    if (logObj.unmuted){
                        embedHeader += " - **(UNMUTED)**"
                        muteExpired = true
                    }
                }
                else if ( (new Date()).getTime() > logObj.endTime){
                    embedHeader += " - **(EXPIRED)**"
                    muteExpired = true
                }

                let embedContent = ""
                embedContent += ("**Reason:** " + logObj.reason)
                embedContent += ("\n**Length:** " + humanizeDuration(logObj.length))
                // Add time till expiry, if it hasn't already expired.
                if (!muteExpired){
                    embedContent += ("\n**Expires:** " + humanizeDuration( logObj.endTime - (new Date()).getTime()))
                }
                embedContent += ("\n**Mute Date:** " + (new Date(logObj.timestamp)).toUTCString())
                embedContent += ("\n**Moderator:** " + msg.guild.members.get(logObj.mod))

                // Add the info to the embed.
                currentEmbed.addField(embedHeader, embedContent)
            }
            // Case 6, UNMUTE
            else if (logObj.action == "unmute"){
                let embedContent = ""
                embedContent += ("**Reason:** " + logObj.reason)
                embedContent += ("\n**Unmute Date:** " + (new Date(logObj.timestamp)).toUTCString())
                embedContent += ("\n**Moderator:** " + msg.guild.members.get(logObj.mod))

                // Add the info to the embed.
                currentEmbed.addField("**Case " + logObj.case + ": Unmute**", embedContent)
            }
            else if (logObj.action == "restrict"){
                let embedContent = ""
                embedContent += ("**Reason:** " + logObj.reason)
                embedContent += ("\n**Restrict Date:** " + (new Date(logObj.timestamp)).toUTCString())
                embedContent += ("\n**Moderator:** " + msg.guild.members.get(logObj.mod))

                // Add the info to the embed.
                currentEmbed.addField("**Case " + logObj.case + ": Restriction**", embedContent)
            }

            else if (logObj.action == "unrestrict"){
                let embedContent = ""
                embedContent += ("**Reason:** " + logObj.reason)
                embedContent += ("\n**Unrestriction Date:** " + (new Date(logObj.timestamp)).toUTCString())
                embedContent += ("\n**Moderator:** " + msg.guild.members.get(logObj.mod))

                // Add the info to the embed.
                currentEmbed.addField("**Case " + logObj.case + ": Unrestriction**", embedContent)
            }


			// See if we need to send it.
			if (i == 19 || i == 39 || i == 59){
				lastSent = true
				msg.embed(currentEmbed)
			}
        }
		if (!lastSent){
			msg.embed(currentEmbed)
		}

        if (userID in serverInfo.modNotes){
            const notificationEmbed = new RichEmbed()
                .setDescription(username + " has associated mod-notes. Please type `/viewnotes " + userID + "` to view them.")

            msg.embed(notificationEmbed)
        }


	}
}
