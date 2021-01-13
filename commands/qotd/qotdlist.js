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
const botConfig = require(path.join(__dirname, "../../settings/botConfig.json"))


module.exports = class QOTDList extends Command {
    constructor(client) {
        super(client, {
            name: "qotdlist",
            group: "qotd",
            memberName: "qotdlist",
            description: "Lists all the Questions of the Day in queue.",
            guildOnly: true

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


    async run(msg) {

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
        if (!("qotdList" in serverInfo)) {
            serverInfo.qotdList = []
        }

        let qotdList = serverInfo.qotdList
        // If there are no QOTD added
        if (qotdList.length == 0){
            const emptyEmbed = new RichEmbed()
                .setColor(0xFF0000)
                .setAuthor(msg.member.displayName, msg.author.avatarURL)
                .setTitle("There are no Questions of the Day to display!")
                .setFooter("You should add some using `/addqotd <question>`")

            return msg.embed(emptyEmbed)
        }

        // Otherwise just list them all.

        const qotdEmbed = new RichEmbed()
            .setColor(0x99CCFF)
            .setAuthor(msg.member.displayName, msg.author.avatarURL)
            .setTitle("Question of the Day Queue:")
            .setTimestamp(new Date())

        // Now we have to iterate through every item.
        // Less efficient method but easier to code. First, let's create an array of arrays
        let QOTDValues = []
        for (var i = 0; i < qotdList.length; i++ ){     
            let currentLine = [`QOTD ${i+1} - added by ${msg.guild.members.get(qotdList[i].user).displayName}`, qotdList[i].question]
            QOTDValues.push(currentLine)
        }

        // So now we have all the strings. Because of embed limits though, let's see if we have to split it apart
        // Max 25 fields, let's use 24
        if (QOTDValues.length < 25){
            for (var j=0; j < QOTDValues.length; j++){
                qotdEmbed.addField(QOTDValues[j][0], QOTDValues[j][1])
            }
            return msg.embed(qotdEmbed)
        }
        else{
            for (var j=0; j < 24; j++){
                qotdEmbed.addField(QOTDValues[j][0], QOTDValues[j][1])
            }
            QOTDValues.splice(0, 24)
            return msg.embed(qotdEmbed)
                .then (_embedmsg => {
                    while (QOTDValues.length !== 0){
                        let nextEmbed = new RichEmbed()
                            .setColor(0x99CCFF)
                        if (QOTDValues.length > 24){
                            for (var j=0; j < 24; j++){
                                nextEmbed.addField(QOTDValues[j][0], QOTDValues[j][1])
                            }
                            QOTDValues.splice(0, 24)
                            msg.embed(nextEmbed)
                        }
                        else { // base case, just do the rest of the values
                            for (var j=0; j < QOTDValues.length; j++){
                                nextEmbed.addField(QOTDValues[j][0], QOTDValues[j][1]) 
                            }
                            QOTDValues = [] // stop recursion
                            msg.embed(nextEmbed)
                        }
                    }
                })
        }

        
    }
}
