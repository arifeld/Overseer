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
module.exports = class RestrictUser extends Command {
	constructor(client) {
		super(client, {
			name: "restrict",
			group: "moderation",
			memberName: "restrict",
			description: "Restricts the user from accessing the serious channels.",
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
			.setTitle("**You cannot restrict yourself!**")
            .setDescription("Why are you trying to, anyway?")
            .setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
			.setColor(0xFF0000)
		return msg.embed(errorEmbed)
    }

    // Compare roles, can't mute someone with the same or higher role as you.
    else if (msg.member.highestRole.comparePositionTo(user.highestRole) <= 0 && !(msg.member == msg.guild.owner)){
        const errorEmbed = new RichEmbed()
            .addField("**You cannot restrict that user!**", user + " has an equal or higher role in the server than you!")
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
			.addField("Unable to restrict the specified user.", "I do not have sufficient permissions to restrict that user.\nMake sure that my bot role is above all the other user's roles.")
		return msg.embed(errorEmbed)
	}

    // Check that we actually have a mute role:
    if (!("restrictRole" in botConfig)){
        return msg.reply("there is no restrict role set!")
    }
    else if (msg.guild.roles.get(botConfig.restrictRole) == undefined){
        return msg.reply("the restrict role set is invalid!")
    }


	let serverInfo = base.getServerInfo(msg)
    if (serverInfo.restrictTimers == undefined){
        serverInfo.restrictTimers = {}
    }

	let modLog     = serverInfo.modLog    || {}
	let restrictTimers  = serverInfo.restrictTimers || {}

	let restrictTime = convertTime(length)

    if (restrictTime < 0){
        return msg.reply("you entered an invalid duration! It cannot be a negative amount of time.")
    }

    let dateVal = new Date()
	let restrictTimestamp = dateVal.getTime()
	let adjustedTime = restrictTimestamp + restrictTime

	let restrictLength = restrictTime > 0 ? humanizeDuration(restrictTime) : "Permanent" // This is a string "duration".


    // Check if the user is already muted
    let userRestricted = user.roles.has(botConfig.restrictRole)

    let previousRestrictInfo = undefined
    if (userRestricted){ // they're muted, so we want to update info.
        // Find the most recent mute
        let userInfo = modLog[user.id]
        if (userInfo == undefined){
            return msg.reply("an error occured! Please manually remove the restricted role from the user, then retype the command.")
        }
        // Iterate backwards
        for (let i = userInfo.length - 1 ; i >= 0; i--){
            if (userInfo[i].action == "restrict"){ // This must be the most recent mute
                // Save info so we can use it later, can't just slice the info because it's a reference and that'll break things.
                previousRestrictInfo = {
                    case: userInfo[i].case,
                    length: userInfo[i].length,
                    endTime: userInfo[i].endTime,
                    reason: userInfo[i].reason,
                    mod: userInfo[i].mod,
                    timestamp: userInfo[i].timestamp
                }

                // Now edit the info, because we don't want to create a new case.
                userInfo[i].length = restrictTime
                userInfo[i].endTime = adjustedTime
                userInfo[i].reason = reason
                userInfo[i].mod = msg.member.id
                userInfo[i].timestamp = restrictTimestamp

                // Mark the mute as edited.
                userInfo[i].edited = true

                break;
            }
        }

        // Now we want to change the mute timer so that they get unmuted.
        let currentRestrict = user.id in restrictTimers
        if (currentRestrict){
            // If it's a permanent mute, just remove the timer.
            if (restrictTime == 0) { delete restrictTimers[user.id] }

            // Otherwise adjust the mute length.
            else {
                restrictTimers[user.id] = adjustedTime
            }
        }
        // If they were muted before the bot was added, then add the unmute time.
        else {
            restrictTimers[user.id] = adjustedTime
        }


    }

    // if they a) aren't muted or b) are muted but we don't have a log about it, then we want to continue making a log.
    // but we can do this by handling what happens if we do have info:
    if (previousRestrictInfo !== undefined){
        const updateEmbed = new RichEmbed()
            .setColor(0xFF0000)
            .setAuthor("Member Restricted - RESTRICT EDITED", user.avatarURL)
            .setFooter("Case Number: " + previousRestrictInfo.case)
            .setTimestamp(restrictTimestamp)
            .addField("**User:**", user, true)
            .addField("**Restrict Length:**", restrictLength, true)
            .addField("**Restrict Reason:**", reason, true)
            .addField("Moderator:", msg.member, true)
            .addField("**RESTRICT EDITED!**", "Previous Mute Info:")
            .addField("**RESTRICT Length:**", humanizeDuration(previousRestrictInfo.length), true)
            .addField("**RESTRICT Reason:**", previousRestrictInfo.reason, true)
            .addField("Moderator:", msg.guild.members.get(previousRestrictInfo.mod))
        // Send the embed
        msg.embed(updateEmbed) // we don't want a new case to be made.
        .then( embedMsg => {
            // No point sending an updated mute message to the user because there is no way for it to actually send.
            // We now want to send an updated mute message.
            let restrictString = restrictTime != 0 ? restrictLength : "permanent"
            const logEmbed = new RichEmbed()
                .setColor(0xFF0000)
                .addField("**New Mod Action:**", msg.member + " updated the restriction on " + (user || user.nickname || user.user.username) + ". New duration is " + restrictString + " with the reason " + "`" + reason + "`" )
                .addField("Command:", "[View Message](" + embedMsg.url + ")")
                .setTimestamp(restrictTimestamp)
                .setFooter("Case Number: " + previousRestrictInfo.case)
            msg.guild.channels.get(botConfig.modLogChannel).send({embed: logEmbed})
        })

        const alertEmbed = new RichEmbed()
    		.setTitle("**Your restriction in " + msg.guild.name + " has been edited.**")
    		.setColor(0xFF0000)
    		.setFooter("Case Number: " + previousRestrictInfo.case)
    		.addField("New Length: ", restrictLength, true)
    		.addField("New Reason: ", reason, true)
    		.setTimestamp(restictTimestamp)

    	user.createDM()
        .then( channel => {
            channel.send({embed: alertEmbed}) // this might be the wrong syntax.
            .catch( err => {
                const errorEmbed = new RichEmbed()
                    .addField("**Unable to send DM to user notifying them of the restriction.**", "This shouldn't happen - you should probably contact @Feldma#1776.")
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
    if (restrictTime !== 0){
        restrictTimers[user.id] = adjustedTime
    }

    // Add them to the mutePersist table.
    serverInfo.restrictPersist.push(user.id)

	// Add the mute to the mod log.
	// If they already have had a mod action against them.
	if (user.id in modLog){
		let userLogs = modLog[user.id]
		let logObject = {
			case: caseNumber,
			action: "restrict",
			length: restrictTime,
            endTime: adjustedTime,
			reason: reason,
			mod: msg.member.id,
			timestamp: restrictTimestamp
		}
		userLogs.push(logObject)

	}
	// If they haven't, we need to add the array to the object.
	else {
		let logObject = {
			case: caseNumber,
			action: "restrict",
			length: restrictTime,
            endTime: adjustedTime,
			reason: reason,
			mod: msg.member.id,
			timestamp: restrictTimestamp
		}
		modLog[user.id] = [logObject]
	}

    const embed = new RichEmbed()
      .setColor(0xFF0000)
      .setAuthor("Member Restricted", user.avatarURL)
      .setFooter("Case Number: " + caseNumber)
      .setTimestamp(restrictTimestamp)
      .addField("**User:**", user, true)
      .addField("**Restriction Length:**", restrictLength, true)
      .addField("**Restriction Reason:**", reason, true)
      .addField("Moderator:", msg.member, true)

    msg.channel.send(embed)
        .then(embedMsg => {
            // use the correct grammar if the mute is perm.
            let restrictString = (" for " + restrictLength)
            if (restrictTime == 0){
                restrictString = " permanently"
            }
            const logEmbed = new RichEmbed()
            .setColor(0xFF0000)
            .addField("**New Mod Action:**", msg.member + " restricted " + (user || user.nickname || user.user.username) + restrictString + " with the reason " + "`" + reason + "`" )
            .addField("Command:", "[View Message](" + embedMsg.url + ")")
            .setTimestamp(restrictTimestamp)
            .setFooter("Case Number: " + caseNumber)
            msg.guild.channels.get(botConfig.modLogChannel).send({embed: logEmbed})
        })

	// Send a message to the user, detailing that they have been mutened.
	const alertEmbed = new RichEmbed()
		.setTitle("**You have been restricted in " + msg.guild.name + ".**")
		.setColor(0xFF0000)
		.setFooter("Case Number: " + caseNumber)
		.addField("Restrict Length: ", restrictLength, true)
		.addField("Restrict Reason: ", reason, true)
		.addField("Restrict Appeals:", "Please complete [this form](https://forms.gle/4Q96FfLWt1SXatSCA) to appeal your restriction.")
		.setTimestamp(restrictTimestamp)

	await user.createDM()
    .then( channel => {
        channel.send({embed: alertEmbed}) // this might be the wrong syntax.
        .catch( err => {
            const errorEmbed = new RichEmbed()
                .addField("**Unable to send DM to user notifying them of the restriction.**", "This should not happen - you should probably contact @Feldma#1776.")
                .setColor(0xFF0000)
            msg.embed(errorEmbed)

        })
    })


    // Actually mute the user, by granting them the mute role.
    // Because of how mutes work, you can't actually deny the send message permission.
    // As a result, it has to be on a per-channel basis. Let's iterate over all channels and make sure the role cannot talk:
    let restrictRole = botConfig.restrictRole
    /*msg.guild.channels.forEach( (value, key) => {
        value.overwritePermissions(user, {"SEND_MESSAGES": false}, "(CASE " + caseNumber + ")")
        if (value.manageable && value.permissionsFor(botConfig.restrictRole).has("SEND_MESSAGES")){
            value.overwritePermissions(botConfig.restrictRole, {"SEND_MESSAGES": false}, "(OVERSEER) - role permission updated to disallow message sending for the restriction role.")
        }
    })*/


    // Now assign the muted role to the user.
    user.addRole(botConfig.restrictRole, "(CASE " + caseNumber + "): " + reason + " - " + restrictLength + " - " + (msg.member.nickname || msg.member.user.username))

    return base.saveServerInfo(msg, serverInfo)
	}
}
