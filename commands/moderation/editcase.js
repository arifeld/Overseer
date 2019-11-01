const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.

const path = require("path")

const base = require(path.join(__dirname, "../../custom_modules/base.js"))

module.exports = class RemoveWarn extends Command {
	constructor(client) {
		super(client, {
			name: "removewarn",
			group: "moderation",
			memberName: "removewarn",
			description: "Removes a warn from the user.",
            args: [
                {
                  key: "user",
                  prompt: "which user would you look to unwarn?",
                  type: "member"
                },
                {
                  key: "case",
                  prompt: "what is the case number that you want to remove?",
                  type: "string"
                },
								{
									key: "reason",
									prompt: "what is the new case reason?",
									type: "string"
								}
            ]
		})
	}


	run(msg, args){
        const {user, case, reason} = args;

        // Manually handle user permissions, because commando has terrible formatting.
        if (!msg.member.hasPermission("MANAGE_MESSAGES")){
            const errorEmbed = new RichEmbed()
                .setTitle("**You do not have permission to use this command!**")
                .setDescription("This command requires the 'Manage Messages' permission.")
                .setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
                .setColor(0xFF0000)
            return msg.embed(errorEmbed)
        }

        let serverInfo = base.getServerInfo(msg)
        var userID = user.id
        let modLog = serverInfo.modLog


        // Retrieve data from the user.
        if (userID in modLog){
          // Get the data.
          let logArray = modLog[userID]
          let relevantCase = undefined
          for (var i = 0; i < logArray.length; i++){
            if (logArray[i].case == case){
              // We have the correct case, so let's edit it.
							// Also, save it so we can refer to it after.
							relevantCase = logArray.slice(i,i)
							// Edit the case.
							logArray[i].reason = reason
            }
          }
          if (relevantCase == undefined){
            const errorEmbed = new RichEmbed()
                .setTitle("**There was no case matching the number you provided!**")
                .setAuthor((user.member.nickname || user.user.username), user.user.avatarURL)
                .setColor(0xFF0000)
            return msg.embed(errorEmbed)
          }

          // At this point, we should have the correct case, and it should already be edited.
          // Display information.
          const infoEmbed = new RichEmbed()
              .setTitle("**Case Edited:**")
              .setAuthor((user.member.nickname || user.user.username), user.user.avatarURL)
              .setColor(0x00FF00)
              .setFooter("Case Number Edited: " + case)
              .setTimestamp(new Date())
							// Compile information in an obviously not-adding-a-warn way.
          let embedText = "**Old Reason:** " + relevantCase.reason
          embedText += "\n**Old Moderator:** " + msg.guild.members.get(relevantCase.mod)
          infoEmbed.addField("**Old Info:**", embedText)
					infoEmbed.addField("**New Reason:**", reason)
					infoEmbed.addField("**New Mod:**", msg.member)

					// Also send a message to the user saying the message has been edited.
					const updateEmbed = new RichEmbed()
						.setTitle("**Alert: one of your mod cases has been edited.**")
						.setFooter("Case Number Edited: " + case)
						.addField("**Old Reason:**", relevantCase.reason)
						.addField("**New Reason:**", reason)
          return msg.embed(infoEmbed)
        }
        else {
          // They don't have data, so error out.
          const errorEmbed = new RichEmbed()
              .setTitle("**That person does not have any modlogs!**")
              .setAuthor((user.member.nickname || user.user.username), user.user.avatarURL)
              .setColor(0xFF0000)
          return msg.embed(errorEmbed)
        }


        base.saveServerInfo(msg, serverInfo)
	 }
}
