const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.

const path = require("path")

const base = require(path.join(__dirname, "../../custom_modules/base.js"))
const botConfig = require(path.join(__dirname, "../../settings/botConfig.json"))

module.exports = class RemoveCase extends Command {
	constructor(client) {
		super(client, {
			name: "removecase",
			group: "moderation",
			memberName: "removecase",
			description: "Removes a mod log case from the user.",
			guildOnly: true,
      format: "<user> <case number>",
      args: [
          {
            key: "user",
            prompt: "which user would you like to remove a case from?",
            type: "member"
          },
          {
            key: "caseNum",
            prompt: "what is the case number that you want to remove?",
            type: "string"
          }
      ]
		})
	}


	run(msg, args){
        const {user, caseNum} = args;

        // Manually handle user permissions, because commando has terrible formatting.
        if (!msg.member.hasPermission("BAN_MEMBERS")){
            const errorEmbed = new RichEmbed()
                .setTitle("**You do not have permission to use this command!**")
                .setDescription("This command requires the 'Ban Members' permission.")
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
            if (logArray[i].case == caseNum){
              // We have the correct case, so let's delete it.
              /*if (logArray[i].action !== "warn"){
                // It's not a warn, error out.
                const errorEmbed = new RichEmbed()
                    .setTitle("**The case number you provided is not a warn!**")
                    .setAuthor((user.nickname || user.user.username), user.user.avatarURL)
                    .setColor(0xFF0000)
                return msg.embed(errorEmbed)
                break
              }
              else{*/
                // We now want to delete the warn, but save it (splice it) so we can log stuff.
              relevantCase = logArray.splice(i, 1)
              break
              //}
            }
          }
        if (relevantCase == undefined){
            const errorEmbed = new RichEmbed()
                .setTitle("**There was no case matching the number you provided!**")
                .setAuthor((user.nickname || user.user.username), user.user.avatarURL)
                .setColor(0xFF0000)
            return msg.embed(errorEmbed)
          }

          // At this point, we should have the correct case, and it should already be removed from the actual logs.
          // Display information.
          const infoEmbed = new RichEmbed()
              .setTitle("**Case Removed**")
              .setAuthor((user.nickname || user.user.username), user.user.avatarURL)
              .setColor(0x00FF00)
              .setFooter("Case Number Removed: " + caseNum)
              .setTimestamp(new Date())
          // Compile information in an obviously not-adding-a-warn way.
          let embedText = "**Reason:** " + relevantCase[0].reason
          embedText += "\n**Case Date:** " + (new Date(relevantCase[0].timestamp)).toUTCString()
          embedText += "\n**Moderator:** " + msg.guild.members.get(relevantCase[0].mod)
          infoEmbed.addField("**Removed Case Info:**", embedText)
          msg.embed(infoEmbed)
          .then(embedMsg => {
              const logEmbed = new RichEmbed()
              .setColor(0xFF0000)
              .addField("**New Mod Action:**", msg.member + " removed case number " + caseNum + " from " + (user || user.username) )
              .addField("Command:", "[View Message](" + embedMsg.url + ")")
              .setTimestamp(new Date())
              .setFooter("Case Number: " + caseNum)
              msg.guild.channels.get(botConfig.modLogChannel).send({embed: logEmbed})
          })
        }
        else {
          // They don't have data, so error out.
          const errorEmbed = new RichEmbed()
              .setTitle("**That person does not have any modlogs!**")
              .setAuthor((user.nickname || user.user.username), user.user.avatarURL)
              .setColor(0xFF0000)
          msg.embed(errorEmbed)
        }

        return base.saveServerInfo(msg, serverInfo)
	 }
}
