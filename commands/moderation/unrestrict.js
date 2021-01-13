// Discord.js modules
const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.
// Node modules
const path = require("path")
// Custom modules.
const base    = require(path.join(__dirname, "../../custom_modules/base.js"))
const modBase = require(path.join(__dirname, "../../custom_modules/modBase.js"))
const botConfig = require(path.join(__dirname, "../../settings/botConfig.json"))


module.exports = class UnRestrict extends Command {
	constructor(client) {
		super(client, {
			name: "unrestrict",
			group: "moderation",
			memberName: "unrestrict",
			description: "Removes the restriction role from the user.",
			guildOnly: true,
      args: [
          {
            key: "user",
            prompt: "which user would you like to unrestrict?",
            type: "member"
        },
        {
            key: "reason",
            prompt: "what is the unrestriction reason? (Optional)",
            type: "string",
            default: ""
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

    // Check if the user is trying to mute themselves.
    if (msg.guild.members.has(user.id) && (msg.member == msg.guild.members.get(user.id))){
        const errorEmbed = new RichEmbed()
			.setTitle("**You cannot unrestrict yourself!**")
            .setDescription("Why are you trying to, anyway?")
            .setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
			.setColor(0xFF0000)
		return msg.embed(errorEmbed)
    }



    if (!user.roles.has(botConfig.restrictRole)){ // they're not muted, error out.
        const errorEmbed = new RichEmbed()
			.setTitle("**That user is not restricted!**")
            .setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
			.setColor(0xFF0000)
		return msg.embed(errorEmbed)
    }

    let serverInfo = base.getServerInfo(msg)
    serverInfo.caseNumber = (serverInfo.caseNumber + 1)
    let caseNumber = serverInfo.caseNumber
	let modLog     = serverInfo.modLog    || {}
	let restrictTimers  = serverInfo.muteTimers || {}


    let dateVal = new Date()
	let unrestrictTimestamp = dateVal.getTime()

    if (user.id in modLog){
        let userInfo = modLog[user.id]
        // Because they're mutened, we can assume that the most recent mute has not expired. Thus the most recent mute needs to be edited.
        // If it can't find the object, it shouldn't really matter, this should only occur for people who were mutened before the bot joined.
        for (let i = userInfo.length - 1 ; i >= 0; i--){
            if (userInfo[i].action == "restrict"){ // This must be the most recent mute.
                // Set it to "unmuted".
                userInfo[i].unrestricted = true
                break
            }
        }
    }


	// Add the unmute to the mod log.
	// If they already have had a mod action against them.
	if (user.id in modLog){
		let userLogs = modLog[user.id]
		let logObject = {
			case: caseNumber,
			action: "unrestrict",
            reason: (reason == "" ? "None given" : reason),
			mod: msg.member.id,
			timestamp: unrestrictTimestamp
		}
		userLogs.push(logObject)

	}
	// If they haven't, we need to add the array to the object.\
    // This really shouldn't happen, but could still.
	else {
		let logObject = {
			case: caseNumber,
			action: "unrestrict",
            reason: (reason == "" ? "None given" : reason),
			mod: msg.member.id,
			timestamp: unrestrictTimestamp
		}
		modLog[user.id] = [logObject]
	}

    // We need to get information about the user, which we might not have.
    this.client.fetchUser(user.id)
        .then( user => {
            const embed = new RichEmbed()
              .setColor(0x00FF00)
              .setAuthor("Member Unrestricted", user.avatarURL)
              .setFooter("Case Number: " + caseNumber)
              .setTimestamp(unrestrictTimestamp)
              .addField("**User:**", user, true)
              .addField("**Reason:**", reason == "" ? "None given" : reason, true)
              .addField("**Moderator:**", msg.member, true)
            msg.channel.send(embed)
                .then(embedMsg => {
                    const logEmbed = new RichEmbed()
                    .setColor(0x00FF00)
                    .addField("**New Mod Action:**", msg.member + " unrestricted " + (user || user.user.username) + (reason !== "" ? " for " + "`" + reason + "`" : ""))
                    .addField("Command:", "[View Message](" + embedMsg.url + ")")
                    .setTimestamp(unrestrictTimestamp)
                    .setFooter("Case Number: " + caseNumber)
                    msg.guild.channels.get(botConfig.modLogChannel).send({embed: logEmbed})
                })

            // Send a message to the user, detailing that they have been unmuted.
            user.createDM()
            .then( dmChannel => {
                const unrestrictEmbed = new RichEmbed()
                    .setTitle("**You have been unrestricted from " + msg.guild.name + ".**")
                    .setDescription("Please read the rules to ensure you do not get restricted again.")
                    .setFooter("Case Number: " + caseNumber)
                    .setTimestamp(new Date())
                    .setColor(0x00FF00)

                dmChannel.send({embed: unrestrictEmbed})
                .catch(err => {
                    // we can't actually send the message to the user, because they aren't on the server, notify the staff.
                    const errorEmbed = new RichEmbed()
                        .addField("**Unable to send DM to user notifying them of the unrestriction.**", "This shouldn't happen - you should probably contact @Feldma#1776.")
                        .setColor(0xFF0000)
                    msg.embed(errorEmbed)
                })
            })
        })

    // Delete the mute timer.
    if (user.id in restrictTimers){
        delete restrictTimers[user.id]
    }

    // Remove the user from the mute persist.
    for (let i=0; i < serverInfo.restrictPersist; i++){
        if (serverInfo.restrictPersist[i] == userid){
            serverInfo.restrictPersist.splice(i, 1)
        }
    }


	// Remove the mute role.
	user.removeRole(botConfig.restrictRole, "(CASE " + caseNumber + ") - " + reason + " - " + (msg.member.nickname || msg.member.user.username))
    /*msg.guild.channels.forEach( (value, key) => {
        if (value.permissionOverwrites.has(user.id)){
            value.permissionOverwrites.get(user.id).delete()
        }
    })*/

    base.saveServerInfo(msg, serverInfo)
	 }
}
