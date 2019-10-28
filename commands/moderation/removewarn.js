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
                }
            ]
		})
	}


	run(msg, args){
        const {user, case} = args;

        // Manually handle user permissions, because commando has terrible formatting.
        if (!msg.member.hasPermission("KICK_MEMBERS")){
            const errorEmbed = new RichEmbed()
                .setTitle("**You do not have permission to use this command!**")
                .setDescription("This command requires the 'Kick Members' permission.")
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
              // We have the correct case, so let's delete it.
              if (logObj[i].action !== "warn"){
                // It's not a warn, error out.
                const errorEmbed = new RichEmbed()
                    .setTitle("**The case number you provided is not a warn!**")
                    .setAuthor((user.member.nickname || user.user.username), user.user.avatarURL)
                    .setColor(0xFF0000)
                return msg.embed(errorEmbed)
                break
              }
              else{
                // We now want to delete the warn, but save it (splice it) so we can log stuff.
                relevantCase = logObj.splice(i, 1)
                break
              }
            }
          }
          if (relevantCase == undefined){
            const errorEmbed = new RichEmbed()
                .setTitle("**There was no case matching the number you provided!**")
                .setAuthor((user.member.nickname || user.user.username), user.user.avatarURL)
                .setColor(0xFF0000)
            return msg.embed(errorEmbed)
          }

          // At this point, we should have the correct case, and it should already be removed from the actual logs.
          // Display information.
          const infoEmbed = new RichEmbed()
              .setTitle("**Warn Removed**")
              .setAuthor((user.member.nickname || user.user.username), user.user.avatarURL)
              .setColor(0x00FF00)
              .setFooter("Case Number Removed: " + case)
              .setTimestamp(new Date())
          // Compile information in an obviously not-adding-a-warn way.
          let embedText = "**Reason:** " + relevantCase.reason
          embedText += "\n**Warn Date:** " + (new Date(relevantCase.timestamp)).toUTCString()
          embedText += "\n**Moderator:** " + msg.guild.members.get(relevantCase.mod)
          infoEmbed.addField("**Removed Warn Info:**", embedText)
          return msg.embed(errorEmbed)
        }
        else {
          // They don't have data, so error out.
          const errorEmbed = new RichEmbed()
              .setTitle("**That person does not have any modlogs!**")
              .setAuthor((user.member.nickname || user.user.username), user.user.avatarURL)
              .setColor(0xFF0000)
          return msg.embed(errorEmbed)
        }






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

        base.saveServerInfo(msg, serverInfo)
	 }
}
