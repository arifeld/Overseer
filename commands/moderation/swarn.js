const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.

const path = require("path")

const botConfig = require(path.join(__dirname, "../../settings/botConfig.json"))
const base = require(path.join(__dirname, "../../custom_modules/base.js"))

module.exports = class AddWarn extends Command {
	constructor(client) {
		super(client, {
			name: "swarn",
      group: "moderation",
			memberName: "swarn",
			description: "Warns the user.",
	    format: "<user> <reason>",
	    ownerOnly: true,
	    args: [
	        {
	          key: "user",
	          prompt: "Which user would you look to warn?",
	          type: "user"
	        },
	        {
	          key: "reason",
	          prompt: "What is the warn reason?",
	          type: "string"
	        }
	    ]
		})
	}


	run(msg, args){
        const {user, reason} = args;


        // Check if the user is trying to ban themselves.
        if (msg.member == user){
            const errorEmbed = new RichEmbed()
    			.setTitle("**You cannot warn yourself!**")
                .setDescription("Why are you trying to, anyway?")
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
          mod: this.client.user.id,
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


        const embed = new RichEmbed()
          .setTitle("New Warn:")
          .setColor(0xFFA500)
          .setAuthor(user.username, user.avatarURL)
          .setFooter("Case Number: " + caseNumber)
          .setTimestamp(new Date())
          .addField("Member Warned:", user, true)
          .addField("Moderator:", this.client.user.id, true)
          .addField("Warn Reason:", reason + " (IMPORTED)")
          //.addField("Total Warns:", warnTable[userID].length, true)

        msg.embed(embed)

        base.saveServerInfo(msg, serverInfo)
	 }
}
