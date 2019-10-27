// Discord.js modules
const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.
// Node modules
const path = require("path")
// Custom modules.
const base    = require(path.join(__dirname, "../../custom_modules/base.js"))
const modBase = require(path.join(__dirname, "../../custom_modules/modBase.js"))

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

	// There isn't a tempban feature, so we're going to BAN, then create a timer
    let dateVal = new Date()
	let unbanTimestamp = dateVal.getTime()

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
              .addField("User: ", user, true)
              .addField("Moderator:", msg.member, true)
            msg.channel.send(embed)

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
            })
        })




	// Actually unban the user on the server.
	msg.guild.unban(userid, {
		reason: "(CASE " + caseNumber + "): " + reason + " - " + (msg.member.nickname || msg.member.user.username)
	})
	.then(console.log("User: " + userid + " unbanned."))




    base.saveServerInfo(msg, serverInfo)
	 }
}
