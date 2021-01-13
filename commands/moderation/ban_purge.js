// Discord.js modules
const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.
// Node modules
const path = require("path")
// Custom modules.
const base    = require(path.join(__dirname, "../../custom_modules/base.js"))
const modBase = require(path.join(__dirname, "../../custom_modules/modBase.js"))
const botConfig = require(path.join(__dirname, "../../settings/botConfig.json"))


// Time interpreter.
const convertTime = require("parse-duration")
const humanizeDuration = require("humanize-duration")
module.exports = class AddBanPurge extends Command {
	constructor(client) {
		super(client, {
			name: "ban_purge",
			group: "moderation",
			memberName: "ban_purge",
			description: "Bans the user with a given length and reason, and also deletes all messages by the user in the given time. *You must add a ban length (or 0 for perm bans) or the reason will format wrong.*",
			guildOnly: true,
            format: "<user> <ban length or 0 for perm> <message delete length in days> <reason>",
            args: [
                {
                    key: "user",
                    prompt: "which user would you look to ban?",
                    type: "user"
                },
                {
                    key: "length",
                    prompt: "how long should the user be banned for? Set to 0 for a permament ban.",
                    type: "string"
                },
                {
                    key: "deleteLength",
                    prompt: "how many days worth of messages should be deleted?",
                    type: "integer"
                },
			    {
				    key: "reason",
				    prompt: "what is the ban reason?",
				    type: "string",
                    default: "None given"
	            }
            ]
		})
	}


	async run(msg, args){
    const {user, length, deleteLength, reason} = args;

    // turn the user into a guild member if it exists.
    let guildMember = msg.guild.members.get(user.id)

    // Manually handle user permissions, because commando has terrible formatting.
    if (!msg.member.hasPermission("BAN_MEMBERS")){
        /*const errorEmbed = new RichEmbed()
            .setTitle("**You do not have permission to use this command!**")
            .setDescription("This command requires the 'Ban Members' permission.")
            .setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
            .setColor(0xFF0000)
        return msg.embed(errorEmbed)*/
				return
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
    else if (guildMember !== undefined && msg.member.highestRole.comparePositionTo(guildMember.highestRole) <= 0 && !(msg.member == msg.guild.owner)){
        const errorEmbed = new RichEmbed()
            .addField("**You cannot ban that user!**", user + " has an equal or higher role in the server than you!")
            .setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
			.setColor(0xFF0000)
		return msg.embed(errorEmbed)
    }

	// Check if the bot is actually able to ban the user.
	else if (guildMember !== undefined && !guildMember.bannable){
		const errorEmbed = new RichEmbed()
			.setTitle("Error!")
			.setColor(0xFF0000)
            .setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
			.addField("Unable to ban the specified user.", "I do not have sufficient permissions to ban that user.\nMake sure that my bot role is above all the other user's roles.")
		return msg.embed(errorEmbed)
	}


	let serverInfo = base.getServerInfo(msg)

	let modLog     = serverInfo.modLog    || {}
	let banTimers  = serverInfo.banTimers || {}

	let banTime = convertTime(length)

    if (banTime < 0){
        return msg.reply("you entered an invalid duration! It cannot be a negative amount of time.")
    }

	// There isn't a tempban feature, so we're going to BAN, then create a timer
    let dateVal = new Date()
	let banTimestamp = dateVal.getTime()
	let adjustedTime = banTimestamp + banTime

	let banLength = banTime > 0 ? humanizeDuration(banTime) : "Permanent" // This is a string "duration".


    // Check if the user is already banned banned.
    let userBanned = false
    await msg.guild.fetchBans()
        .then( banList => {
            if (banList.has(user.id)){
                userBanned = true
            }
        })

    let previousBanInfo = undefined
    if (userBanned){ // they're banned, so we want to update info.
        // Find the most recent ban.
        let userInfo = modLog[user.id]
        // Iterate backwards
        for (let i = userInfo.length - 1 ; i >= 0; i--){
            if (userInfo[i].action == "ban"){ // This must be the most recent ban.
                // Save info so we can use it later, can't just slice the info because it's a reference and that'll break things.
                previousBanInfo = {
                    case: userInfo[i].case,
                    length: userInfo[i].length,
                    endTime: userInfo[i].endTime,
                    reason: userInfo[i].reason,
                    mod: userInfo[i].mod,
                    timestamp: userInfo[i].timestamp
                }

                // Now edit the info, because we don't want to create a new case.
                userInfo[i].length = banTime
                userInfo[i].endTime = adjustedTime
                userInfo[i].reason = reason
                userInfo[i].mod = msg.member.id
                userInfo[i].timestamp = banTimestamp

                // Mark the ban as edited.
                userInfo[i].edited = true

                break;
            }
        }

        // Now we want to change the ban timer so that they get unbanned.
        let currentBan = user.id in banTimers
        if (currentBan){
            // If it's a permanent ban, just remove the timer.
            if (banTime == 0) { delete banTimers[user.id] }

            // Otherwise adjust the ban length.
            else {
                banTimers[user.id] = adjustedTime
            }
        }
        // If they were banned before the bot was added, then add the unban time.
        else {
            banTimers[user.id] = adjustedTime
        }


    }

    // if they a) aren't banned or b) are banned but we don't have a log about it, then we want to continue making a log.
    // but we can do this by handling what happens if we do have info:
    if (previousBanInfo !== undefined){
        const updateEmbed = new RichEmbed()
            .setColor(0xFF0000)
            .setAuthor("Member Banned - BAN EDITED", user.avatarURL)
            .setFooter("Case Number: " + previousBanInfo.case)
            .setTimestamp(banTimestamp)
            .addField("**User:**", user, true)
            .addField("**Ban Length:**", banLength, true)
            .addField("**Ban Reason:**", reason, true)
            .addField("Moderator:", msg.member, true)
            .addField("**BAN EDITED!**", "Previous Ban Info:")
            .addField("**Ban Length:**", humanizeDuration(previousBanInfo.length), true)
            .addField("**Ban Reason:**", previousBanInfo.reason, true)
            .addField("Moderator:", msg.guild.members.get(previousBanInfo.mod))
        // Send the embed
        msg.embed(updateEmbed) // we don't want a new case to be made.
        .then( embedMsg => {
            // No point sending an updated ban message to the user because there is no way for it to actually send.
            // We now want to send an updated ban message.
            let banString = banTime != 0 ? banLength : "permanent"
            const logEmbed = new RichEmbed()
                .setColor(0xFF0000)
                .addField("**New Mod Action:**", msg.member + " updated the ban on " + (guildMember || user.username) + ". New duration is " + banString + " with the reason " + "`" + reason + "`" )
                .addField("Command:", "[View Message](" + embedMsg.url + ")")
                .setTimestamp(banTimestamp)
                .setFooter("Case Number: " + previousBanInfo.case)
            msg.guild.channels.get(botConfig.modLogChannel).send({embed: logEmbed})
        })

        // return and save
        return base.saveServerInfo(msg, serverInfo)

    }

    // So at this point we should want to create a new case number.

    // Intentionally not changing the caseNumber until we know we actually want a new ban.
    serverInfo.caseNumber = (serverInfo.caseNumber + 1)
    let caseNumber = serverInfo.caseNumber

    // Add them to the ban timers, unless it's a perm ban.
    if (banTime !== 0){
        banTimers[user.id] = adjustedTime
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
      .setAuthor("Member Banned", user.avatarURL)
      .setFooter("Case Number: " + caseNumber)
      .setTimestamp(banTimestamp)
      .addField("**User:**", user, true)
      .addField("**Ban Length:**", banLength, true)
      .addField("**Ban Reason:**", reason, true)
      .addField("Moderator:", msg.member, true)

    // Notification if the user isn't actually on the server.
    if (guildMember == undefined){
        embed.addField("Note:", "the banned user was not a part of the server.")
    }
    msg.channel.send(embed)
        .then(embedMsg => {
            // use the correct grammar if the ban is perm.
            let banString = (" for " + banLength)
            if (banTime == 0){
                banString = " permanently"
            }
            const logEmbed = new RichEmbed()
            .setColor(0xFF0000)
            .addField("**New Mod Action:**", msg.member + " banned " + (guildMember || user.username) + banString + " with the reason " + "`" + reason + "`" )
            .addField("Command:", "[View Message](" + embedMsg.url + ")")
            .setTimestamp(banTimestamp)
            .setFooter("Case Number: " + caseNumber)
            msg.guild.channels.get(botConfig.modLogChannel).send({embed: logEmbed})
        })

	// Send a message to the user, detailing that they have been banned.
	const alertEmbed = new RichEmbed()
		.setTitle("**You have been banned from " + msg.guild.name + ".**")
		.setColor(0xFF0000)
		.setFooter("Case Number: " + caseNumber)
		.addField("Ban Length: ", banLength, true)
		.addField("Ban Reason: ", reason, true)
        .addField("Ban Appeals:", "Please complete [this form](https://forms.gle/4Q96FfLWt1SXatSCA) to appeal your ban.")
		.setTimestamp(banTimestamp)

	await user.createDM()
    .then( channel => {
        channel.send({embed: alertEmbed}) // this might be the wrong syntax.
        .catch( err => {
            const errorEmbed = new RichEmbed()
                .addField("**Unable to send DM to user notifying them of the ban.**", "If there is a note in the above message saying the user was not part of the server, that is why.")
                .setColor(0xFF0000)
            msg.embed(errorEmbed)

        })
    })

    // Actually ban the user on the server.
    // Have to ban after sending DM's, because it makes it a bit easier.
    msg.guild.ban(user.id, {
        reason: "(CASE " + caseNumber + "): " + reason + " - " + banLength + " - " + (msg.member.nickname || msg.member.user.username),
        days: deleteLength
    })
    .then(console.log("User: " + user.id + " banned."))


    return base.saveServerInfo(msg, serverInfo)
	}
}
