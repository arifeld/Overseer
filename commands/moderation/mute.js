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
module.exports = class MuteUser extends Command {
	constructor(client) {
		super(client, {
			name: "mute",
			group: "moderation",
			memberName: "mute",
			description: "Mutes the user with a given length and reason.",
			guildOnly: true,
			format: "<user> <length> <reason>",
			argsType: "multiple",
			argsCount: 3
			/*
      args: [
      	{
					key: "user",
					prompt: "which user would you look to mute?",
					type: "member"
					},
				{
					key: "length",
					prompt: "how long should the user be muted for? Set to 0 for a permament mute.",
					type: "string"
				},
				{
					key: "reason",
					prompt: "what is the mute reason?",
					type: "string"
				}
			]*/
		})
	}


	async run(msg, args){
    //const {user, length, reason} = args;

		let user = null
		let length = null
		let reason = null

 		if (args.length == 3){
			user = args[0]
			length = args[1]
			reason = args[2]
		}
		else {
			return msg.embed(base.argError(msg, msg.command.format))
		}

		// now we need to verify things.
		user = await base.verifyMember(this.client, user, msg) // this sends the error message for us
		if (user == undefined){ return }

    // Manually handle user permissions, because commando has terrible formatting.
    if (!msg.member.hasPermission("KICK_MEMBERS")){
        const errorEmbed = new RichEmbed()
            .setTitle("**You do not have permission to use this command!**")
            .setDescription("This command requires the 'Kick Members' permission.")
            .setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
            .setColor(0xFF0000)
        return msg.embed(errorEmbed)
    }

    // Check if the user is trying to mute themselves.
    if (msg.member == user){
        const errorEmbed = new RichEmbed()
			.setTitle("**You cannot mute yourself!**")
            .setDescription("Why are you trying to, anyway?")
            .setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
			.setColor(0xFF0000)
		return msg.embed(errorEmbed)
    }

    // Compare roles, can't mute someone with the same or higher role as you.
    else if (msg.member.highestRole.comparePositionTo(user.highestRole) <= 0 && !(msg.member == msg.guild.owner)){
        const errorEmbed = new RichEmbed()
            .addField("**You cannot mute that user!**", user + " has an equal or higher role in the server than you!")
            .setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
			.setColor(0xFF0000)
		return msg.embed(errorEmbed)
    }

	// Check if the bot is actually able to affect the user.
	else if (!user.manageable){
		const errorEmbed = new RichEmbed()
			.setTitle("Error!")
			.setColor(0xFF0000)
            .setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
			.addField("Unable to mute the specified user.", "I do not have sufficient permissions to mute that user.\nMake sure that my bot role is above all the other user's roles.")
		return msg.embed(errorEmbed)
	}

    // Check that we actually have a mute role:
    if (!("muteRole" in botConfig)){
        return msg.reply("there is no mute role set!")
    }
    else if (msg.guild.roles.get(botConfig.muteRole) == undefined){
        return msg.reply("the mute role set is invalid!")
    }


	let serverInfo = base.getServerInfo(msg)

	let modLog     = serverInfo.modLog    || {}
	let muteTimers  = serverInfo.muteTimers || {}

	let muteTime = convertTime(length)

    if (muteTime < 0){
        return msg.reply("you entered an invalid duration! It cannot be a negative amount of time.")
    }

    let dateVal = new Date()
	let muteTimestamp = dateVal.getTime()
	let adjustedTime = muteTimestamp + muteTime

	let muteLength = muteTime > 0 ? humanizeDuration(muteTime) : "Permanent" // This is a string "duration".


    // Check if the user is already muted
    let userMuted = user.roles.has(botConfig.muteRole)

    let previousMuteInfo = undefined
    if (userMuted){ // they're muted, so we want to update info.
        // Find the most recent mute
        let userInfo = modLog[user.id]
        if (userInfo == undefined){
            return msg.reply("an error occured! Please manually remove the muted role from the user, then retype the command.")
        }
        // Iterate backwards
        for (let i = userInfo.length - 1 ; i >= 0; i--){
            if (userInfo[i].action == "mute"){ // This must be the most recent mute
                // Save info so we can use it later, can't just slice the info because it's a reference and that'll break things.
                previousMuteInfo = {
                    case: userInfo[i].case,
                    length: userInfo[i].length,
                    endTime: userInfo[i].endTime,
                    reason: userInfo[i].reason,
                    mod: userInfo[i].mod,
                    timestamp: userInfo[i].timestamp
                }

                // Now edit the info, because we don't want to create a new case.
                userInfo[i].length = muteTime
                userInfo[i].endTime = adjustedTime
                userInfo[i].reason = reason
                userInfo[i].mod = msg.member.id
                userInfo[i].timestamp = muteTimestamp

                // Mark the mute as edited.
                userInfo[i].edited = true

                break;
            }
        }

        // Now we want to change the mute timer so that they get unmuted.
        let currentMute = user.id in muteTimers
        if (currentMute){
            // If it's a permanent mute, just remove the timer.
            if (muteTime == 0) { delete muteTimers[user.id] }

            // Otherwise adjust the mute length.
            else {
                muteTimers[user.id] = adjustedTime
            }
        }
        // If they were muted before the bot was added, then add the unmute time.
        else {
            muteTimers[user.id] = adjustedTime
        }


    }

    // if they a) aren't muted or b) are muted but we don't have a log about it, then we want to continue making a log.
    // but we can do this by handling what happens if we do have info:
    if (previousMuteInfo !== undefined){
        const updateEmbed = new RichEmbed()
            .setColor(0xFF0000)
            .setAuthor("Member Muted - MUTE EDITED", user.avatarURL)
            .setFooter("Case Number: " + previousMuteInfo.case)
            .setTimestamp(muteTimestamp)
            .addField("**User:**", user, true)
            .addField("**Mute Length:**", muteLength, true)
            .addField("**Mute Reason:**", reason, true)
            .addField("Moderator:", msg.member, true)
            .addField("**MUTE EDITED!**", "Previous Mute Info:")
            .addField("**Mute Length:**", humanizeDuration(previousMuteInfo.length), true)
            .addField("**Mute Reason:**", previousMuteInfo.reason, true)
            .addField("Moderator:", msg.guild.members.get(previousMuteInfo.mod))
        // Send the embed
        msg.embed(updateEmbed) // we don't want a new case to be made.
        .then( embedMsg => {
            // No point sending an updated mute message to the user because there is no way for it to actually send.
            // We now want to send an updated mute message.
            let muteString = muteTime != 0 ? muteLength : "permanent"
            const logEmbed = new RichEmbed()
                .setColor(0xFF0000)
                .addField("**New Mod Action:**", msg.member + " updated the mute on " + (user || user.nickname || user.user.username) + ". New duration is " + muteString + " with the reason " + "`" + reason + "`" )
                .addField("Command:", "[View Message](" + embedMsg.url + ")")
                .setTimestamp(muteTimestamp)
                .setFooter("Case Number: " + previousMuteInfo.case)
            msg.guild.channels.get(botConfig.modLogChannel).send({embed: logEmbed})
        })

        const alertEmbed = new RichEmbed()
    		.setTitle("**Your mute in " + msg.guild.name + " has been edited.**")
    		.setColor(0xFF0000)
    		.setFooter("Case Number: " + previousMuteInfo.case)
    		.addField("New Length: ", muteLength, true)
    		.addField("New Reason: ", reason, true)
    		.setTimestamp(muteTimestamp)

    	user.createDM()
        .then( channel => {
            channel.send({embed: alertEmbed}) // this might be the wrong syntax.
            .catch( err => {
                const errorEmbed = new RichEmbed()
                    .addField("**Unable to send DM to user notifying them of the mute.**", "This shouldn't happen - you should probably contact @Feldma#1776.")
                    .setColor(0xFF0000)
                msg.embed(errorEmbed)

            })
        })

        // return and save
        return base.saveServerInfo(msg, serverInfo)

    }

    // So at this point we should want to create a new case number.

    // Intentionally not changing the caseNumber until we know we actually want a new mute.
    serverInfo.caseNumber = (serverInfo.caseNumber + 1)
    let caseNumber = serverInfo.caseNumber

    // Add them to the mute timers, unless it's a perm mute.
    if (muteTime !== 0){
        muteTimers[user.id] = adjustedTime
    }

    // Add them to the mutePersist table.
    serverInfo.mutePersist.push(user.id)

	// Add the mute to the mod log.
	// If they already have had a mod action against them.
	if (user.id in modLog){
		let userLogs = modLog[user.id]
		let logObject = {
			case: caseNumber,
			action: "mute",
			length: muteTime,
            endTime: adjustedTime,
			reason: reason,
			mod: msg.member.id,
			timestamp: muteTimestamp
		}
		userLogs.push(logObject)

	}
	// If they haven't, we need to add the array to the object.
	else {
		let logObject = {
			case: caseNumber,
			action: "mute",
			length: muteTime,
            endTime: adjustedTime,
			reason: reason,
			mod: msg.member.id,
			timestamp: muteTimestamp
		}
		modLog[user.id] = [logObject]
	}

    const embed = new RichEmbed()
      .setColor(0xFF0000)
      .setAuthor("Member Muted", user.avatarURL)
      .setFooter("Case Number: " + caseNumber)
      .setTimestamp(muteTimestamp)
      .addField("**User:**", user, true)
      .addField("**Mute Length:**", muteLength, true)
      .addField("**Mute Reason:**", reason, true)
      .addField("Moderator:", msg.member, true)

    msg.channel.send(embed)
        .then(embedMsg => {
            // use the correct grammar if the mute is perm.
            let muteString = (" for " + muteLength)
            if (muteTime == 0){
                muteString = " permanently"
            }
            const logEmbed = new RichEmbed()
            .setColor(0xFF0000)
            .addField("**New Mod Action:**", msg.member + " muted " + (user || user.nickname || user.user.username) + muteString + " with the reason " + "`" + reason + "`" )
            .addField("Command:", "[View Message](" + embedMsg.url + ")")
            .setTimestamp(muteTimestamp)
            .setFooter("Case Number: " + caseNumber)
            msg.guild.channels.get(botConfig.modLogChannel).send({embed: logEmbed})
        })

	// Send a message to the user, detailing that they have been mutened.
	const alertEmbed = new RichEmbed()
		.setTitle("**You have been muted in " + msg.guild.name + ".**")
		.setColor(0xFF0000)
		.setFooter("Case Number: " + caseNumber)
		.addField("Mute Length: ", muteLength, true)
		.addField("Mute Reason: ", reason, true)
		.addField("Mute Appeals:", "Please complete [this form](https://forms.gle/4Q96FfLWt1SXatSCA) to appeal your mute.")
		.setTimestamp(muteTimestamp)

	await user.createDM()
    .then( channel => {
        channel.send({embed: alertEmbed}) // this might be the wrong syntax.
        .catch( err => {
            const errorEmbed = new RichEmbed()
                .addField("**Unable to send DM to user notifying them of the mute.**", "This should not happen - you should probably contact @Feldma#1776.")
                .setColor(0xFF0000)
            msg.embed(errorEmbed)

        })
    })


    // Actually mute the user, by granting them the mute role.
    // Because of how mutes work, you can't actually deny the send message permission.
    // As a result, it has to be on a per-channel basis. Let's iterate over all channels and make sure the role cannot talk:
    let muteRole = botConfig.muteRole
    msg.guild.channels.forEach( (value, key) => {
        value.overwritePermissions(user, {"SEND_MESSAGES": false}, "(CASE " + caseNumber + ")")
        if (value.manageable && value.permissionsFor(botConfig.muteRole).has("SEND_MESSAGES")){
            value.overwritePermissions(botConfig.muteRole, {"SEND_MESSAGES": false}, "(OVERSEER) - role permission updated to disallow message sending for the muted role.")
        }
    })


    // Now assign the muted role to the user.
    user.addRole(botConfig.muteRole, "(CASE " + caseNumber + "): " + reason + " - " + muteLength + " - " + (msg.member.nickname || msg.member.user.username))

    return base.saveServerInfo(msg, serverInfo)
	}
}
