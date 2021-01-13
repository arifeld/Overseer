// Discord.js modules
const {
    Command
} = require("discord.js-commando");
const {
    RichEmbed
} = require('discord.js'); // required for message embedding.
// Node modules
const path = require("path")
// Custom modules.
const base = require(path.join(__dirname, "../../custom_modules/base.js"))




module.exports = class RemoveQOTD extends Command {
    constructor(client) {
        super(client, {
            name: "removeqotd",
            group: "qotd",
            memberName: "removeqotd",
            description: "Remove a specific QOTD from the queue.",
            guildOnly: true,
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


    async run(msg, args) {

        // Manually handle user permissions, because commando has terrible formatting.
        if (!msg.member.hasPermission("KICK_MEMBERS") && !msg.member.roles.has(botConfig.QOTDRole)) {
            const errorEmbed = new RichEmbed()
                .setTitle("**You do not have permission to use this command!**")
                .setDescription("This command requires the 'Kick Members' permission.")
                .setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
                .setColor(0xFF0000)
            return msg.embed(errorEmbed)
        }

        let serverInfo = base.getServerInfo(msg)
        let QOTDList = serverInfo.qotdList

        // QOTDList is empty?
        if (QOTDList.length == 0){
            const emptyEmbed = new RichEmbed()
                .setColor(0xFF0000)
                .setAuthor(msg.member.displayName, msg.author.avatarURL)
                .setTitle("There are no Questions of the Day to remove!")
                .setFooter("You should add some using `/addqotd <question>`")

            return msg.embed(emptyEmbed)
        }

        // Check to see if args is legit
        if (isNaN(Number(args)) || Number(args) < 1 || Number(args) > QOTDList.length){
            const errorEmbed = new RichEmbed()
                .setTitle("The argument you specified is invalid!")
                .setDescription(`Command Syntax: \`/removeqotd <number between 1 and ${QOTDList.length}>\``)
                .setAuthor(msg.member.displayName, msg.author.avatarURL)
                .setColor(0xFF0000)
            return msg.embed(errorEmbed)
        }   

        // Otherwise splice the specific value
        let removedValue = QOTDList.splice(Math.floor(Number(args))-1, 1)

        // Display and save
        const successEmbed = new RichEmbed()
            .setColor(0xF8E854)
            .setTitle("QOTD Question Removed")
            .setFooter("Type /qotdlist to view the full QOTD list!")
            .setDescription(`Question Removed: \`${removedValue[0].question}\` by ${msg.guild.members.get(removedValue[0].user)}`)
            .setTimestamp(new Date())
        msg.embed(successEmbed)

        return base.saveServerInfo(msg, serverInfo)
    }
}
