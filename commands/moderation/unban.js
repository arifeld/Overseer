// Discord.js modules
const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.
// Node modules
const path = require("path")
// Custom modules.
const base    = require(path.join(__dirname, "../../custom_modules/base.js"))
const modBase = require(path.join(__dirname, "../../custom_modules/modBase.js"))
const botConfig = require(path.join(__dirname, "../../settings/botConfig.json"))


module.exports = class UnBan extends Command {
	constructor(client) {
		super(client, {
			name: "unban",
			group: "moderation",
			memberName: "unban",
			description: "Unbans the user.",
			guildOnly: true,
      args: [
          {
            key: "userid",
            prompt: "which user would you like to unban (you must give a userID)?",
            type: "string"
        },
        {
            key: "reason",
            prompt: "what is the unban reason? (Optional)",
            type: "string",
            default: ""
        }
      ]
		})
	}


	async run(msg, args){
    const {userid, reason} = args;

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
    if (msg.guild.members.has(userid) && (msg.member == msg.guild.members.get(userid))){
        const errorEmbed = new RichEmbed()
			.setTitle("**You cannot unban yourself!**")
            .setDescription("Why are you trying to, anyway?")
            .setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
			.setColor(0xFF0000)
		return msg.embed(errorEmbed)
    }

    // Check if the user is actually banned.
    let userBanned = false
    await msg.guild.fetchBans()
        .then( banList => {
            if (banList.has(userid)){
                userBanned = true
            }
        })

    if (!userBanned){ // they're not banned, error out.
        const errorEmbed = new RichEmbed()
			.setTitle("**That user is not banned!**")
            .setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
			.setColor(0xFF0000)
		return msg.embed(errorEmbed)
    }

    let serverInfo = base.getServerInfo(msg)
    serverInfo.caseNumber = (serverInfo.caseNumber + 1)
    let caseNumber = serverInfo.caseNumber
	let modLog     = serverInfo.modLog    || {}
	let banTimers  = serverInfo.banTimers || {}


    let dateVal = new Date()
	let unbanTimestamp = dateVal.getTime()

    if (userid in modLog){
        let userInfo = modLog[userid]
        // Because they're banned, we can assume that the most recent ban has not expired. Thus the most recent ban needs to be edited.
        // If it can't find the object, it shouldn't really matter, this should only occur for people who were banned before the bot joined.
        for (let i = userInfo.length - 1 ; i >= 0; i--){
            if (userInfo[i].action == "ban"){ // This must be the most recent ban.
                // Set it to "unbanned".
                userInfo[i].unbanned = true
                break
            }
        }
    }


	// Add the unban to the mod log.
	// If they already have had a mod action against them.
	if (userid in modLog){
		let userLogs = modLog[userid]
		let logObject = {
			case: caseNumber,
			action: "unban",
            reason: (reason == "" ? "None given" : reason),
			mod: msg.member.id,
			timestamp: unbanTimestamp
		}
		userLogs.push(logObject)

	}
	// If they haven't, we need to add the array to the object.\
    // This really shouldn't happen, but could still.
	else {
		let logObject = {
			case: caseNumber,
			action: "unban",
            reason: (reason == "" ? "None given" : reason),
			mod: msg.member.id,
			timestamp: unbanTimestamp
		}
		modLog[userid] = [logObject]
	}

    // We need to get information about the user, which we might not have.
    this.client.fetchUser(userid)
        .then( user => {
            const embed = new RichEmbed()
              .setColor(0x00FF00)
              .setAuthor("Member Unbanned", user.avatarURL)
              .setFooter("Case Number: " + caseNumber)
              .setTimestamp(unbanTimestamp)
              .addField("**User:**", user, true)
              .addField("**Reason:**", reason == "" ? "None given" : reason, true)
              .addField("**Moderator:**", msg.member, true)
            msg.channel.send(embed)
                .then(embedMsg => {
                    const logEmbed = new RichEmbed()
                    .setColor(0x00FF00)
                    .addField("**New Mod Action:**", msg.member + " unbanned " + (user || user.user.username) + (reason !== "" ? " for " + "`" + reason + "`" : ""))
                    .addField("Command:", "[View Message](" + embedMsg.url + ")")
                    .setTimestamp(unbanTimestamp)
                    .setFooter("Case Number: " + caseNumber)
                    msg.guild.channels.get(botConfig.modLogChannel).send({embed: logEmbed})
                })

            // Send a message to the user, detailing that they have been unbanned.
            user.createDM()
            .then( dmChannel => {
                const unbanEmbed = new RichEmbed()
                    .setTitle("**You have been unbanned from " + msg.guild.name + ".**")
                    .setDescription("Please read the rules once you rejoin.")
                    .setFooter("Case Number: " + caseNumber)
                    .setTimestamp(new Date())
                    .setColor(0x00FF00)

                dmChannel.send({embed: unbanEmbed})
                .catch(err => {
                    // we can't actually send the message to the user, because they aren't on the server, notify the staff.
                    const errorEmbed = new RichEmbed()
                        .addField("**Unable to send DM to user notifying them of the unban.**", "You will have to manually let the user know that they have been unbanned.")
                        .setColor(0xFF0000)
                    msg.embed(errorEmbed)
                })
            })
        })



    // Delete the timer, if it exists.
    if (userid in banTimers){
        delete banTimers[userid]
    }


	// Actually unban the user on the server.
	msg.guild.unban(userid, {
		reason: "(CASE " + caseNumber + "): " + reason + " - " + (msg.member.nickname || msg.member.user.username)
	})
	.then(console.log("User: " + userid + " unbanned."))




    base.saveServerInfo(msg, serverInfo)
	 }
}
