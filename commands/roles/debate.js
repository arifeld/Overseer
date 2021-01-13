const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.

const path = require("path")
const botConfig = require(path.join(__dirname, "../../settings/botConfig.json"))
const base = require(path.join(__dirname, "../../custom_modules/base.js"))

const humanizeDuration = require("humanize-duration")

module.exports = class AddDebate extends Command {
	constructor(client) {
		super(client, {
			name: "debate",
			group: "roles",
			memberName: "debate",
			description: "Gives you access to the #debate channel!",
			guildOnly: true,
		})
	}


	run(msg, args){
    	let serverInfo = base.getServerInfo(msg)
      let botCommandChannels = ["626964246693019679", "715167785734504548"]
      let debateRole = "718960170893574256"
      let restrictedRole = "715883841771929670"
      if (!botCommandChannels.includes(msg.channel.id)){
        return
      }
      // If they have the role, remove it.
      if (msg.member.roles.has(debateRole)){
        msg.member.removeRole(debateRole, "User used the /debate command.")
        const removeEmbed = new RichEmbed()
          .setDescription("Successfully removed the debate role from " + msg.member + ".")
        msg.delete()
        return msg.embed(removeEmbed)
      }
      else{
        if (msg.member.roles.has(restrictedRole)){
          return
        }
        msg.member.addRole(debateRole, "User used the /debate command.")
        const giveEmbed = new RichEmbed()
          .setDescription("Succesfully gave the debate role to " + msg.member + ".")
        msg.delete()
        return msg.embed(giveEmbed)
      }
    }
}
