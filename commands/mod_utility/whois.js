const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.

const path = require("path")

const base = require(path.join(__dirname, "../../custom_modules/base.js"))

module.exports = class WhoIs extends Command {
	constructor(client) {
		super(client, {
			name: "whois",
			group: "mod_utility",
			memberName: "whois",
			description: "Displays information about the user.",
            guildOnly: true,
            argsType: "single"
		})
	}


	async run(msg){

        const args = msg.parseArgs()

        let validArgs = false

        await base.isMember(this.client, args, msg)
            .then( result => {
                validArgs = result
            })

        // Check:
        if (!validArgs){
            const argEmbed = new RichEmbed()
                .setColor(0x8B0000)
                .setAuthor(msg.member.displayName, msg.author.avatarURL)
                .setTitle("Invalid Arguments Provided")
                .setDescription( "Command Usage: `" + this.client.options.commandPrefix + "whois <member>`")
                .setFooter("Please re-enter the command.")
                .setTimestamp(new Date())
            return msg.embed(argEmbed)

        }

        // must be a member - let's check.
        // use Promise.resolve() because it could be a promise.

        Promise.resolve( base.parseMember(this.client, args, msg) )
            .then ( member => {
                if (member == undefined){
                    const argEmbed = new RichEmbed()
                        .setColor(0x8B0000)
                        .setAuthor(msg.member.displayName, msg.author.avatarURL)
                        .setTitle("Unable to find that user!")
                        .setDescription( "Command Usage: `" + this.client.options.commandPrefix + "whois <member>`")
                        .setFooter("Please re-enter the command.")
                        .setTimestamp(new Date())
                    return msg.embed(argEmbed)
                }
                else {
                    const infoEmbed = new RichEmbed()
                        .setColor(0x000000)
                        .setFooter("Member ID: " + member.id)
                        .setTimestamp(new Date())
                        .setDescription(member)
                        .setAuthor(member.user.username + "#" + member.user.discriminator, member.user.avatarURL)
                        .setThumbnail(member.user.avatarURL)
                        .addField("Joined:", member.joinedAt.toDateString() + "\n" + member.joinedAt.toTimeString(), true)
                        .addField("Registered:", member.user.createdAt.toDateString() + "\n" + member.user.createdAt.toTimeString(), true)

                    // iterate over roles
                    let roleString = ""

                    member.roles.forEach( (role, key) => {
                        // Check if it's the @everyone role
                        if (key == msg.guild.id){ return }
                        roleString += (role + " ")
                    })

                    if (roleString == ""){
                        roleString = "No roles."
                    }

                    infoEmbed.addField("Roles [" + (member.roles.size - 1) + "]", roleString)

                    // Iterate over permissions.
                    let roleSer = member.permissions.serialize()
                    let permissionString = ""

                    for (let i=0; i < permissionTypes.length; i++){
                        if (roleSer[permissionTypes[i]]){
                            permissionString += permissions[permissionTypes[i]] + ", "
                        }
                    }

                    // Strip off trailing ","
                    permissionString = permissionString.substring(0, permissionString.length - 2) // there's also a space at the end.

                    if (permissionString == ""){
                        permissionString = "No key permissions"
                    }

                    // Add it.
                    infoEmbed.addField("Key Permissions: ", permissionString)

                    msg.embed(infoEmbed)

                }
            })

    }
}


const permissionTypes = [
    "ADMINISTRATOR",
    "VIEW_AUDIT_LOG",
    "MANAGE_GUILD",
    "MANAGE_ROLES",
    "MANAGE_CHANNELS",
    "KICK_MEMBERS",
    "BAN_MEMBERS",
    "MANAGE_NICKNAMES",
    "MANAGE_EMOJIS",
    "MANAGE_WEBHOOKS",
    "MANAGE_MESSAGES",
    "MENTION_EVERYONE",
    "MUTE_MEMBERS",
    "DEAFEN_MEMBERS",
    "MOVE_MEMBERS"
]

const permissions = {
	ADMINISTRATOR: 'Administrator',
	VIEW_AUDIT_LOG: 'View Audit Log',
	MANAGE_GUILD: 'Manage Server',
	MANAGE_ROLES: 'Manage Roles',
	MANAGE_CHANNELS: 'Manage Channels',
	KICK_MEMBERS: 'Kick Members',
	BAN_MEMBERS: 'Ban Members',
	MANAGE_NICKNAMES: 'Manage Nicknames',
	MANAGE_EMOJIS: 'Manage Emojis',
	MANAGE_WEBHOOKS: 'Manage Webhooks',
	MANAGE_MESSAGES: 'Manage Messages',
	MENTION_EVERYONE: 'Mention Everyone',
	MUTE_MEMBERS: 'Mute Members',
	DEAFEN_MEMBERS: 'Deafen Members',
	MOVE_MEMBERS: 'Move Members'
};
