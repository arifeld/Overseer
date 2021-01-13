const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.

const path = require("path")
const botConfig = require(path.join(__dirname, "../../settings/botConfig.json"))
const base = require(path.join(__dirname, "../../custom_modules/base.js"))

const humanizeDuration = require("humanize-duration")

module.exports = class Approve extends Command {
	constructor(client) {
		super(client, {
			name: "approve",
			group: "verification",
			memberName: "approve",
			description: "STAFF: Approves someone from a discord board invite into the server.",
			guildOnly: true,
            args: [
                {
                   key: "user",
                   prompt: "which user would you look to approve?",
                   type: "member"
               }
           ]
		})
	}


	run(msg, args){
        let mainChannel = "625291119604793344"
        const {user} = args
    	let serverInfo = base.getServerInfo(msg)

        if (!msg.member.hasPermission("KICK_MEMBERS")){
			const errorEmbed = new RichEmbed()
				.setTitle("**You do not have permission to use this command!**")
				.setDescription("This command requires the 'Kick Members' permission.")
				.setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
				.setColor(0xFF0000)
			return msg.embed(errorEmbed)
		}



        let verifyChannel = botConfig.verificationBoardChannel
        let unverifiedRole = botConfig.unverifiedBoardRole
        if (msg.channel.id !== verifyChannel){
          return
        }
        // Check if the user has the "Unverified Role"
        if (!user.roles.has(unverifiedRole)){
            const errorEmbed = new RichEmbed()
                .setTitle("**That person does not have the unverified board role!**")
                .setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
                .setColor(0xFF0000)
            return msg.embed(errorEmbed)
        }

        // Remove the unverified role, giving them access to the restricted board role
        user.removeRole(unverifiedRole)
        user.addRole(botConfig.boardMemberRole)

        // get the time 24 hours from now
        if (serverInfo.boardTimers == undefined){
            serverInfo.boardTimers = {}
        }

        let boardTimers = serverInfo.boardTimers
        let dateVal = new Date()
    	let dateTimestamp = dateVal.getTime() + 86400000 // 86400000 = one day

        boardTimers[user.id] = dateTimestamp

        const verifyEmbed = new RichEmbed()
            .setAuthor(user.displayName, user.user.avatarURL)
            .setDescription("User successfully approved by " + msg.member + ".")
        msg.embed(verifyEmbed)

        console.log(boardTimers)
        msg.guild.channels.get(mainChannel).send("Everyone say welcome to " + user + "! " + msg.guild.roles.get("762777006046707732"))

        return base.saveServerInfo(msg, serverInfo)

    }
}
