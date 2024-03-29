const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.

const path = require("path")

const botConfig = require(path.join(__dirname, "../../settings/botConfig.json"))
const base = require(path.join(__dirname, "../../custom_modules/base.js"))

module.exports = class AddWarn extends Command {
	constructor(client) {
		super(client, {
			name: "warn",
			group: "moderation",
			memberName: "warn",
			description: "Warns the user.",
			guildOnly: true,
      format: "<user> <reason>",
			argsType: "multiple",
			argsCount: 2
      /*args: [
          {
            key: "user",
            prompt: "which user would you look to warn?",
            type: "member"
          },
          {
            key: "reason",
            prompt: "what is the warn reason?",
            type: "string"
          }
      ]*/
		})
	}


	async run(msg, args){
		//const {user, reason} = args;
		let user = null
		let reason = "ERROR: this shouldn't work!"
		if (args.length == 2){
			user = args[0]
			reason = args[1]
		}
		else{
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

    // Check if the user is trying to ban themselves.
    if (msg.member == user){
        const errorEmbed = new RichEmbed()
			.setTitle("**You cannot warn yourself!**")
            .setDescription("Why are you trying to, anyway?")
            .setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
			.setColor(0xFF0000)
		return msg.embed(errorEmbed)
    }

    // Compare roles, can't ban someone with the same or higher role as you.
    else if (msg.member.highestRole.comparePositionTo(user.highestRole) <= 0 && !(msg.member == msg.guild.owner)){
        const errorEmbed = new RichEmbed()
            .addField("**You cannot warn that user!**", user + " has an equal or higher role in the server than you!")
            .setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
			.setColor(0xFF0000)
		return msg.embed(errorEmbed)
    }

    let warnTimestamp = (new Date()).getTime()
    let expireObj = new Date()
    expireObj.setMonth(expireObj.getMonth() + 3)

    let expireDate = expireObj.getTime()


    let serverInfo = base.getServerInfo(msg)
    var userID = user.id
    serverInfo.caseNumber = (serverInfo.caseNumber + 1)
    let caseNumber = serverInfo.caseNumber

    let modLog = serverInfo.modLog


    let warnObject = {
      case: caseNumber,
      action: "warn",
      reason: reason,
      timestamp: warnTimestamp,
      mod: msg.member.id,
      expireDate: expireDate
    }

/*
    warnObject = {
      "userID": [
        {
        index: 5
        reason: "bad at programming",
        expireDate: 123152231242344,
        }
      ]
    }
*/
    // Add data to the table.
    if (userID in modLog){
      modLog[userID].push(warnObject)
    }
    else {
      modLog[userID] = [warnObject]
    }

    // DM the user, telling them they've been warned.
    user.user.createDM()
    .then( channel => {
        const warnEmbed = new RichEmbed()
            .setTitle("**You have been warned in " + msg.guild.name + ".**")
            .setColor(0xFFA500)
            .setTimestamp(new Date())
            .addField("Warn Reason:", reason)
            .setFooter("Case Number: " + caseNumber)

        channel.send({embed: warnEmbed})
    })

    const embed = new RichEmbed()
      .setTitle("New Warn:")
      .setColor(0xFFA500)
      .setAuthor((user.nickname || user.user.username), user.user.avatarURL)
      .setFooter("Case Number: " + caseNumber)
      .setTimestamp(new Date())
      .addField("Member Warned:", user, true)
      .addField("Moderator:", msg.member, true)
      .addField("Warn Reason:", reason)
      //.addField("Total Warns:", warnTable[userID].length, true)


    msg.channel.send(embed)
        .then(embedMsg => {
            const logEmbed = new RichEmbed()
            .setColor(0xFFA500)
            .addField("**New Mod Action:**", msg.member + " warned " + (user || user.user.username) + " for " + "`" + reason + "`")
            .addField("Command:", "[View Message](" + embedMsg.url + ")")
            .setTimestamp(new Date())
            .setFooter("Case Number: " + caseNumber)
            msg.guild.channels.get(botConfig.modLogChannel).send({embed: logEmbed})
        })

    base.saveServerInfo(msg, serverInfo)
	 }
}
