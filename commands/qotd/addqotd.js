// Discord.js modules
const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.
// Node modules
const path = require("path")
// Custom modules.
const base    = require(path.join(__dirname, "../../custom_modules/base.js"))
const botConfig = require(path.join(__dirname, "../../settings/botConfig.json"))


module.exports = class AddQOTD extends Command {
	constructor(client) {
		super(client, {
			name: "addqotd",
			group: "qotd",
			memberName: "addqotd",
			description: "Adds a Question of the Day to the bottom of the queue.",
            guildOnly: true,
			format: "<question>",
			argsType: "single"
			/*
      args: [
          {
      		key: "user",
      		prompt: "which user would you look to kick?",
      		type: "member"
      	},
      	{
      		key: "reason",
      		prompt: "what is the kick reason?",
      		type: "string"
      	}
			]*/
  })
	}


	async run(msg, args){
        
        // TODO: see if args is passed as just a string or as an array
        // Assuming it's passed as a string

        
        
		// Manually handle user permissions, because commando has terrible formatting.
		if (!msg.member.hasPermission("KICK_MEMBERS") && !msg.member.roles.has(botConfig.QOTDRole)){
			const errorEmbed = new RichEmbed()
				.setTitle("**You do not have permission to use this command!**")
				.setDescription("This command requires the 'Kick Members' permission.")
				.setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
				.setColor(0xFF0000)
			return msg.embed(errorEmbed)
		}

        if (args == ""){
            return msg.embed(base.argError(msg, msg.command.format))
        }
        

		let serverInfo = base.getServerInfo(msg)
		if (!("qotdList" in serverInfo)){
            serverInfo.qotdList = []
        }
        let qotdList = serverInfo.qotdList

        // Simply push the value
        let qotdObject = {
            question: args,
            user: msg.member.id
        }

        qotdList.push(qotdObject)

        const embed = new RichEmbed()
            .setTimestamp(new Date())
            .setColor(0x006400)
            .setTitle("Successfully added a new QOTD")
            .addField("Question of the Day:", args)
            .setAuthor(msg.member.displayName, msg.author.avatarURL)
            .setFooter("Type /qotdlist to view the full QOTD list!")

		msg.channel.send(embed)

		return base.saveServerInfo(msg, serverInfo)
	}
}
